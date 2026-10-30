import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  sanitizePlainString,
  sanitizeText,
  isValidCustomerName,
  parsePositiveInt,
} from "../../../lib/security";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const kitchenOnly = searchParams.get("kitchen") === "true";

    const where: Record<string, unknown> = {};

    if (kitchenOnly) {
      where.status = {
        in: ["pending", "processing", "ready"],
      };
    } else if (status && status !== "all") {
      const cleanStatus = sanitizePlainString(status, 20);
      if (["pending", "processing", "ready", "completed", "cancelled"].includes(cleanStatus)) {
        where.status = cleanStatus;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        order_items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limiting: max 10 order creations per 3 minutes per IP to prevent order flooding
    const rateLimit = checkRateLimit(`order:${clientIp}`, 10, 3 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many order requests. Please wait a moment before submitting another order.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const rawCustomerName = sanitizePlainString(body.customer_name, 50);
    const tableIdNum = parsePositiveInt(body.table_id);
    const rawPaymentMethod = sanitizePlainString(body.payment_method || "qris", 30);
    const rawItems = body.items;

    if (!rawCustomerName || !isValidCustomerName(rawCustomerName)) {
      return NextResponse.json(
        { error: "Customer name must be between 2 and 50 characters" },
        { status: 400 }
      );
    }

    if (!tableIdNum) {
      return NextResponse.json(
        { error: "Invalid table selection" },
        { status: 400 }
      );
    }

    // Verify table exists
    const table = await prisma.table.findUnique({
      where: { id: tableIdNum },
    });
    if (!table) {
      return NextResponse.json(
        { error: "Selected dining table not found" },
        { status: 404 }
      );
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
      return NextResponse.json(
        { error: "Orders must contain between 1 and 50 items" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods = ["qris", "bank_transfer", "gopay", "dana", "ovo", "shopeepay"];
    const payment_method = validMethods.includes(rawPaymentMethod) ? rawPaymentMethod : "qris";

    // Validate items structure & prevent injection
    const parsedItems: { product_id: number; quantity: number; notes: string | null }[] = [];
    for (const item of rawItems) {
      const pId = parsePositiveInt(item.product_id);
      const qty = parsePositiveInt(item.quantity);
      if (!pId || !qty || qty > 99) {
        return NextResponse.json(
          { error: "Invalid product item or quantity (1-99)" },
          { status: 400 }
        );
      }
      parsedItems.push({
        product_id: pId,
        quantity: qty,
        notes: item.notes ? sanitizeText(item.notes, 200) : null,
      });
    }

    // Fetch products from database to compute authoritative prices (prevent price manipulation attack)
    const productIds = parsedItems.map((i) => i.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const orderItemsData = parsedItems.map((item) => {
      const prod = productMap.get(item.product_id);
      if (!prod) {
        throw new Error(`Dish item #${item.product_id} not found`);
      }
      if (!prod.is_available) {
        throw new Error(`Dish "${prod.name}" is currently sold out`);
      }
      const price = Number(prod.price);
      const total = price * item.quantity;
      totalAmount += total;

      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price,
        total,
        notes: item.notes,
      };
    });

    // Generate unique order number: ORD-<random 4 digits>
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}${randomSuffix.toString().slice(-2)}`;

    // Create Order and associated records
    const order = await prisma.order.create({
      data: {
        order_number: orderNumber,
        table_id: tableIdNum,
        customer_name: rawCustomerName,
        total_amount: totalAmount,
        status: "pending",
        ordered_at: new Date(),
        order_items: {
          create: orderItemsData,
        },
        payment: {
          create: {
            method: payment_method,
            status: "pending",
            amount: totalAmount,
          },
        },
      },
      include: {
        table: true,
        order_items: {
          include: { product: true },
        },
        payment: true,
      },
    });

    // Mark table as occupied
    await prisma.table.update({
      where: { id: tableIdNum },
      data: { status: "occupied" },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

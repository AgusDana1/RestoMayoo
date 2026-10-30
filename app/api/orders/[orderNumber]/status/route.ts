import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { isAdminAuthenticated } from "../../../../../lib/auth";
import { sanitizePlainString } from "../../../../../lib/security";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  // Authentication check
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Access denied: You must be logged in as an administrator" },
      { status: 401 }
    );
  }

  try {
    const { orderNumber } = await params;
    const cleanOrderNumber = sanitizePlainString(orderNumber, 30);
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["pending", "processing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { order_number: cleanOrderNumber },
      data: { status },
      include: {
        table: true,
        order_items: { include: { product: true } },
        payment: true,
      },
    });

    // If order is completed or cancelled, check if table can be freed
    if (status === "completed" || status === "cancelled") {
      const activeOrders = await prisma.order.count({
        where: {
          table_id: order.table_id,
          status: { in: ["pending", "processing", "ready"] },
        },
      });

      if (activeOrders === 0) {
        await prisma.table.update({
          where: { id: order.table_id },
          data: { status: "available" },
        });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}

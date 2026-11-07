import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isAdminAuthenticated } from "../../../../lib/auth";
import { sanitizePlainString } from "../../../../lib/security";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
      include: {
        table: true,
        order_items: {
          include: {
            product: true,
          },
        },
        payment: true,
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  // Authentication check: Admin only
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Access denied: You must be logged in as an administrator" },
      { status: 401 }
    );
  }

  try {
    const { orderNumber } = await params;
    const cleanOrderNumber = sanitizePlainString(orderNumber, 30);

    const order = await prisma.order.findUnique({
      where: { order_number: cleanOrderNumber },
      include: {
        table: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of completed or cancelled orders
    if (order.status !== "completed" && order.status !== "cancelled") {
      return NextResponse.json(
        {
          error:
            "Hanya pesanan yang sudah selesai (completed) atau dibatalkan (cancelled) yang dapat dihapus oleh admin.",
        },
        { status: 400 }
      );
    }

    // Delete order (cascades to order_items, payment, review)
    await prisma.order.delete({
      where: { id: order.id },
    });

    // Check if table can be freed
    if (order.table_id) {
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

    return NextResponse.json({
      success: true,
      message: `Order #${cleanOrderNumber} has been successfully deleted.`,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

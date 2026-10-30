import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { checkRateLimit, getClientIp, sanitizePlainString } from "../../../../../lib/security";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const clientIp = getClientIp(request);
    const { orderNumber } = await params;
    const cleanOrderNumber = sanitizePlainString(orderNumber, 30);

    // Rate limit: max 10 confirmation attempts per minute per IP
    const rateLimit = checkRateLimit(`pay_confirm:${clientIp}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many confirmation requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { order_number: cleanOrderNumber },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.payment) {
      return NextResponse.json(
        { error: "Payment record for this order was not found" },
        { status: 404 }
      );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: "paid",
        paid_at: new Date(),
      },
    });

    // Also update order status from pending to processing if appropriate
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: order.status === "pending" ? "processing" : order.status,
      },
      include: {
        table: true,
        order_items: { include: { product: true } },
        payment: true,
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isAdminAuthenticated } from "../../../../lib/auth";

export async function GET(request: Request) {
  // Authentication check
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Akses ditolak: Anda harus login sebagai admin" },
      { status: 401 }
    );
  }

  try {
    const [orders, tables, paidPayments] = await Promise.all([
      prisma.order.findMany({
        include: {
          table: true,
          order_items: { include: { product: true } },
          payment: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.table.findMany({
        orderBy: { table_number: "asc" },
      }),
      prisma.payment.findMany({
        where: { status: "paid" },
      }),
    ]);

    const totalRevenue = paidPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const pendingKitchen = orders.filter((o) =>
      ["pending", "processing"].includes(o.status)
    ).length;

    const readyOrders = orders.filter((o) => o.status === "ready").length;

    const occupiedTables = tables.filter((t) => t.status === "occupied").length;
    const availableTables = tables.filter((t) => t.status === "available").length;

    return NextResponse.json({
      totalRevenue,
      totalOrders: orders.length,
      pendingKitchen,
      readyOrders,
      tableStats: {
        total: tables.length,
        occupied: occupiedTables,
        available: availableTables,
      },
      recentOrders: orders.slice(0, 8),
    });
  } catch (error) {
    console.error("Error calculating admin stats:", error);
    return NextResponse.json(
      { error: "Failed to calculate admin stats" },
      { status: 500 }
    );
  }
}

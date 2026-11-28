import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isAdminAuthenticated } from "../../../../lib/auth";

export async function GET(request: Request) {
  // Authentication check
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Access denied: You must be logged in as an administrator" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "all";

    let startDate: Date | undefined;
    const now = new Date();
    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const dateFilter = startDate ? { created_at: { gte: startDate } } : {};

    const [orders, tables, paidPayments] = await Promise.all([
      prisma.order.findMany({
        where: dateFilter,
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
        where: {
          status: "paid",
          ...(startDate ? { created_at: { gte: startDate } } : {}),
        },
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

    // Top selling products aggregation (excluding cancelled orders)
    const productSalesMap = new Map<
      number,
      { name: string; quantity: number; revenue: number }
    >();
    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    for (const order of orders) {
      if (order.status === "cancelled") continue;

      const d = order.created_at ? new Date(order.created_at) : new Date();
      const dateKey = d.toISOString().slice(0, 10);
      const dayEntry = dailyMap.get(dateKey) || { revenue: 0, orders: 0 };
      dayEntry.orders += 1;
      if (order.payment?.status === "paid") {
        dayEntry.revenue += Number(order.total_amount);
      }
      dailyMap.set(dateKey, dayEntry);

      for (const item of order.order_items) {
        const existing = productSalesMap.get(item.product_id) || {
          name: item.product?.name || `Product #${item.product_id}`,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.total);
        productSalesMap.set(item.product_id, existing);
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const dailyRevenue = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, val]) => ({
        date,
        label: new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        revenue: val.revenue,
        orders: val.orders,
      }));

    return NextResponse.json({
      range,
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
      topProducts,
      dailyRevenue,
    });
  } catch (error) {
    console.error("Error calculating admin stats:", error);
    return NextResponse.json(
      { error: "Failed to calculate admin stats" },
      { status: 500 }
    );
  }
}

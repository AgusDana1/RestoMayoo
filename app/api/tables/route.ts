import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { table_number: "asc" },
      include: {
        orders: {
          where: {
            status: { in: ["pending", "processing", "ready"] },
          },
          select: { id: true },
        },
      },
    });

    const formatted = tables.map((t) => {
      const isOccupied = t.orders.length > 0 || t.status === "occupied";
      return {
        id: t.id,
        table_code: t.table_code,
        table_number: t.table_number,
        status: isOccupied ? "occupied" : "available",
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}


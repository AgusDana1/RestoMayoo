import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { isAdminAuthenticated } from "../../../lib/auth";
import { sanitizePlainString, parsePositiveInt } from "../../../lib/security";

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
        active_orders: t.orders.length,
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

export async function POST(request: Request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Access denied: You must be logged in as an administrator" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const tableCode = sanitizePlainString(body.table_code, 20).toUpperCase();
    const tableNumber = parsePositiveInt(body.table_number);

    if (!tableCode || !tableNumber) {
      return NextResponse.json(
        { error: "Table code and positive table number are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.table.findUnique({
      where: { table_code: tableCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Table code ${tableCode} already exists` },
        { status: 409 }
      );
    }

    const table = await prisma.table.create({
      data: {
        table_code: tableCode,
        table_number: tableNumber,
        status: "available",
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}


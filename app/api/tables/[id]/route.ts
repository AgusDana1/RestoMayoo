import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isAdminAuthenticated } from "../../../../lib/auth";
import { sanitizePlainString, parsePositiveInt } from "../../../../lib/security";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Access denied: You must be logged in as an administrator" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const tableId = parsePositiveInt(id);
    if (!tableId) {
      return NextResponse.json({ error: "Invalid table ID" }, { status: 400 });
    }

    const body = await request.json();
    const updateData: { table_code?: string; table_number?: number; status?: string } = {};

    if (body.table_code !== undefined) {
      const code = sanitizePlainString(body.table_code, 20).toUpperCase();
      if (!code) {
        return NextResponse.json({ error: "Invalid table code" }, { status: 400 });
      }
      updateData.table_code = code;
    }

    if (body.table_number !== undefined) {
      const num = parsePositiveInt(body.table_number);
      if (!num) {
        return NextResponse.json({ error: "Invalid table number" }, { status: 400 });
      }
      updateData.table_number = num;
    }

    if (body.status !== undefined) {
      if (body.status !== "available" && body.status !== "occupied") {
        return NextResponse.json({ error: "Invalid table status" }, { status: 400 });
      }
      updateData.status = body.status;
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Failed to update table" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Access denied: You must be logged in as an administrator" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const tableId = parsePositiveInt(id);
    if (!tableId) {
      return NextResponse.json({ error: "Invalid table ID" }, { status: 400 });
    }

    const orderCount = await prisma.order.count({
      where: { table_id: tableId },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        {
          error:
            "Meja tidak dapat dihapus karena masih memiliki riwayat pesanan. Hapus riwayat pesanan selesai terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    await prisma.table.delete({
      where: { id: tableId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 500 }
    );
  }
}

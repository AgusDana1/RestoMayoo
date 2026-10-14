import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isAdminAuthenticated } from "../../../../lib/auth";
import { sanitizePlainString, sanitizeText, parsePositiveInt } from "../../../../lib/security";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication check
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Akses ditolak: Anda harus login sebagai admin" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const productId = parsePositiveInt(id);
    if (!productId) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      data.name = sanitizePlainString(body.name, 100);
    }
    if (body.description !== undefined) {
      data.description = sanitizeText(body.description, 500);
    }
    if (body.price !== undefined) {
      const price = parseFloat(body.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: "Harga tidak valid" }, { status: 400 });
      }
      data.price = price;
    }
    if (body.image !== undefined) {
      data.image = typeof body.image === "string" ? body.image.trim().slice(0, 500) : null;
    }
    if (body.is_available !== undefined) {
      data.is_available = Boolean(body.is_available);
    }
    if (body.category_id !== undefined) {
      const catId = parsePositiveInt(body.category_id);
      if (!catId) {
        return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
      }
      data.category_id = catId;
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: { category: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication check
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Akses ditolak: Anda harus login sebagai admin" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const productId = parsePositiveInt(id);
    if (!productId) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

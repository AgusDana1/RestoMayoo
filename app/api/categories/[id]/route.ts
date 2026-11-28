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
    const categoryId = parsePositiveInt(id);
    if (!categoryId) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const body = await request.json();
    const cleanName = sanitizePlainString(body.name, 50);
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { error: "Category name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { name: cleanName },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category or name already exists" },
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
    const categoryId = parsePositiveInt(id);
    if (!categoryId) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const productCount = await prisma.product.count({
      where: { category_id: categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Kategori tidak dapat dihapus karena masih memiliki ${productCount} menu terkait.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

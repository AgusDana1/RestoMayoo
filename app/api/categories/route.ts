import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { isAdminAuthenticated } from "../../../lib/auth";
import { sanitizePlainString } from "../../../lib/security";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Authentication check
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Access denied: You must be logged in as an administrator" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const cleanName = sanitizePlainString(body.name, 50);

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { error: "Category name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: { name: cleanName },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to add category or category name already exists" },
      { status: 500 }
    );
  }
}

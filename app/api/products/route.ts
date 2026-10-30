import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { isAdminAuthenticated } from "../../../lib/auth";
import { sanitizePlainString, sanitizeText, parsePositiveInt } from "../../../lib/security";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (categoryId && categoryId !== "all") {
      const parsedCatId = parsePositiveInt(categoryId);
      if (parsedCatId) {
        where.category_id = parsedCatId;
      }
    }

    if (search) {
      const cleanSearch = sanitizePlainString(search, 50);
      if (cleanSearch) {
        where.OR = [
          { name: { contains: cleanSearch } },
          { description: { contains: cleanSearch } },
        ];
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
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
    const name = sanitizePlainString(body.name, 100);
    const category_id = parsePositiveInt(body.category_id);
    const price = parseFloat(body.price);
    const description = sanitizeText(body.description, 500);
    const image = typeof body.image === "string" ? body.image.trim().slice(0, 500) : null;
    const is_available = body.is_available !== undefined ? Boolean(body.is_available) : true;

    if (!name || !category_id || isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Name, category, and valid price are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        category_id,
        price,
        description: description || null,
        image: image || null,
        is_available,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

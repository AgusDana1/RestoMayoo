import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

function cleanJsonOutput(raw: string): string {
  let text = (raw || "").trim();
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  if (startIdx !== -1) {
    const isObject = text[startIdx] === "{";
    const lastChar = isObject ? "}" : "]";
    const endIdx = text.lastIndexOf(lastChar);
    if (endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }
  }
  return text.trim();
}

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { created_at: "desc" },
      include: {
        order: {
          select: {
            order_number: true,
            status: true,
            table: {
              select: {
                table_code: true,
              },
            },
            order_items: {
              select: {
                product: {
                  select: { name: true },
                },
                quantity: true,
              },
            },
          },
        },
      },
    });

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    const criticalCount = reviews.filter((r) => r.is_critical).length;

    const categoryBreakdown: Record<string, number> = {};
    reviews.forEach((r) => {
      const cat = r.category || "General";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        avgRating,
        criticalCount,
        categoryBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_number, rating, comment } = body;

    if (!order_number || !rating) {
      return NextResponse.json(
        { error: "Order number and rating (1-5) are required" },
        { status: 400 }
      );
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

    // Find order
    const order = await prisma.order.findUnique({
      where: { order_number },
      include: {
        review: true,
        order_items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.review) {
      return NextResponse.json(
        { error: "A review has already been submitted for this order" },
        { status: 409 }
      );
    }

    const dishesSummary = order.order_items
      .map((item) => `${item.product.name} (x${item.quantity})`)
      .join(", ");

    // AI Analysis via Gemini
    let aiCategory = "General";
    let aiSentiment = numericRating >= 4 ? "positive" : numericRating === 3 ? "neutral" : "negative";
    let isCritical = false;
    let criticalReason: string | null = null;
    let aiSummary = `Customer gave ${numericRating} stars: ${comment ? `"${comment.slice(0, 60)}..."` : "No comment"}`;

    if (comment && comment.trim()) {
      try {
        const prompt = `You are an AI Quality Assurance Manager for "Resto Mayo".
Customer: ${order.customer_name}
Rating: ${numericRating}/5
Comment: "${comment}"
Ordered items: ${dishesSummary}

TASK:
1. Categorize this review into ONE of: "Food Taste", "Service Speed", "Pricing", "Staff & Service", "Hygiene & Cleanliness", or "General".
2. Sentiment: "positive", "neutral", or "negative".
3. Check for CRITICAL COMPLAINT flag (is_critical = true):
   Mark true IF customer mentions: hair/foreign objects/insects in food, hygiene violation, undercooked/spoiled food, cold food that should be served hot, excessive delay (>45 min), or extreme staff misconduct. Otherwise false.
4. If is_critical is true, specify criticalReason.
5. Provide a short 1-sentence manager summary.

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "category": "Food Taste",
  "sentiment": "negative",
  "isCritical": true,
  "criticalReason": "Reason if critical, or null",
  "aiSummary": "Summary sentence"
}`;

        const models = [
          "gemini-flash-lite-latest",
          "gemini-3.5-flash-lite",
          "gemini-3.5-flash",
          "gemini-3.8-flash",
        ];
        for (const m of models) {
          try {
            const resp = await ai.models.generateContent({ model: m, contents: prompt });
            if (resp && resp.text) {
              const parsed = JSON.parse(cleanJsonOutput(resp.text));
              if (parsed.category) aiCategory = parsed.category;
              if (parsed.sentiment) aiSentiment = parsed.sentiment;
              if (typeof parsed.isCritical === "boolean") isCritical = parsed.isCritical;
              if (parsed.criticalReason) criticalReason = parsed.criticalReason;
              if (parsed.aiSummary) aiSummary = parsed.aiSummary;
              break;
            }
          } catch (e) {
            console.warn(`Model ${m} failed for review analysis:`, e);
          }
        }
      } catch (aiErr) {
        console.warn("AI review analysis fallback used:", aiErr);
      }
    }

    const newReview = await prisma.review.create({
      data: {
        order_id: order.id,
        customer_name: order.customer_name,
        rating: numericRating,
        comment: comment ? String(comment).trim().slice(0, 1000) : null,
        category: aiCategory,
        sentiment: aiSentiment,
        is_critical: isCritical,
        critical_reason: criticalReason,
        ai_summary: aiSummary,
      },
    });

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}


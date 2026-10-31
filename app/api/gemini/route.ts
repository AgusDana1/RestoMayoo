import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Helper to clean markdown code blocks from AI JSON response
function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

async function callGemini(contents: string): Promise<string> {
  const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${model} failed, trying fallback:`, err.message || err);
    }
  }

  throw lastError || new Error("Failed to generate content from Gemini");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, prompt } = body;

    // 1. Backwards-compatibility: simple prompt
    if (!action && prompt) {
      const text = await callGemini(prompt);
      return NextResponse.json({ result: text });
    }

    // 2. Action: Smart Upselling & Dynamic Bundling
    if (action === "smart-upsell") {
      const { cartItems, allProducts } = body;
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return NextResponse.json({ recommendations: [], headline: "" });
      }

      const cartSummary = cartItems
        .map((i: any) => `- ${i.name} (Qty: ${i.quantity})`)
        .join("\n");

      const availableItems = (allProducts || [])
        .filter((p: any) => p.is_available && !cartItems.some((ci: any) => ci.id === p.id))
        .map((p: any) => `[ID: ${p.id}] ${p.name} - Rp ${p.price} (${p.description || ""})`)
        .slice(0, 15)
        .join("\n");

      if (!availableItems) {
        return NextResponse.json({ recommendations: [], headline: "" });
      }

      const upsellPrompt = `You are an expert culinary sommelier and sales psychologist for "Resto Mayo", a restaurant known for savory mayonnaise dishes, fried rice, crispy dimsum, and refreshing beverages.

Customer's current cart:
${cartSummary}

Available items in the restaurant catalog (not in cart yet):
${availableItems}

TASK:
Analyze the flavor profile, spice level, texture, and meal completeness of their cart.
Select 1 to 2 PERFECT complementary items to recommend (e.g. if eating spicy or fried dishes, suggest an iced sweet drink or soothing dimsum; if ordering only food, suggest a signature beverage).

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "headline": "Short enticing headline e.g. Perfect pairing for your meal",
  "recommendations": [
    {
      "productId": <number ID from the list>,
      "reason": "1 concise, appetizing sentence why this item pairs perfectly with what they ordered"
    }
  ]
}`;

      const raw = await callGemini(upsellPrompt);
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return NextResponse.json(parsed);
    }

    // 3. Action: Food Copilot (Natural Language Menu Search)
    if (action === "food-copilot") {
      const { query, allProducts } = body;
      if (!query || typeof query !== "string") {
        return NextResponse.json({ error: "Query is required" }, { status: 400 });
      }

      const productCatalog = (allProducts || [])
        .map(
          (p: any) =>
            `[ID: ${p.id}] ${p.name} | Category: ${p.category?.name || "Dish"} | Price: Rp ${p.price} | Desc: ${p.description || ""} | Available: ${p.is_available}`
        )
        .join("\n");

      const copilotPrompt = `You are "Resto Mayo Food Copilot", an AI culinary assistant helping customers find the ideal meal based on their mood, cravings, budget, or dietary needs.

Customer Search Request:
"${query}"

Resto Mayo Available Products:
${productCatalog}

TASK:
1. Interpret what the customer desires (e.g. spicy kick, warm comforting broth, budget under X, sweet snack, vegetarian, for sharing).
2. Select 1 to 4 best matching items from the catalog. Only recommend items that are available.
3. For each recommendation, provide an appetizing, personalized explanation why it matches their request.

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "interpretedMood": "Short summary of what the customer is craving or their criteria",
  "matches": [
    {
      "productId": <number ID from catalog>,
      "matchReason": "1 to 2 engaging sentences explaining why this dish fits their prompt"
    }
  ]
}`;

      const raw = await callGemini(copilotPrompt);
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return NextResponse.json(parsed);
    }

    // 4. Action: Menu Expansion Ideas (Admin CRUD advisor)
    if (action === "menu-ideas") {
      const { currentProducts, categories } = body;

      const currentList = (currentProducts || [])
        .map((p: any) => `- ${p.name} (${p.category?.name || "Dish"}, Rp ${p.price})`)
        .join("\n");

      const categoryList = (categories || []).map((c: any) => c.name).join(", ");

      const ideasPrompt = `You are an elite restaurant culinary consultant and R&D head for "Resto Mayo".
Current Active Menu:
${currentList}

Existing Categories: ${categoryList}

TASK:
Analyze gaps in the current menu (e.g., missing trending flavors, refreshing desserts, healthy greens, viral artisan snacks, or signature dipping creations).
Propose 3 high-profit, exciting new dish concepts that naturally fit the Resto Mayo brand identity.

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "analysis": "Brief 1-sentence market observation of current catalog",
  "ideas": [
    {
      "name": "Creative Dish Name",
      "categoryName": "Existing or recommended category",
      "suggestedPrice": 22000,
      "description": "Sensational culinary storytelling description (20-30 words)",
      "commercialReason": "Why this item will sell well and attract customers"
    }
  ]
}`;

      const raw = await callGemini(ideasPrompt);
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return NextResponse.json(parsed);
    }

    // 5. Action: Generator Deskripsi Menu & Copywriting Promosi
    if (action === "generate-copywriting") {
      const { name, ingredients, category } = body;
      if (!name) {
        return NextResponse.json({ error: "Dish name is required" }, { status: 400 });
      }

      const copyPrompt = `You are a world-class culinary copywriter for "Resto Mayo".
Dish Name: ${name}
Category: ${category || "Specialty"}
Key Ingredients / Highlights: ${ingredients || "Fresh ingredients, signature spices, and Resto Mayo special sauce"}

TASK:
Create 3 high-converting marketing assets for this dish:
1. "description": An appetizing culinary storytelling description for the restaurant menu website (approx 25-40 words). Highlight flavors, textures, and aromas.
2. "tagline": A punchy, memorable promotional tagline for banners and display cards (5-8 words).
3. "socialPromo": An engaging social media / WhatsApp broadcast copy with appropriate emojis and a mouth-watering call to action.

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "description": "string",
  "tagline": "string",
  "socialPromo": "string"
}`;

      const raw = await callGemini(copyPrompt);
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return NextResponse.json(parsed);
    }

    // 6. Action: Analyze Review & Sentiment
    if (action === "analyze-review") {
      const { customerName, rating, comment, orderItems } = body;

      const reviewPrompt = `You are an AI Quality Assurance Manager for "Resto Mayo".
Customer: ${customerName || "Customer"}
Star Rating: ${rating} out of 5
Feedback Comment: "${comment || ""}"
Ordered Dishes: ${orderItems || "Restaurant dishes"}

TASK:
1. Categorize this review into one of: "Food Taste", "Service Speed", "Pricing", "Staff & Service", "Hygiene & Cleanliness", or "General".
2. Determine sentiment: "positive", "neutral", or "negative".
3. Check for CRITICAL COMPLAINT flag (is_critical = true):
   Mark is_critical as true IF the customer mentions any of: foreign object in food, food hygiene/safety/hair/insect, cold food that should be hot, raw/undercooked food, over 45+ min delay, or severe rudeness. Otherwise false.
4. If is_critical, provide the criticalReason.
5. Provide a 1-sentence executive summary for the restaurant manager.

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "category": "Food Taste | Service Speed | Pricing | Staff & Service | Hygiene & Cleanliness | General",
  "sentiment": "positive | neutral | negative",
  "isCritical": false,
  "criticalReason": null,
  "aiSummary": "Concise 1-sentence manager summary"
}`;

      const raw = await callGemini(reviewPrompt);
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return NextResponse.json(parsed);
    }

    // 7. Action: Review Summary (Weekly/Periodic Digest for Admin)
    if (action === "review-summary") {
      const { reviews } = body;
      if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
        return NextResponse.json({
          summary: "No customer reviews recorded yet to analyze.",
          highlights: [],
          concerns: [],
          recommendations: [],
        });
      }

      const reviewText = reviews
        .slice(0, 30)
        .map(
          (r: any) =>
            `- [${r.rating}★] [${r.category || "General"}] "${r.comment || "No comment"}" (Critical: ${r.is_critical ? "YES" : "NO"})`
        )
        .join("\n");

      const summaryPrompt = `You are an executive restaurant operations consultant analyzing recent customer feedback for Resto Mayo.

Recent Customer Reviews:
${reviewText}

TASK:
Synthesize these reviews into an actionable executive report for the restaurant manager.
Identify main customer praises, main operational bottlenecks/complaints (especially during rush hours or with specific dishes), and 3 concrete recommendations for the kitchen and front-of-house staff.

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "executiveSummary": "2-3 sentences summarizing overall customer sentiment and operational pulse",
  "topPraises": ["praise 1", "praise 2"],
  "topConcerns": ["concern 1", "concern 2"],
  "actionableSteps": ["step 1", "step 2", "step 3"]
}`;

      const raw = await callGemini(summaryPrompt);
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return NextResponse.json(parsed);
    }

    return NextResponse.json(
      { error: "Invalid action or missing prompt" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Gemini API Error: ", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process Gemini AI request" },
      { status: 500 }
    );
  }
}

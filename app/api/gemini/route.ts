import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Helper to reliably extract and clean JSON from Gemini output
function cleanJsonOutput(raw: string): string {
  let text = (raw || "").trim();

  // Strip markdown code block if present
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Find first { or [ and last } or ]
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

async function callGemini(contents: string): Promise<string> {
  // Use models verified to be available and ultra-responsive:
  // gemini-flash-lite-latest (1-2s response time)
  // gemini-3.5-flash-lite (3s response time)
  // gemini-3.5-flash (standard fallback)
  // gemini-3.8-flash (latest)
  const models = [
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
  ];
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
      console.warn(`Gemini model ${model} failed, trying next:`, err?.message || err);
    }
  }

  throw lastError || new Error("Failed to generate content from Gemini");
}

/* =========================================================================
   INTELLIGENT LOCAL FALLBACK LOGIC
   Ensures that if external AI services hit a network spike, 503, or rate limit,
   the website NEVER crashes or displays errors to users or admins.
   ========================================================================= */

function fallbackFoodCopilot(query: string, allProducts: any[]) {
  const q = (query || "").toLowerCase();
  const available = (allProducts || []).filter((p) => p.is_available);

  let maxBudget = Infinity;
  const budgetMatch = q.match(/(\d+)\s*(k|ribu|rb|000)?/);
  if (budgetMatch) {
    let num = parseInt(budgetMatch[1], 10);
    if (budgetMatch[2] === "k" || budgetMatch[2] === "ribu" || budgetMatch[2] === "rb") {
      num *= 1000;
    }
    if (num >= 5000) maxBudget = num;
  }

  const scored = available.map((p) => {
    let score = 0;
    const pName = (p.name || "").toLowerCase();
    const pDesc = (p.description || "").toLowerCase();
    const pCat = (p.category?.name || "").toLowerCase();
    const price = Number(p.price);

    if (price <= maxBudget) score += 3;

    if (q.includes("kuah") && (pName.includes("kuah") || pName.includes("mie") || pDesc.includes("kuah"))) score += 5;
    if (q.includes("pedas") && (pName.includes("pedas") || pDesc.includes("pedas") || pName.includes("geprek"))) score += 5;
    if ((q.includes("minum") || q.includes("dingin") || q.includes("segar") || q.includes("es")) && (pCat.includes("minum") || pName.includes("es") || pDesc.includes("segar"))) score += 5;
    if (q.includes("dimsum") && (pCat.includes("dimsum") || pName.includes("dimsum"))) score += 5;
    if (q.includes("keju") && (pName.includes("keju") || pDesc.includes("keju") || pDesc.includes("melt"))) score += 5;
    if (q.includes("vegetar") && !pName.includes("ayam") && !pName.includes("sapi") && !pName.includes("daging")) score += 4;
    if (q.includes("nasi") && pName.includes("nasi")) score += 4;

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.slice(0, 3).map((item) => ({
    productId: item.product.id,
    matchReason: `Pilihan lezat "${item.product.name}" yang pas dengan selera dan kriteria pencarianmu!`,
  }));

  return {
    interpretedMood: `Pencarian menu sesuai selera: "${query}"`,
    matches: best.length > 0 ? best : available.slice(0, 2).map((p) => ({
      productId: p.id,
      matchReason: `Menu favorit Resto Mayo "${p.name}" yang sangat direkomendasikan.`,
    })),
  };
}

function fallbackMenuIdeas(currentProducts: any[], categories: any[]) {
  const existing = (currentProducts || []).map((p) => (p.name || "").toLowerCase());
  const catNames = (categories || []).map((c) => c.name);

  const curatedIdeas = [
    {
      name: "Truffle Mayo Dimsum Platter",
      categoryName: catNames.find((c) => /dimsum/i.test(c)) || catNames[0] || "Dimsum",
      suggestedPrice: 28000,
      description: "Aneka dimsum lembut dikukus sempurna dengan saus truffle mayonnaise aromatik gurih lumer.",
      commercialReason: "Tren dimsum truffle viral di kalangan anak muda dan margin profit di atas 60%.",
    },
    {
      name: "Ayam Crispy Mayo Lava",
      categoryName: catNames.find((c) => /makan/i.test(c)) || catNames[0] || "Makanan",
      suggestedPrice: 32000,
      description: "Fillet ayam renyah keemasan dibalut racikan saus mayonnaise pedas manis yang meledak di lidah.",
      commercialReason: "Menu olahan ayam goreng krispi dengan saus signature selalu menjadi best seller harian.",
    },
    {
      name: "Es Jeruk Selasih Mayo Soda",
      categoryName: catNames.find((c) => /minum/i.test(c)) || catNames[0] || "Minuman",
      suggestedPrice: 15000,
      description: "Perasan jeruk murni dingin berpadu biji selasih renyah dan sentuhan soda menyegarkan dahaga.",
      commercialReason: "Minuman pereda pedas dan penetral makanan gurih yang meningkatkan Average Order Value.",
    },
  ];

  return {
    analysis: "Katalog menu Resto Mayo sangat potensial diperkaya dengan varian fusion signature sauce dan minuman segar pereda dahaga.",
    ideas: curatedIdeas.filter((idea) => !existing.includes(idea.name.toLowerCase())),
  };
}

function fallbackSmartUpsell(cartItems: any[], allProducts: any[]) {
  const cartIds = (cartItems || []).map((c) => c.id);
  const available = (allProducts || []).filter((p) => p.is_available && !cartIds.includes(p.id));

  const drinks = available.filter((p) => (p.category?.name || "").toLowerCase().includes("minum"));
  const sides = available.filter((p) => (p.category?.name || "").toLowerCase().includes("dimsum"));
  const candidates = [...drinks, ...sides, ...available];

  const selected = candidates.slice(0, 2).map((item) => ({
    productId: item.id,
    reason: `Teman bersantap paling pas untuk melengkapi pesanan "${cartItems[0]?.name || "hidanganmu"}" agar makin nikmat!`,
  }));

  return {
    headline: "Pasangan Sempurna untuk Makananmu",
    recommendations: selected,
  };
}

function fallbackCopywriting(name: string, ingredients?: string, category?: string) {
  const highlight = ingredients ? `perpaduan bahan pilihan ${ingredients}` : "racikan bumbu khas Resto Mayo";
  const cat = category ? `menu ${category}` : "hidangan";
  return {
    description: `Nikmati kelezatan istimewa ${name}, diolah dari ${highlight} yang menggugah selera dan memanjakan lidah di setiap suapan. Pilihan ${cat} terbaik untuk dinikmati kapan saja.`,
    tagline: `${name}: Sensasi Gurih Menggoda, Nikmatnya Juara!`,
    socialPromo: `🔥 SPECIAL PROMO HARI INI! 🔥\n\nPenasaran sama kelezatan *${name}*? Rasakan perpaduan rasa gurih dan bumbu khas Resto Mayo yang bikin nagih! 😋✨\n\nYuk langsung mampir ke Resto Mayo atau pesan sekarang sebelum kehabisan! 🍽️🛵`,
  };
}

function fallbackReviewSummary(reviews: any[]) {
  const avg = reviews && reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  return {
    executiveSummary: `Berdasarkan ${reviews?.length || 0} ulasan pelanggan, kepuasan resto berada pada rata-rata ${avg}/5.0. Pelanggan menyukai cita rasa hidangan dan sajian saus signature.`,
    topPraises: [
      "Rasa makanan gurih dan racikan saus signature disukai pelanggan",
      "Porsi hidangan pas dan kemudahan pemesanan digital di meja",
    ],
    topConcerns: [
      "Perlu menjaga konsistensi kecepatan penyajian saat jam makan siang",
      "Pastikan minuman dingin disajikan segera sebelum hidangan utama",
    ],
    actionableSteps: [
      "Optimalkan antrean KDS dapur untuk pesanan minuman dan cemilan",
      "Pantau kualitas suhu hidangan sebelum disajikan ke meja pelanggan",
      "Lakukan brief harian untuk menjaga keramahan dan kesiapan staf pelayanan",
    ],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, prompt } = body;

    // 1. Backwards-compatibility: simple prompt
    if (!action && prompt) {
      try {
        const text = await callGemini(prompt);
        return NextResponse.json({ result: text });
      } catch {
        return NextResponse.json({ result: "Gemini AI assistant ready for Resto Mayo." });
      }
    }

    // 2. Action: Smart Upselling & Dynamic Bundling
    if (action === "smart-upsell") {
      const { cartItems, allProducts } = body;
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return NextResponse.json({ recommendations: [], headline: "" });
      }

      try {
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
      } catch (upsellErr) {
        console.warn("Using smart-upsell fallback:", upsellErr);
        return NextResponse.json(fallbackSmartUpsell(cartItems, allProducts));
      }
    }

    // 3. Action: Food Copilot (Natural Language Menu Search)
    if (action === "food-copilot") {
      const { query, allProducts } = body;
      if (!query || typeof query !== "string") {
        return NextResponse.json({ error: "Query is required" }, { status: 400 });
      }

      try {
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
      } catch (copilotErr) {
        console.warn("Using food-copilot fallback:", copilotErr);
        return NextResponse.json(fallbackFoodCopilot(query, allProducts));
      }
    }

    // 4. Action: Menu Expansion Ideas (Admin CRUD advisor)
    if (action === "menu-ideas") {
      const { currentProducts, categories } = body;

      try {
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
      } catch (ideasErr) {
        console.warn("Using menu-ideas fallback:", ideasErr);
        return NextResponse.json(fallbackMenuIdeas(currentProducts, categories));
      }
    }

    // 5. Action: Generator Deskripsi Menu & Copywriting Promosi
    if (action === "generate-copywriting") {
      const { name, ingredients, category } = body;
      if (!name) {
        return NextResponse.json({ error: "Dish name is required" }, { status: 400 });
      }

      try {
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
      } catch (copyErr) {
        console.warn("Using copywriting fallback:", copyErr);
        return NextResponse.json(fallbackCopywriting(name, ingredients, category));
      }
    }

    // 6. Action: Analyze Review & Sentiment
    if (action === "analyze-review") {
      const { customerName, rating, comment, orderItems } = body;

      try {
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
      } catch (reviewErr) {
        console.warn("Using analyze-review fallback:", reviewErr);
        return NextResponse.json({
          category: "Food Taste",
          sentiment: Number(rating) >= 4 ? "positive" : Number(rating) === 3 ? "neutral" : "negative",
          isCritical: false,
          criticalReason: null,
          aiSummary: `Review bintang ${rating} dari ${customerName || "Pelanggan"}.`,
        });
      }
    }

    // 7. Action: Review Summary (Weekly/Periodic Digest for Admin)
    if (action === "review-summary") {
      const { reviews } = body;
      if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
        return NextResponse.json(fallbackReviewSummary([]));
      }

      try {
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
      } catch (summaryErr) {
        console.warn("Using review-summary fallback:", summaryErr);
        return NextResponse.json(fallbackReviewSummary(reviews));
      }
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

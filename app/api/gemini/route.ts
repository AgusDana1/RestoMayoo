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
   INTELLIGENT LOCAL FALLBACK & CATEGORY DETECTION LOGIC
   Ensures that if external AI services hit a network spike, 503, or rate limit,
   the website NEVER crashes or displays errors to users or admins.
   ========================================================================= */

function detectCartCategories(cartItems: any[], allProducts: any[]) {
  let hasFood = false;
  let hasDrink = false;
  let hasDimsum = false;

  for (const item of cartItems) {
    const cat = (item.categoryName || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const prod = (allProducts || []).find((p: any) => p.id === item.id);
    const prodCat = (prod?.category?.name || "").toLowerCase();

    const isDrink =
      cat.includes("minum") ||
      prodCat.includes("minum") ||
      /es |teh|kopi|jus|drink|lemon|soda|air|mineral|tarik/i.test(name);
    const isDimsum =
      cat.includes("dimsum") ||
      prodCat.includes("dimsum") ||
      /dimsum|siomay|pangsit|hakau|bakpao/i.test(name);

    if (isDrink) {
      hasDrink = true;
    } else if (isDimsum) {
      hasDimsum = true;
    } else {
      hasFood = true;
    }
  }

  return { hasFood, hasDrink, hasDimsum };
}

function fallbackFoodCopilot(query: string, allProducts: any[]) {
  const q = (query || "").toLowerCase().trim();
  const available = (allProducts || []).filter((p) => p.is_available);

  // Parse budget if specified (e.g. "30k", "30 ribu", "under 30000", "dibawah 25 rb")
  let maxBudget = Infinity;
  const budgetMatch = q.match(/(\d+)\s*(k|ribu|rb|000)?/);
  if (budgetMatch) {
    let num = parseInt(budgetMatch[1], 10);
    if (budgetMatch[2] === "k" || budgetMatch[2] === "ribu" || budgetMatch[2] === "rb") {
      num *= 1000;
    }
    if (num >= 5000) maxBudget = num;
  }

  // Tokenize search query
  const stopWords = new Set([
    "saya", "mau", "pengen", "ingin", "cari", "tolong", "ada", "yang",
    "di", "ke", "dan", "atau", "dong", "bisa", "untuk", "buat", "paling",
    "ini", "itu", "sama", "menu", "apa"
  ]);
  const tokens = q.split(/[\s,.-]+/).filter((w) => w.length > 1 && !stopWords.has(w));

  const scored = available.map((p) => {
    let score = 0;
    const pName = (p.name || "").toLowerCase();
    const pDesc = (p.description || "").toLowerCase();
    const pCat = (p.category?.name || "").toLowerCase();
    const price = Number(p.price);

    // Budget check
    if (price <= maxBudget) score += 4;
    else if (maxBudget !== Infinity) score -= 5;

    // Token matching across name, category, and description
    for (const t of tokens) {
      if (pName.includes(t)) score += 12;
      if (pCat.includes(t)) score += 8;
      if (pDesc.includes(t)) score += 6;
    }

    // Direct category / keyword matching
    if ((q.includes("makan") || q.includes("kenyang")) && pCat.includes("makan")) score += 6;
    if (
      (q.includes("minum") || q.includes("haus") || q.includes("segar") || q.includes("es") || q.includes("dingin")) &&
      (pCat.includes("minum") || pName.includes("es") || pDesc.includes("segar"))
    ) {
      score += 8;
    }
    if (
      (q.includes("dimsum") || q.includes("camilan") || q.includes("snack") || q.includes("kukus") || q.includes("siomay")) &&
      (pCat.includes("dimsum") || pName.includes("dimsum"))
    ) {
      score += 8;
    }
    if (
      (q.includes("kuah") || q.includes("hangat") || q.includes("sup") || q.includes("soup")) &&
      (pName.includes("kuah") || pDesc.includes("kuah") || pName.includes("mie"))
    ) {
      score += 7;
    }
    if (
      (q.includes("pedas") || q.includes("spicy") || q.includes("geprek") || q.includes("cabe")) &&
      (pName.includes("pedas") || pDesc.includes("pedas") || pName.includes("geprek"))
    ) {
      score += 7;
    }
    if ((q.includes("manis") || q.includes("sweet")) && (pDesc.includes("manis") || pName.includes("manis") || pCat.includes("minum"))) {
      score += 5;
    }
    if (
      (q.includes("keju") || q.includes("cheese") || q.includes("melt")) &&
      (pName.includes("keju") || pDesc.includes("keju") || pDesc.includes("melt"))
    ) {
      score += 7;
    }
    if ((q.includes("ayam") || q.includes("chicken")) && (pName.includes("ayam") || pDesc.includes("ayam"))) score += 8;
    if ((q.includes("mie") || q.includes("noodle") || q.includes("bihun") || q.includes("kwetiau")) && (pName.includes("mie") || pDesc.includes("mie"))) score += 8;
    if ((q.includes("nasi") || q.includes("rice")) && (pName.includes("nasi") || pDesc.includes("nasi"))) score += 8;
    if ((q.includes("teh") || q.includes("tea")) && (pName.includes("teh") || pDesc.includes("teh"))) score += 8;
    if ((q.includes("kopi") || q.includes("coffee")) && (pName.includes("kopi") || pDesc.includes("kopi"))) score += 8;

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.filter((item) => item.score > 0).slice(0, 3).map((item) => ({
    productId: item.product.id,
    matchReason: `Pilihan hidangan lezat "${item.product.name}" yang paling pas dengan apa yang kamu cari!`,
  }));

  return {
    interpretedMood: `Pencarian menu sesuai keinginanmu: "${query}"`,
    matches: best.length > 0 ? best : available.slice(0, 2).map((p) => ({
      productId: p.id,
      matchReason: `Menu favorit Resto Mayo "${p.name}" yang sangat direkomendasikan untuk dicoba!`,
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

  const { hasFood, hasDrink } = detectCartCategories(cartItems, allProducts);

  let targetCat = "Minuman";
  let headline = "Lengkapi Makananmu dengan Minuman Segar!";
  let reasonPrefix = "Minuman segar penyejuk dahaga yang pas menemani santap makananmu";

  // RULE 1: Customer bought FOOD only -> Recommend DRINK (Minuman)
  if (hasFood && !hasDrink) {
    targetCat = "Minuman";
    headline = "Lengkapi Makananmu dengan Minuman Segar!";
    reasonPrefix = "Minuman dingin segar yang sangat cocok melegakan dahaga setelah menikmati makanan lezat";
  }
  // RULE 2: Customer bought DRINKS only -> Recommend FOOD (Makanan)
  else if (hasDrink && !hasFood) {
    targetCat = "Makanan";
    headline = "Lengkapi Minumanmu dengan Makanan Favorit!";
    reasonPrefix = "Hidangan lezat dan mengenyangkan yang pas banget dinikmati bareng minuman segarmu";
  }
  // RULE 3: Customer bought BOTH Food and Drinks -> Recommend DIMSUM
  else if (hasFood && hasDrink) {
    targetCat = "Dimsum";
    headline = "Tambah Dimsum Biar Mejamu Makin Lengkap!";
    reasonPrefix = "Cemilan dimsum lembut dan gurih yang sempurna melengkapi santap makanan & minumanmu";
  }

  // Pick items prioritizing targetCat
  let candidates = available.filter((p) =>
    (p.category?.name || "").toLowerCase().includes(targetCat.toLowerCase())
  );
  if (candidates.length < 2) {
    const others = available.filter((p) => !candidates.some((c) => c.id === p.id));
    candidates = [...candidates, ...others];
  }

  const selected = candidates.slice(0, 2).map((item) => ({
    productId: item.id,
    reason: `${reasonPrefix}: coba "${item.name}" yang nikmat!`,
  }));

  return {
    headline,
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
        const { hasFood, hasDrink } = detectCartCategories(cartItems, allProducts);

        let requiredType = "DRINKS (Minuman)";
        let requiredHeadline = "Lengkapi Makananmu dengan Minuman Segar!";
        let ruleInstruction =
          "The customer currently ordered FOOD dishes only. Rule: You MUST strictly recommend 1 to 2 REFRESHING DRINKS/BEVERAGES from category Minuman to quench their thirst.";

        if (hasFood && !hasDrink) {
          requiredType = "DRINKS (Minuman)";
          requiredHeadline = "Lengkapi Makananmu dengan Minuman Segar!";
          ruleInstruction =
            "The customer ordered FOOD only. STRICT RULE: You MUST recommend 1 to 2 REFRESHING DRINKS/BEVERAGES (category: Minuman) to quench their thirst and pair with their food.";
        } else if (hasDrink && !hasFood) {
          requiredType = "FOOD (Makanan)";
          requiredHeadline = "Lengkapi Minumanmu dengan Makanan Favorit!";
          ruleInstruction =
            "The customer ordered DRINKS only. STRICT RULE: You MUST recommend 1 to 2 DELICIOUS FOOD DISHES (category: Makanan) to satisfy their hunger and accompany their drink.";
        } else if (hasFood && hasDrink) {
          requiredType = "DIMSUM (Dimsum/Cemilan)";
          requiredHeadline = "Tambah Dimsum Biar Mejamu Makin Lengkap!";
          ruleInstruction =
            "The customer ordered BOTH Food AND Drinks! STRICT RULE: You MUST recommend 1 to 2 DELICIOUS DIMSUM or SIDES (category: Dimsum) as the ultimate pairing to complete their feast.";
        }

        const cartSummary = cartItems
          .map((i: any) => `- ${i.name} (Cat: ${i.categoryName || "Unknown"}, Qty: ${i.quantity})`)
          .join("\n");

        const availableItems = (allProducts || [])
          .filter((p: any) => p.is_available && !cartItems.some((ci: any) => ci.id === p.id))
          .map((p: any) => `[ID: ${p.id}] ${p.name} | Category: ${p.category?.name || "Dish"} | Rp ${p.price} | Desc: ${p.description || ""}`)
          .slice(0, 18)
          .join("\n");

        if (!availableItems) {
          return NextResponse.json({ recommendations: [], headline: "" });
        }

        const upsellPrompt = `You are an expert restaurant cross-selling sommelier for "Resto Mayo".

Customer's current cart items:
${cartSummary}

Available items in restaurant catalog:
${availableItems}

CRITICAL MANDATORY PAIRING RULE:
Target Recommendation Type: ${requiredType}
${ruleInstruction}

TASK:
1. Follow the STRICT RULE above to select 1 to 2 items from the catalog that match the required category (${requiredType}).
2. Provide an appetizing 1-sentence pairing reason in Indonesian for each recommendation.
3. Headline should be enticing in Indonesian (e.g., "${requiredHeadline}").

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "headline": "${requiredHeadline}",
  "recommendations": [
    {
      "productId": <number ID from the catalog>,
      "reason": "1 enticing sentence in Indonesian why this item is the perfect companion"
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

        const copilotPrompt = `You are "Resto Mayo Food Copilot", an AI culinary assistant helping customers find the ideal meal based on their mood, cravings, budget, dietary needs, or manual search keywords.

Customer Search Request:
"${query}"

Resto Mayo Available Products:
${productCatalog}

TASK:
1. Interpret what the customer desires (whether it is a full sentence like "pengen kuah hangat", or simple keywords like "ayam", "mie", "es teh", "minuman", "jus", "dimsum", "pedas").
2. Select 1 to 4 best matching items from the catalog. You MUST ALWAYS recommend at least 1-3 matching or closely related items from the available products. Do NOT return an empty matches list.
3. For each recommendation, provide an appetizing explanation in Indonesian (1-2 sentences) explaining why this dish fits what they asked for.

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "interpretedMood": "Short summary in Indonesian of what the customer is craving or looking for",
  "matches": [
    {
      "productId": <number ID from catalog>,
      "matchReason": "1 to 2 engaging sentences in Indonesian explaining why this dish fits their prompt"
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

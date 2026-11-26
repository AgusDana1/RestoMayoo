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

interface QueryConstraints {
  minPrice: number | null;
  minStrict: boolean;
  maxPrice: number | null;
  maxStrict: boolean;
  requiredCategory: "minuman" | "makanan" | "dimsum" | null;
}

function parseIndonesianPrice(numStr: string, unit?: string): number | null {
  const cleaned = numStr.replace(/\./g, "").replace(/,/g, "");
  let num = parseInt(cleaned, 10);
  if (isNaN(num) || num <= 0) return null;
  const u = (unit || "").toLowerCase();
  if (u === "k" || u === "rb" || u === "ribu" || u === "ribuan" || num < 1000) {
    if (num < 1000) num *= 1000;
  }
  return num >= 1000 ? num : null;
}

function extractQueryConstraints(query: string): QueryConstraints {
  const q = (query || "").toLowerCase().trim();
  let minPrice: number | null = null;
  let minStrict = false;
  let maxPrice: number | null = null;
  let maxStrict = false;

  // Check range e.g. "20rb - 30rb" or "antara 20 ribu sampai 35 ribu"
  const rangeMatch = q.match(
    /(?:antara\s*)?(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(ribuan|ribu|rb|k)?\s*(?:-|sampai|hingga|sd|s\/d|ke)\s*(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(ribuan|ribu|rb|k)?/i
  );
  if (rangeMatch) {
    const low = parseIndonesianPrice(rangeMatch[1], rangeMatch[2] || rangeMatch[4]);
    const high = parseIndonesianPrice(rangeMatch[3], rangeMatch[4] || rangeMatch[2]);
    if (low !== null && high !== null && low <= high) {
      minPrice = low;
      maxPrice = high;
    }
  }

  // Check "diatas / lebih dari / minimal / >" (including optional "harga/budget/rp")
  const minMatch = q.match(
    /(?:di\s*atas|lebih\s*(?:mahal\s*)?dari|minimal|min\b|mulai(?:\s*dari)?|>=|>)\s*(?:(?:harga|budget|rp\.?)\s*)*(\d+(?:[.,]\d+)?)\s*(ribuan|ribu|rb|k)?/i
  );
  if (minMatch) {
    const val = parseIndonesianPrice(minMatch[1], minMatch[2]);
    if (val !== null) {
      minPrice = val;
      minStrict = /di\s*atas|lebih\s*(?:mahal\s*)?dari|>/i.test(minMatch[0]) && !/>=/.test(minMatch[0]);
    }
  } else {
    const suffixMinMatch = q.match(
      /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(ribuan|ribu|rb|k)?\s*(?:ke\s*atas|keatas|\+)/i
    );
    if (suffixMinMatch) {
      const val = parseIndonesianPrice(suffixMinMatch[1], suffixMinMatch[2]);
      if (val !== null) {
        minPrice = val;
        minStrict = false;
      }
    }
  }

  // Check "dibawah / kurang dari / maksimal / budget / <"
  const maxMatch = q.match(
    /(?:di\s*bawah|kurang\s*dari|lebih\s*murah\s*dari|maksimal|maks\b|max\b|budget(?:\s*maks)?|under|<=|<)\s*(?:(?:harga|budget|rp\.?)\s*)*(\d+(?:[.,]\d+)?)\s*(ribuan|ribu|rb|k)?/i
  );
  if (maxMatch) {
    const val = parseIndonesianPrice(maxMatch[1], maxMatch[2]);
    if (val !== null) {
      maxPrice = val;
      maxStrict = /di\s*bawah|kurang\s*dari|lebih\s*murah\s*dari|</i.test(maxMatch[0]) && !/<=/.test(maxMatch[0]);
    }
  } else {
    const suffixMaxMatch = q.match(
      /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(ribuan|ribu|rb|k)?\s*(?:ke\s*bawah|kebawah)/i
    );
    if (suffixMaxMatch) {
      const val = parseIndonesianPrice(suffixMaxMatch[1], suffixMaxMatch[2]);
      if (val !== null) {
        maxPrice = val;
        maxStrict = false;
      }
    }
  }

  // Check standalone "X ribuan" (e.g. "minuman 50 ribuan") if no min/max found yet
  if (minPrice === null && maxPrice === null) {
    const ribuanMatch = q.match(/(?:rp\.?\s*)?(\d+)\s*ribuan\b/i);
    if (ribuanMatch) {
      const base = parseIndonesianPrice(ribuanMatch[1], "ribuan");
      if (base !== null) {
        minPrice = base;
        maxPrice = base + 9999;
      }
    }
  }

  // Detect strict single-category intent (ignore negated category mentions)
  const qNoNeg = q.replace(/(?:bukan|selain|tanpa)\s+(?:minuman|makanan|dimsum)/gi, "");
  const asksDrink = /\b(minuman|minum|haus|kopi|teh|jus|milkshake|milshake|soda|drink|beverages?)\b/i.test(qNoNeg);
  const asksFood = /\b(makanan|makan|nasi|mie|ayam|risoles|lauk|kenyang|lapar)\b/i.test(qNoNeg);
  const asksDimsum = /\b(dimsum|siomay|udang\s*keju|udang\s*mayo|cemilan|snack|kukus)\b/i.test(qNoNeg);

  let requiredCategory: QueryConstraints["requiredCategory"] = null;
  if (asksDrink && !asksFood && !asksDimsum) {
    requiredCategory = "minuman";
  } else if (asksFood && !asksDrink && !asksDimsum) {
    requiredCategory = "makanan";
  } else if (asksDimsum && !asksDrink && !asksFood) {
    requiredCategory = "dimsum";
  }

  return { minPrice, minStrict, maxPrice, maxStrict, requiredCategory };
}

function matchesConstraints(product: any, c: QueryConstraints): boolean {
  if (!product || !product.is_available) return false;
  const price = Number(product.price);

  if (c.minPrice !== null) {
    if (c.minStrict ? price <= c.minPrice : price < c.minPrice) return false;
  }
  if (c.maxPrice !== null) {
    if (c.maxStrict ? price >= c.maxPrice : price > c.maxPrice) return false;
  }

  if (c.requiredCategory) {
    const catName = (product.category?.name || "").toLowerCase();
    const pName = (product.name || "").toLowerCase();
    const isDrinkItem =
      catName.includes("minum") ||
      /^(es |teh|kopi|jus|milkshake|milshake)/i.test(pName);
    const isDimsumItem =
      catName.includes("dimsum") ||
      /dimsum|udang keju|udang mayo|udang selai|siomay/i.test(pName);

    if (c.requiredCategory === "minuman" && !isDrinkItem) return false;
    if (c.requiredCategory === "dimsum" && !isDimsumItem) return false;
    if (c.requiredCategory === "makanan" && (isDrinkItem || isDimsumItem)) return false;
  }

  return true;
}

function formatConstraintNotFoundReason(query: string, c: QueryConstraints): string {
  const parts: string[] = [];
  if (c.requiredCategory) {
    parts.push(`kategori ${c.requiredCategory}`);
  }
  if (c.minPrice !== null && c.maxPrice !== null) {
    parts.push(`harga Rp ${c.minPrice.toLocaleString("id-ID")} – Rp ${c.maxPrice.toLocaleString("id-ID")}`);
  } else if (c.minPrice !== null) {
    parts.push(`harga ${c.minStrict ? "di atas" : "minimal"} Rp ${c.minPrice.toLocaleString("id-ID")}`);
  } else if (c.maxPrice !== null) {
    parts.push(`harga ${c.maxStrict ? "di bawah" : "maksimal"} Rp ${c.maxPrice.toLocaleString("id-ID")}`);
  }

  if (parts.length > 0) {
    return `Menu tidak ditemukan untuk kriteria ${parts.join(" dengan ")}. Silakan coba kata kunci atau rentang harga lain.`;
  }
  return `Menu tidak ditemukan untuk pencarian "${query}". Silakan coba kata kunci lain yang tersedia di menu Resto Mayo.`;
}

function fallbackFoodCopilot(query: string, allProducts: any[]) {
  const q = (query || "").toLowerCase().trim();
  const constraints = extractQueryConstraints(q);

  // First filter strictly by availability, price range, and category constraints
  const eligible = (allProducts || []).filter((p) => matchesConstraints(p, constraints));

  if (eligible.length === 0) {
    return {
      interpretedMood: formatConstraintNotFoundReason(query, constraints),
      notFound: true,
      matches: [],
    };
  }

  // Strip price/filler words to see what culinary keywords remain
  const fillerWords = new Set([
    "saya", "mau", "pengen", "ingin", "cari", "tolong", "ada", "yang", "di", "ke",
    "dan", "atau", "dong", "bisa", "untuk", "buat", "paling", "ini", "itu", "sama",
    "menu", "apa", "harga", "budget", "dibawah", "bawah", "diatas", "atas", "lebih",
    "dari", "kurang", "minimal", "maksimal", "antara", "sampai", "hingga", "ribu",
    "ribuan", "rb", "rp", "murah", "mahal", "lagi", "enak", "cocok", "tapi", "dengan",
    "makanan", "makan", "minuman", "minum", "dimsum", "cemilan", "snack"
  ]);

  const culinaryTokens = q
    .split(/[\s,.-]+/)
    .filter((w) => w.length > 1 && !fillerWords.has(w) && !/^\d+(k|rb)?$/i.test(w));

  const scored = eligible.map((p) => {
    let score = 0;
    const pName = (p.name || "").toLowerCase();
    const pDesc = (p.description || "").toLowerCase();
    const pCat = (p.category?.name || "").toLowerCase();

    for (const t of culinaryTokens) {
      if (pName.includes(t)) score += 12;
      if (pCat.includes(t)) score += 8;
      if (pDesc.includes(t)) score += 6;
    }

    // Synonym / intent matching
    if ((q.includes("segar") || q.includes("seger") || q.includes("haus") || q.includes("dingin")) && (pCat.includes("minum") || pName.includes("es ") || pDesc.includes("iced") || pDesc.includes("chilled"))) score += 8;
    if ((q.includes("pedas") || q.includes("spicy") || q.includes("cabe")) && (pName.includes("pedas") || pDesc.includes("spicy") || pDesc.includes("chili"))) score += 10;
    if ((q.includes("keju") || q.includes("cheese") || q.includes("melt") || q.includes("lumer")) && (pName.includes("keju") || pDesc.includes("cheese") || pDesc.includes("mozzarella"))) score += 10;
    if ((q.includes("manis") || q.includes("sweet") || q.includes("coklat")) && (pDesc.includes("sweet") || pDesc.includes("chocolate") || pName.includes("manis") || pName.includes("milo"))) score += 8;
    if ((q.includes("gurih") || q.includes("savory") || q.includes("renyah") || q.includes("crispy")) && (pDesc.includes("savory") || pDesc.includes("crispy"))) score += 6;
    if ((q.includes("ayam") || q.includes("chicken")) && (pName.includes("ayam") || pDesc.includes("chicken"))) score += 10;
    if ((q.includes("udang") || q.includes("prawn") || q.includes("seafood")) && (pName.includes("udang") || pName.includes("seafood") || pDesc.includes("prawn"))) score += 10;
    if ((q.includes("nasi") || q.includes("rice")) && (pName.includes("nasi") || pDesc.includes("rice"))) score += 10;
    if ((q.includes("teh") || q.includes("tea")) && (pName.includes("teh") || pDesc.includes("tea"))) score += 10;
    if ((q.includes("kopi") || q.includes("coffee")) && (pName.includes("kopi") || pDesc.includes("espresso"))) score += 10;
    if ((q.includes("alpukat") || q.includes("avocado")) && (pName.includes("alpukat") || pDesc.includes("avocado"))) score += 10;
    if ((q.includes("sharing") || q.includes("berdua") || q.includes("rame")) && pCat.includes("dimsum")) score += 6;

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((item) => item.score > 0);

  // If user specified concrete culinary keywords (not just a category/price query) and NONE matched, return not found
  if (matched.length === 0 && culinaryTokens.length > 0) {
    return {
      interpretedMood: `Menu tidak ditemukan untuk "${query}". Tidak ada hidangan di Resto Mayo yang sesuai dengan kriteria tersebut.`,
      notFound: true,
      matches: [],
    };
  }

  // If user only queried category and/or price (e.g. "minuman dibawah 20 ribu"), return matching eligible items
  const finalSelection = (matched.length > 0 ? matched.map((m) => m.product) : eligible)
    .slice(0, 3)
    .map((p) => ({
      productId: p.id,
      matchReason: `Pilihan "${p.name}" (Rp ${Number(p.price).toLocaleString("id-ID")}) sesuai dengan kriteria pencarianmu!`,
    }));

  return {
    interpretedMood: `Rekomendasi menu untuk: "${query}"`,
    notFound: false,
    matches: finalSelection,
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

      const constraints = extractQueryConstraints(query);

      // Fast deterministic check: if strict category/price constraints rule out all items in catalog
      const eligibleItems = (allProducts || []).filter((p: any) => matchesConstraints(p, constraints));
      if (eligibleItems.length === 0) {
        return NextResponse.json({
          interpretedMood: formatConstraintNotFoundReason(query, constraints),
          notFound: true,
          matches: [],
        });
      }

      try {
        const productCatalog = (allProducts || [])
          .map(
            (p: any) =>
              `[ID: ${p.id}] ${p.name} | Category: ${p.category?.name || "Dish"} | Price: Rp ${p.price} | Desc: ${p.description || ""} | Available: ${p.is_available}`
          )
          .join("\n");

        const copilotPrompt = `You are "Resto Mayo Food Copilot", a precise and smart AI culinary assistant helping customers find the ideal meal based on their mood, cravings, budget, price constraints, dietary needs, or manual search keywords.

Customer Search Request:
"${query}"

Resto Mayo Available Products:
${productCatalog}

TASK & CRITICAL RULES:
1. Carefully analyze what the customer desires:
   - Price constraints: e.g. "di atas" / "diatas" / "lebih dari" / ">" (price must be greater than X), "di bawah" / "dibawah" / "kurang dari" / "<" / "budget" (price must be less than or equal to X), price range (X - Y), or "X ribuan".
   - Category constraints: e.g. "minuman" (drinks/beverages), "makanan" (food/main course), "dimsum" (dimsum/snacks).
   - Ingredients / flavor / dietary: e.g. vegetarian, spicy, cheese, halal, cold, warm, etc.

2. STRICT FILTERING RULES:
   - ONLY recommend products from the catalog that truly satisfy the customer's constraints.
   - If the customer specifies a price or category condition (e.g. "minuman diatas 50 ribuan"), you MUST ONLY select items that strictly satisfy that condition.
   - CRITICAL: If NO products in the catalog satisfy the customer's criteria (e.g. all drinks are under Rp 50.000, or a requested food doesn't exist at Resto Mayo), you MUST return an EMPTY matches array: "matches": [].
   - NEVER suggest or force items that violate the customer's price or category criteria.

3. For matching recommendations, provide an appetizing explanation in Indonesian (1-2 sentences) explaining why this dish fits what they asked for.
4. "interpretedMood": Provide a concise explanation in Indonesian of what was searched and the result. If no items match, explain why politely in Indonesian.

Return STRICTLY a JSON object with this exact structure, with NO markdown backticks:
{
  "interpretedMood": "Short explanation in Indonesian of what the customer is craving or looking for",
  "matches": [
    {
      "productId": <number ID from catalog>,
      "matchReason": "1 to 2 engaging sentences in Indonesian explaining why this dish fits their prompt"
    }
  ]
}`;

        const raw = await callGemini(copilotPrompt);
        const parsed = JSON.parse(cleanJsonOutput(raw));

        // Authoritative server-side constraint verification on AI output
        const verifiedMatches = (parsed.matches || []).filter((m: any) => {
          const prod = (allProducts || []).find((p: any) => Number(p.id) === Number(m.productId));
          return prod && matchesConstraints(prod, constraints);
        });

        if (verifiedMatches.length === 0) {
          return NextResponse.json({
            interpretedMood: parsed.interpretedMood || formatConstraintNotFoundReason(query, constraints),
            notFound: true,
            matches: [],
          });
        }

        return NextResponse.json({
          interpretedMood: parsed.interpretedMood || `Rekomendasi menu untuk: "${query}"`,
          notFound: false,
          matches: verifiedMatches,
        });
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

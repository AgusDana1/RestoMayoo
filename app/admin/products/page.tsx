"use client";

import React, { useState, useEffect } from "react";

interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: number | string;
  image?: string | null;
  is_available: boolean;
  category: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formDesc, setFormDesc] = useState<string>("");
  const [formImage, setFormImage] = useState<string>("");
  const [formAvailable, setFormAvailable] = useState<boolean>(true);

  // Gemini AI States
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState<boolean>(false);
  const [aiAdvisorLoading, setAiAdvisorLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiIdeas, setAiIdeas] = useState<Array<{
    name: string;
    categoryName: string;
    suggestedPrice: number;
    description: string;
    commercialReason: string;
  }>>([]);

  const [isGeneratingCopy, setIsGeneratingCopy] = useState<boolean>(false);
  const [promoTagline, setPromoTagline] = useState<string>("");
  const [socialPromo, setSocialPromo] = useState<string>("");
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (cRes.ok) setCategories(await cRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory(categories[0]?.id.toString() || "");
    setFormPrice("");
    setFormDesc("");
    setFormImage("");
    setFormAvailable(true);
    setPromoTagline("");
    setSocialPromo("");
    setIsModalOpen(true);
  };

  const handleOpenAdvisor = async () => {
    setIsAiAdvisorOpen(true);
    if (aiIdeas.length > 0) return;
    try {
      setAiAdvisorLoading(true);
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "menu-ideas",
          currentProducts: products,
          categories: categories,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.analysis || "Rekomendasi menu inovatif Resto Mayo berdasarkan analisis katalog.");
        setAiIdeas(
          data.ideas && data.ideas.length > 0
            ? data.ideas
            : [
                {
                  name: "Truffle Mayo Dimsum Platter",
                  categoryName: categories.find((c) => /dimsum/i.test(c.name))?.name || categories[0]?.name || "Dimsum",
                  suggestedPrice: 28000,
                  description: "Aneka dimsum lembut dikukus sempurna dengan saus truffle mayonnaise aromatik gurih lumer.",
                  commercialReason: "Tren dimsum truffle viral di kalangan anak muda dan margin profit di atas 60%.",
                },
                {
                  name: "Ayam Crispy Mayo Lava",
                  categoryName: categories.find((c) => /makan/i.test(c.name))?.name || categories[0]?.name || "Makanan",
                  suggestedPrice: 32000,
                  description: "Fillet ayam renyah keemasan dibalut racikan saus mayonnaise pedas manis yang meledak di lidah.",
                  commercialReason: "Menu olahan ayam goreng krispi dengan saus signature selalu menjadi best seller harian.",
                },
                {
                  name: "Es Jeruk Selasih Mayo Soda",
                  categoryName: categories.find((c) => /minum/i.test(c.name))?.name || categories[1]?.name || "Minuman",
                  suggestedPrice: 15000,
                  description: "Perasan jeruk murni dingin berpadu biji selasih renyah dan sentuhan soda menyegarkan dahaga.",
                  commercialReason: "Minuman pereda pedas dan penetral makanan gurih yang meningkatkan Average Order Value.",
                },
              ]
        );
      }
    } catch (err) {
      console.error("AI advisor error:", err);
    } finally {
      setAiAdvisorLoading(false);
    }
  };

  const handleApplyIdea = (idea: {
    name: string;
    categoryName: string;
    suggestedPrice: number;
    description: string;
  }) => {
    setEditingProduct(null);
    setFormName(idea.name);
    const matchedCat = categories.find((c) =>
      c.name.toLowerCase().includes(idea.categoryName.toLowerCase())
    );
    setFormCategory(matchedCat ? matchedCat.id.toString() : categories[0]?.id.toString() || "");
    setFormPrice(idea.suggestedPrice.toString());
    setFormDesc(idea.description);
    setFormImage("");
    setFormAvailable(true);
    setPromoTagline("");
    setSocialPromo("");
    setIsAiAdvisorOpen(false);
    setIsModalOpen(true);
  };

  const handleGenerateCopy = async () => {
    if (!formName.trim()) return;
    try {
      setIsGeneratingCopy(true);
      const selectedCat = categories.find((c) => c.id.toString() === formCategory)?.name;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-copywriting",
          name: formName,
          ingredients: formDesc,
          category: selectedCat,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.description) setFormDesc(data.description);
        if (data.tagline) setPromoTagline(data.tagline);
        if (data.socialPromo) setSocialPromo(data.socialPromo);
      }
    } catch (err) {
      console.error("Generate copy error:", err);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category_id.toString());
    setFormPrice(p.price.toString());
    setFormDesc(p.description || "");
    setFormImage(p.image || "");
    setFormAvailable(p.is_available);
    setIsModalOpen(true);
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const nextState = !product.is_available;
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: nextState }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === product.id ? { ...item, is_available: nextState } : item
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingProduct) {
        // Update
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            category_id: formCategory,
            price: formPrice,
            description: formDesc,
            image: formImage,
            is_available: formAvailable,
          }),
        });
        if (res.ok) {
          await fetchData();
          setIsModalOpen(false);
        }
      } else {
        // Create
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            category_id: formCategory,
            price: formPrice,
            description: formDesc,
            image: formImage,
            is_available: formAvailable,
          }),
        });
        if (res.ok) {
          await fetchData();
          setIsModalOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-resto-yellow-200/80 pb-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 shadow-2xs mb-2">
            <span>🍔</span>
            <span>Food &amp; Beverage Catalog</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-poppins">
            Resto Mayo <span className="text-resto-red-700">Menu &amp; Dish Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage Resto Mayo dishes, showcase stock availability, and unit prices.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleOpenAdvisor}
            className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-stone-800 border-2 border-yellow-400 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span>💡</span>
            <span>AI Menu Advisor</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 text-white font-bold text-xs shadow-md shadow-resto-red-600/20 transition-all cursor-pointer active:scale-95"
          >
            <span>+ Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-3xl border border-resto-yellow-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400">Loading dishes list...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-resto-yellow-50/60 text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-resto-yellow-100">
                <tr>
                  <th className="py-3.5 px-4">Dish &amp; Photo</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit Price</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-resto-yellow-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-resto-yellow-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80"}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-12 h-12 rounded-2xl object-cover bg-resto-yellow-50 shrink-0 border border-resto-yellow-200/80 shadow-2xs"
                        />
                        <div>
                          <span className="font-bold text-stone-900 font-poppins block">{product.name}</span>
                          <span className="text-[11px] text-stone-400 line-clamp-1 max-w-sm">
                            {product.description || "-"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-resto-red-700">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          product.is_available
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-resto-red-50 text-resto-red-700 border border-resto-red-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.is_available ? "bg-emerald-600" : "bg-resto-red-600"}`}></span>
                        <span>{product.is_available ? "Available" : "Sold Out"}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="px-3 py-1.5 rounded-xl bg-resto-yellow-100 hover:bg-resto-yellow-200 text-resto-yellow-950 font-bold text-[11px] border border-resto-yellow-300 cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-3 py-1.5 rounded-xl bg-resto-red-50 hover:bg-resto-red-100 text-resto-red-700 font-bold text-[11px] border border-resto-red-200 cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-resto-yellow-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-resto-yellow-100">
              <h3 className="font-black text-base text-stone-900 font-poppins">
                {editingProduct ? "Edit Dish Item" : "Add New Dish Item"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Creamy Mozzarella Risoles Mayo"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Category</label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 text-xs bg-white text-stone-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Price (IDR)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="18000"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Dish Photo URL</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 text-xs bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-700 uppercase">Culinary Description</label>
                  <button
                    type="button"
                    disabled={isGeneratingCopy || !formName.trim()}
                    onClick={handleGenerateCopy}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-resto-red-600 to-amber-600 hover:from-resto-red-700 hover:to-amber-700 disabled:opacity-40 text-white text-[10px] font-bold shadow-xs cursor-pointer transition-all"
                    title="Let Gemini craft an enticing culinary description and promo copywriting"
                  >
                    <span>✨</span>
                    <span>{isGeneratingCopy ? "Crafting with AI..." : "Auto-Craft with AI"}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe the flavors and ingredients of this dish (or click Auto-Craft with AI)..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 text-xs bg-white"
                />

                {promoTagline && (
                  <div className="mt-2 p-2.5 rounded-2xl bg-amber-50 border border-yellow-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-resto-red-700 flex items-center space-x-1">
                        <span>✨</span>
                        <span>AI Promo Assets Generated</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPromoModal(true)}
                        className="text-[10px] text-resto-red-800 font-bold hover:underline cursor-pointer"
                      >
                        View Social Broadcast Copy &rarr;
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-800 font-medium italic">
                      &ldquo;{promoTagline}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="w-4 h-4 text-resto-red-600 rounded border-resto-yellow-300 focus:ring-resto-red-500 cursor-pointer"
                />
                <label htmlFor="availCheck" className="text-stone-700 font-semibold cursor-pointer">
                  Available (Customers can order this dish)
                </label>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-resto-yellow-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-resto-yellow-200 text-stone-600 font-bold cursor-pointer hover:bg-resto-yellow-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 disabled:opacity-50 text-white font-bold shadow-md shadow-resto-red-600/20 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Menu Advisor Modal */}
      {isAiAdvisorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col p-6 shadow-2xl border-2 border-yellow-400 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-resto-yellow-100">
              <div className="flex items-center space-x-2.5">
                <span className="w-10 h-10 rounded-2xl bg-yellow-400 text-red-950 font-black text-lg flex items-center justify-center shadow-md">
                  💡
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-resto-red-700">
                    Gemini AI Culinary Advisor
                  </span>
                  <h3 className="font-black text-lg text-stone-900 font-poppins">
                    Menu Expansion &amp; R&amp;D Recommendations
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsAiAdvisorOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {aiAdvisorLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-9 h-9 border-3 border-resto-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-stone-500 font-medium animate-pulse">
                    Chef Gemini is analyzing current menu gaps, popular culinary trends, and profit margins...
                  </p>
                </div>
              ) : (
                <>
                  {aiAnalysis && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 text-xs text-stone-800 flex items-center space-x-2">
                      <span className="text-lg">📊</span>
                      <div>
                        <strong className="block text-resto-red-900 font-poppins">Catalog Observation:</strong>
                        <span>{aiAnalysis}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Recommended New Dishes to Introduce:
                    </h4>
                    {aiIdeas.map((idea, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border-2 border-resto-yellow-200 hover:border-yellow-400 p-4 space-y-2 shadow-xs transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-black text-sm sm:text-base text-stone-900 font-poppins">
                                {idea.name}
                              </h5>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300">
                                {idea.categoryName}
                              </span>
                            </div>
                            <span className="text-xs font-black text-resto-red-700 font-poppins mt-0.5 block">
                              Suggested: {formatRupiah(idea.suggestedPrice)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyIdea(idea)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 text-white font-bold text-xs shadow-xs active:scale-95 cursor-pointer shrink-0"
                          >
                            + Use this Idea
                          </button>
                        </div>

                        <p className="text-xs text-stone-600 italic leading-relaxed">
                          &ldquo;{idea.description}&rdquo;
                        </p>

                        <div className="pt-2 border-t border-resto-yellow-100 flex items-center space-x-1.5 text-[11px] text-amber-900 font-medium">
                          <span>🎯</span>
                          <span><strong>Why it sells:</strong> {idea.commercialReason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-resto-yellow-100 flex justify-between items-center text-xs">
              <button
                type="button"
                disabled={aiAdvisorLoading}
                onClick={() => {
                  setAiIdeas([]);
                  handleOpenAdvisor();
                }}
                className="text-resto-red-700 hover:underline font-bold cursor-pointer"
              >
                ↻ Refresh New AI Ideas
              </button>
              <button
                type="button"
                onClick={() => setIsAiAdvisorOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Media & Promo Copywriting Preview Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-yellow-400 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-resto-yellow-100">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📢</span>
                <h3 className="font-black text-base text-stone-900 font-poppins">
                  AI Social Media Promo Broadcast
                </h3>
              </div>
              <button
                onClick={() => setShowPromoModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-yellow-50 border border-yellow-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-900 block">
                  Promotional Banner Tagline:
                </span>
                <p className="font-bold text-stone-900 text-sm italic">
                  &ldquo;{promoTagline}&rdquo;
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-stone-600">
                    WhatsApp &amp; Instagram Broadcast Template:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(socialPromo);
                      alert("Promo text copied to clipboard!");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] cursor-pointer"
                  >
                    📋 Copy Text
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={socialPromo}
                  className="w-full p-3 rounded-2xl border border-resto-yellow-200 bg-stone-50 font-mono text-[11px] leading-relaxed text-stone-800"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-resto-yellow-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

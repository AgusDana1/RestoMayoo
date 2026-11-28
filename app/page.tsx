"use client";

import React, { useState, useEffect, useMemo, useCallback, useDeferredValue, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import TableSelectModal from "../components/TableSelectModal";
import FoodCopilotModal from "../components/FoodCopilotModal";
import ProductCustomizationModal from "../components/ProductCustomizationModal";
import RestaurantFooter from "../components/RestaurantFooter";
import { useCart } from "../context/CartContext";
import { getOptimizedImageUrl } from "../lib/image";

function TableQrDetector() {
  const searchParams = useSearchParams();
  const { tableCode, setCustomerInfo, customerName } = useCart();
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const paramTable = searchParams.get("table") || searchParams.get("meja");
    if (paramTable && (!tableCode || tableCode.toLowerCase() !== paramTable.toLowerCase())) {
      fetch("/api/tables")
        .then((res) => (res.ok ? res.json() : []))
        .then((tables: Array<{ id: number; table_code: string; table_number: number }>) => {
          const matched = tables.find(
            (t) =>
              t.table_code.toLowerCase() === paramTable.toLowerCase() ||
              t.table_number.toString() === paramTable
          );
          if (matched) {
            setCustomerInfo(customerName || "", matched.table_code, matched.id);
            setToastMsg(`✨ Connected to Table ${matched.table_code}`);
            setTimeout(() => setToastMsg(""), 5000);
          }
        })
        .catch((e) => console.error("Error auto-detecting table from QR", e));
    }
  }, [searchParams, tableCode, customerName, setCustomerInfo]);

  if (!toastMsg) return null;

  return (
    <div className="fixed top-24 right-4 z-50 max-w-sm animate-in slide-in-from-top-2 duration-300">
      <div className="bg-[#D94B35] text-white px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center space-x-2 border border-[#F2C14E]">
        <span className="text-base">🪑</span>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: number | string;
  image?: string | null;
  is_available: boolean;
  category?: Category;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);

  useEffect(() => {
    const updatePageSize = () => {
      setItemsPerPage(window.innerWidth < 640 ? 6 : 8);
    };
    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  const {
    cart,
    addToCart,
    totalItems,
    totalAmount,
    tableCode,
  } = useCart();

  // Fetch menu data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (e) {
      console.error("Error fetching menu data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "all" || p.category_id.toString() === selectedCategory;
      const matchSearch =
        !deferredSearchQuery.trim() ||
        p.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(deferredSearchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, deferredSearchQuery]);

  // Reset to page 1 when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, deferredSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, safeCurrentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Featured Products (3-5 real dishes from database)
  const featuredProducts = useMemo(() => {
    if (!products.length) return [];
    const prioritizedKeywords = ["Risoles", "Mentai", "Spesial", "Kopi"];
    const featured: Product[] = [];

    for (const kw of prioritizedKeywords) {
      const match = products.find(
        (p) => p.name.includes(kw) && !featured.some((f) => f.id === p.id)
      );
      if (match) featured.push(match);
    }

    // Fill up to 4 if needed
    for (const p of products) {
      if (featured.length >= 4) break;
      if (!featured.some((f) => f.id === p.id)) featured.push(p);
    }

    return featured;
  }, [products]);

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  const getProductBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("risoles")) return { text: "Signature", color: "bg-[#D94B35] text-white" };
    if (lower.includes("mentai")) return { text: "Best Seller", color: "bg-[#F2C14E] text-[#30251F]" };
    if (lower.includes("pedas")) return { text: "Spicy 🌶️", color: "bg-[#B73824] text-white" };
    if (lower.includes("spesial")) return { text: "Chef's Pick", color: "bg-[#829477] text-white" };
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-[#30251F] font-sans antialiased selection:bg-[#F2C14E]/40">
      
      {/* Table QR detector from query string */}
      <Suspense fallback={null}>
        <TableQrDetector />
      </Suspense>

      {/* 1. Announcement Bar & 2. Navigation */}
      <Navbar onSelectTableClick={() => setIsTableModalOpen(true)} />

      {/* Table Select Modal */}
      <TableSelectModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />

      {/* AI Food Copilot Modal */}
      <FoodCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        products={products}
        onAddToCart={addToCart}
      />

      {/* Product Customization Modal */}
      <ProductCustomizationModal
        product={customizingProduct}
        isOpen={Boolean(customizingProduct)}
        onClose={() => setCustomizingProduct(null)}
        onAddToCart={addToCart}
      />

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#FFF9F0] border-b border-[#EADBCA] py-8 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Authentic Copy & Actions */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F2F5F0] border border-[#829477]/40 text-[#829477] text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#829477]"></span>
                <span>Casual Dining &bull; Made Fresh Daily in Bali</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#30251F] font-heading tracking-tight leading-[1.2]">
                Comfort food reimagined with{" "}
                <span className="text-[#D94B35]">artisanal mayo</span> &amp; wok mastery.
              </h1>

              <p className="text-xs sm:text-base text-[#5F4E44] leading-relaxed max-w-xl">
                Crispy melted cheese risoles, smoky wok-charred fried rice, and fire-torched mentai dimsum. Handcrafted with authentic spices and served directly to your table.
              </p>

              {/* CTAs & Table Status */}
              <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
                <a
                  href="#menu"
                  className="flex-1 sm:flex-initial justify-center px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#D94B35] hover:bg-[#B73824] text-white font-bold text-xs sm:text-sm font-heading shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-2"
                >
                  <span>Explore Menu</span>
                  <span>&darr;</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="flex-1 sm:flex-initial justify-center px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white hover:bg-[#FEF8E9] border border-[#EADBCA] text-[#30251F] font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>🪑</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{tableCode ? `Table ${tableCode}` : "Select Table"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(true)}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#F2C14E] hover:bg-[#D4A334] text-[#30251F] font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5 shadow-xs"
                >
                  <span>✨</span>
                  <span>Food Copilot</span>
                </button>
              </div>

              {/* Service Trust Pillars */}
              <div className="pt-4 border-t border-[#EADBCA] grid grid-cols-3 gap-2 sm:gap-4 text-left">
                <div>
                  <span className="block text-xs sm:text-base font-extrabold text-[#30251F] font-heading">100%</span>
                  <span className="text-[9px] sm:text-xs text-[#8E7A6F] font-medium leading-tight block">Fresh Ingredients</span>
                </div>
                <div>
                  <span className="block text-xs sm:text-base font-extrabold text-[#D94B35] font-heading">Wok Hei</span>
                  <span className="text-[9px] sm:text-xs text-[#8E7A6F] font-medium leading-tight block">High Flame Wok</span>
                </div>
                <div>
                  <span className="block text-xs sm:text-base font-extrabold text-[#829477] font-heading">QR Order</span>
                  <span className="text-[9px] sm:text-xs text-[#8E7A6F] font-medium leading-tight block">Direct Kitchen Ticket</span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Food Photography Hero Collage (Hidden on mobile phones) */}
            <div className="hidden sm:block lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-[#F2EDE4] aspect-4/3 sm:aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80"
                  alt="Resto Mayo signature golden crispy risoles"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#30251F]/60 via-transparent to-transparent flex items-end p-4 sm:p-6">
                  <div className="text-white space-y-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#D94B35] text-white text-[10px] font-bold uppercase tracking-wider">
                      Signature Dish
                    </span>
                    <h2 className="text-base sm:text-xl font-bold font-heading">
                      Risoles Mayonise Keju Lumer
                    </h2>
                    <p className="text-xs text-[#FFF9F0]/90">
                      Smoked beef, soft boiled egg &amp; molten mozzarella.
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Badge Card */}
              <div className="absolute bottom-2 left-2 sm:-bottom-5 sm:-left-5 bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg border border-[#EADBCA] flex items-center space-x-2.5 sm:space-x-3 max-w-[180px] sm:max-w-[220px]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#FEF8E9] text-[#D94B35] flex items-center justify-center text-base sm:text-xl shrink-0 border border-[#F2C14E]">
                  🔥
                </div>
                <div className="leading-tight">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#8E7A6F] block">Chef Recommends</span>
                  <span className="text-[11px] sm:text-xs font-extrabold text-[#30251F] font-heading">Fresh From The Wok</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FEATURED MENU */}
      <section id="featured" className="py-12 sm:py-16 bg-white border-b border-[#EADBCA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D94B35] block mb-1">
                Customer Favorites
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#30251F] font-heading">
                Featured Dishes
              </h2>
              <p className="text-xs sm:text-sm text-[#5F4E44] mt-1 max-w-lg">
                Crafted to perfection with our signature sauce blends. The dishes our regular guests order time and again.
              </p>
            </div>

            <a
              href="#menu"
              className="text-xs font-bold text-[#D94B35] hover:text-[#B73824] flex items-center space-x-1"
            >
              <span>View All Menu ({products.length} Items)</span>
              <span>&rarr;</span>
            </a>
          </div>

          {/* Featured Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((dish) => {
              const badge = getProductBadge(dish.name);
              return (
                <div
                  key={dish.id}
                  className="bg-[#FFF9F0] rounded-2xl border border-[#EADBCA] overflow-hidden hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#F2EDE4]">
                    <img
                      src={getOptimizedImageUrl(dish.image)}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {badge && (
                      <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${badge.color}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-[#30251F] font-heading group-hover:text-[#D94B35] transition-colors line-clamp-1">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-[#5F4E44] mt-1 line-clamp-2 leading-relaxed">
                        {dish.description || "Authentic freshly prepared dish with signature mayo recipe."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#EADBCA] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#8E7A6F] uppercase font-bold block">Price</span>
                        <span className="text-sm sm:text-base font-black text-[#D94B35] font-heading">
                          {formatRupiah(dish.price)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCustomizingProduct(dish)}
                        className="px-3.5 py-2 rounded-xl bg-[#D94B35] hover:bg-[#B73824] text-white font-bold text-xs font-heading shadow-xs transition-transform active:scale-95 cursor-pointer"
                      >
                        Order &bull; Customize
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. MENU CATEGORIES & 6. FULL MENU CATALOG */}
      <section id="menu" className="py-12 sm:py-16 bg-[#FFF9F0] border-b border-[#EADBCA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D94B35]">
              Freshly Prepared to Order
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#30251F] font-heading">
              Our Full Menu Catalog
            </h2>
            <p className="text-xs sm:text-sm text-[#5F4E44]">
              Explore our complete selection of savory meals, artisan dimsum, and refreshing beverages. Customize your toppings and spice level before checkout.
            </p>
          </div>

          {/* Category Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-8">
            {/* Category Filter Pills (Edge-to-edge mobile scroll) */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-[#D94B35] text-white shadow-xs"
                    : "bg-white text-[#5F4E44] hover:bg-[#FEF8E9] border border-[#EADBCA]"
                }`}
              >
                All Menu ({products.length})
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id.toString();
                const count = products.filter((p) => p.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id.toString())}
                    className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-[#D94B35] text-white shadow-xs"
                        : "bg-white text-[#5F4E44] hover:bg-[#FEF8E9] border border-[#EADBCA]"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input & Copilot */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes or drinks..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-[#EADBCA] text-xs font-medium text-[#30251F] placeholder:text-[#8E7A6F] focus:outline-none focus:border-[#D94B35]"
                />
                <span className="absolute left-3 top-2.5 text-xs text-[#8E7A6F]">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-xs text-[#8E7A6F] hover:text-[#D94B35]"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsCopilotOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#F2C14E] hover:bg-[#D4A334] text-[#30251F] font-bold text-xs flex items-center space-x-1.5 shrink-0 shadow-xs cursor-pointer"
                title="Natural language search with AI Food Copilot"
              >
                <span>✨</span>
                <span>Copilot</span>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-[#EADBCA] animate-pulse space-y-3">
                  <div className="w-full h-32 sm:h-44 bg-[#F2EDE4] rounded-xl"></div>
                  <div className="h-4 bg-[#F2EDE4] rounded w-3/4"></div>
                  <div className="h-3 bg-[#F2EDE4] rounded w-full"></div>
                  <div className="h-5 bg-[#F2EDE4] rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#EADBCA] p-6 max-w-md mx-auto space-y-2">
              <span className="text-3xl block">🍳</span>
              <h3 className="font-bold text-base text-[#30251F] font-heading">No dishes found</h3>
              <p className="text-xs text-[#8E7A6F]">Try searching another keyword or switch category filters.</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {paginatedProducts.map((product) => {
                const badge = getProductBadge(product.name);
                const cartQty = cart
                  .filter((item) => item.id === product.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-[#EADBCA] hover:border-[#D94B35]/50 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Image Frame */}
                      <div className="relative h-32 sm:h-44 w-full bg-[#F2EDE4] overflow-hidden">
                        <img
                          src={getOptimizedImageUrl(product.image)}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {badge && (
                          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badge.color}`}>
                            {badge.text}
                          </span>
                        )}

                        {!product.is_available && (
                          <div className="absolute inset-0 bg-[#30251F]/70 flex items-center justify-center p-2 text-center">
                            <span className="px-2.5 py-1 rounded bg-[#D94B35] text-white text-[10px] font-bold uppercase">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3 sm:p-4 space-y-1 sm:space-y-1.5">
                        <h3 className="font-bold text-xs sm:text-sm text-[#30251F] font-heading group-hover:text-[#D94B35] transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-[#5F4E44] line-clamp-2 leading-relaxed">
                          {product.description || "Authentic freshly crafted dish prepared to order."}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-2.5 sm:p-4 pt-2 border-t border-[#EADBCA] flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <span className="text-[8px] sm:text-[9px] text-[#8E7A6F] font-bold uppercase block">
                          Price
                        </span>
                        <span className="text-xs sm:text-sm font-black text-[#D94B35] font-heading truncate block">
                          {formatRupiah(product.price)}
                        </span>
                      </div>

                      {product.is_available && (
                        <button
                          type="button"
                          onClick={() => setCustomizingProduct(product)}
                          className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-[#D94B35] hover:bg-[#B73824] text-white font-bold text-[10px] sm:text-xs font-heading shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center space-x-1 shrink-0"
                        >
                          <span>+ Order</span>
                          {cartQty > 0 && (
                            <span className="w-4 h-4 rounded-full bg-[#F2C14E] text-[#30251F] text-[9px] font-black inline-flex items-center justify-center">
                              {cartQty}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Responsive Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 sm:mt-10 pt-6 border-t border-[#EADBCA] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[#5F4E44] font-medium text-center sm:text-left">
                  Showing{" "}
                  <span className="font-bold text-[#30251F]">
                    {(safeCurrentPage - 1) * itemsPerPage + 1}
                  </span>
                  &ndash;
                  <span className="font-bold text-[#30251F]">
                    {Math.min(safeCurrentPage * itemsPerPage, filteredProducts.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#30251F]">
                    {filteredProducts.length}
                  </span>{" "}
                  dishes
                </p>

                <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    className="px-3 py-2 rounded-xl bg-white border border-[#EADBCA] text-[#30251F] hover:bg-[#FEF8E9] disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition-colors cursor-pointer"
                  >
                    &larr; Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter((page) => {
                      if (totalPages <= 5) return true;
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - safeCurrentPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-1.5 text-xs text-[#8E7A6F] font-bold">
                              &hellip;
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePageChange(page)}
                            aria-current={safeCurrentPage === page ? "page" : undefined}
                            className={`min-w-[34px] h-[34px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              safeCurrentPage === page
                                ? "bg-[#D94B35] text-white shadow-xs"
                                : "bg-white border border-[#EADBCA] text-[#5F4E44] hover:bg-[#FEF8E9]"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    className="px-3 py-2 rounded-xl bg-white border border-[#EADBCA] text-[#30251F] hover:bg-[#FEF8E9] disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition-colors cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
            </>
          )}

        </div>
      </section>

      {/* 7. WHY RESTO MAYO (Our Craft & Advantages) */}
      <section id="why-us" className="py-12 sm:py-16 bg-white border-b border-[#EADBCA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#829477]">
              The Resto Mayo Difference
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#30251F] font-heading">
              Why Diners Love Resto Mayo
            </h2>
            <p className="text-xs sm:text-sm text-[#5F4E44]">
              We believe everyday casual comfort food deserves uncompromising craft, fresh ingredients, and thoughtful dining hospitality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#FFF9F0] p-6 rounded-3xl border border-[#EADBCA] space-y-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#D94B35] text-white flex items-center justify-center text-xl shadow-xs">
                🧀
              </div>
              <h3 className="font-extrabold text-base text-[#30251F] font-heading">
                Artisanal Mayo Recipe
              </h3>
              <p className="text-xs text-[#5F4E44] leading-relaxed">
                Handcrafted daily with pasteurized egg yolks, subtle lemon zest, and balanced seasonings. Creamy, tangy, and never cloying.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#FFF9F0] p-6 rounded-3xl border border-[#EADBCA] space-y-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#F2C14E] text-[#30251F] flex items-center justify-center text-xl shadow-xs">
                🔥
              </div>
              <h3 className="font-extrabold text-base text-[#30251F] font-heading">
                Wok Hei Mastery
              </h3>
              <p className="text-xs text-[#5F4E44] leading-relaxed">
                High-temperature open flame wok cooking delivers that irresistible smoky breath-of-the-wok aroma in every grain of rice.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#FFF9F0] p-6 rounded-3xl border border-[#EADBCA] space-y-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#829477] text-white flex items-center justify-center text-xl shadow-xs">
                🥟
              </div>
              <h3 className="font-extrabold text-base text-[#30251F] font-heading">
                Crispy &amp; Melty Perfection
              </h3>
              <p className="text-xs text-[#5F4E44] leading-relaxed">
                Breaded with light Japanese panko and flash-fried to golden crispness with rich molten mozzarella cheese pull in every bite.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#FFF9F0] p-6 rounded-3xl border border-[#EADBCA] space-y-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#30251F] text-[#FFF9F0] flex items-center justify-center text-xl shadow-xs">
                📱
              </div>
              <h3 className="font-extrabold text-base text-[#30251F] font-heading">
                Instant Table QR Ordering
              </h3>
              <p className="text-xs text-[#5F4E44] leading-relaxed">
                No standing in queues. Browse the menu, customize spicy levels and toppings, and send tickets directly to the kitchen from your seat.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 8. RESTAURANT STORY */}
      <section id="story" className="py-12 sm:py-16 bg-[#FFF9F0] border-b border-[#EADBCA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Story Image */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-[#F2EDE4] aspect-4/3 relative">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"
                  alt="Resto Mayo casual dining atmosphere"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-[#30251F]/90 text-[#FFF9F0] px-3.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-xs">
                  Sanur, Bali &bull; Est. 2024
                </div>
              </div>
            </div>

            {/* Story Narrative */}
            <div className="lg:col-span-7 space-y-4 text-left order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D94B35]">
                Our Culinary Story
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#30251F] font-heading leading-tight">
                From kitchen passion to casual dining comfort.
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-[#5F4E44] leading-relaxed">
                <p>
                  Resto Mayo began with a simple passion: elevating Indonesia&apos;s beloved afternoon treat—the crispy cheese mayonnaise risoles—into an artisanal casual dining staple. We experimented with hundreds of pastry skins, crumb textures, and house-made mayo balances until we achieved that perfect crunch and molten center.
                </p>
                <p>
                  Today, we have grown to welcome families, travelers, and food lovers to our cozy dining room in Sanur, Bali. Alongside our signature risoles, we serve smoky wok-fried rice dishes, steamed mentai dimsum, and handcrafted iced drinks made fresh every single day.
                </p>
              </div>

              <div className="pt-2 flex items-center space-x-6 text-xs text-[#30251F] font-bold">
                <div>
                  <span className="text-lg font-black text-[#D94B35] block font-heading">Sanur</span>
                  <span className="text-[#8E7A6F] font-normal">Flagship Location</span>
                </div>
                <div className="h-8 w-px bg-[#EADBCA]"></div>
                <div>
                  <span className="text-lg font-black text-[#F2C14E] block font-heading">12+</span>
                  <span className="text-[#8E7A6F] font-normal">House Specialties</span>
                </div>
                <div className="h-8 w-px bg-[#EADBCA]"></div>
                <div>
                  <span className="text-lg font-black text-[#829477] block font-heading">Halal</span>
                  <span className="text-[#8E7A6F] font-normal">Strict Quality</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. LOCATION AND OPENING HOURS */}
      <section id="location" className="py-12 sm:py-16 bg-white border-b border-[#EADBCA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D94B35]">
              Visit Our Restaurant
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#30251F] font-heading">
              Location &amp; Hours
            </h2>
            <p className="text-xs sm:text-sm text-[#5F4E44]">
              Join us for a warm casual dine-in meal, quick takeaway, or direct table QR ordering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Address Card */}
            <div className="p-6 rounded-3xl bg-[#FFF9F0] border border-[#EADBCA] space-y-2.5 text-left">
              <span className="text-2xl block">📍</span>
              <h3 className="font-extrabold text-base text-[#30251F] font-heading">
                Restaurant Address
              </h3>
              <p className="text-xs text-[#5F4E44] leading-relaxed">
                Jl. Danau Tamblingan No. 88, Sanur, Denpasar Selatan, Kota Denpasar, Bali 80228
              </p>
              <span className="text-[11px] font-bold text-[#829477] inline-block pt-1">
                &bull; 5 min walk from Sanur Beach
              </span>
            </div>

            {/* Operating Hours Card */}
            <div className="p-6 rounded-3xl bg-[#FFF9F0] border border-[#EADBCA] space-y-2.5 text-left">
              <span className="text-2xl block">🕒</span>
              <h3 className="font-extrabold text-base text-[#30251F] font-heading">
                Operating Hours
              </h3>
              <div className="text-xs text-[#5F4E44] space-y-1">
                <p><strong className="text-[#30251F]">Monday &ndash; Friday:</strong> 10:00 &ndash; 22:00 WITA</p>
                <p><strong className="text-[#30251F]">Saturday &ndash; Sunday:</strong> 10:00 &ndash; 22:00 WITA</p>
                <p className="text-[11px] text-[#D94B35] font-semibold pt-1">
                  Last kitchen order at 21:30 WITA
                </p>
              </div>
            </div>

            {/* Inquiries & Amenities Card */}
            <div className="p-6 rounded-3xl bg-[#FFF9F0] border border-[#EADBCA] space-y-2.5 text-left">
              <span className="text-2xl block">✨</span>
              <h3 className="font-extrabold text-base text-[#30251F] font-heading">
                Amenities &amp; Contact
              </h3>
              <div className="text-xs text-[#5F4E44] space-y-1">
                <p><strong className="text-[#30251F]">WhatsApp:</strong> +62 877-5500-0371</p>
                <p><strong className="text-[#30251F]">WiFi &amp; AC:</strong> Indoor AC &amp; Garden Terrace</p>
                <p><strong className="text-[#30251F]">Payment:</strong> QRIS, E-Wallet, Card, Cash</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 10. FOOTER */}
      <RestaurantFooter />

      {/* FLOATING BOTTOM CART BAR (Responsive on Mobile & Tablet) */}
      {totalItems > 0 && (
        <div className="fixed bottom-3 sm:bottom-6 inset-x-0 z-40 max-w-xl mx-auto px-3 sm:px-4 animate-in slide-in-from-bottom-4 duration-200 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-[#30251F] text-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl border border-[#F2C14E] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#D94B35] text-white font-extrabold text-xs sm:text-base flex items-center justify-center shrink-0 border border-white/20">
                {totalItems}
              </div>
              <div className="leading-tight">
                <span className="text-[9px] sm:text-[10px] text-[#F2C14E] uppercase font-bold tracking-wider block">
                  {tableCode ? `Table ${tableCode} Order` : "Your Order Cart"}
                </span>
                <span className="text-sm sm:text-lg font-black font-heading text-white">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            <Link
              href="/cart"
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#F2C14E] hover:bg-[#D4A334] text-[#30251F] font-extrabold text-xs sm:text-sm font-heading shadow-sm transition-transform active:scale-95"
            >
              View Cart &rarr;
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

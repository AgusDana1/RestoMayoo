"use client";

import React, { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCatName, setNewCatName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setErrorMsg("");

    try {
      setSubmitting(true);
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add category");
      }

      setNewCatName("");
      await fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add category.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-resto-yellow-200/80 pb-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 shadow-2xs mb-2">
            <span>🏷️</span>
            <span>Menu Categories</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-poppins">
            Food &amp; Beverage <span className="text-resto-red-700">Categories</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage Resto Mayo menu groups and classifications (e.g. Food, Beverages, Dimsum).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Form Tambah Kategori */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl border border-resto-yellow-200 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-stone-900 font-poppins pb-3 border-b border-resto-yellow-100">
              + Add New Category
            </h2>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-resto-red-50 text-resto-red-700 border border-resto-red-200 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Category Name <span className="text-resto-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Dessert, Snacks, Coffee..."
                  className="w-full px-4 py-3 rounded-2xl border border-resto-yellow-200 text-xs focus:outline-none focus:ring-2 focus:ring-resto-red-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !newCatName.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-resto-red-600/20 transition-all cursor-pointer active:scale-95"
              >
                {submitting ? "Saving..." : "Save Category"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Daftar Kategori */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl border border-resto-yellow-200 shadow-xs overflow-hidden p-6 space-y-4">
            <h2 className="text-base font-bold text-stone-900 font-poppins pb-3 border-b border-resto-yellow-100 flex items-center justify-between">
              <span>Active Categories</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300">
                {categories.length} Categories
              </span>
            </h2>

            {loading ? (
              <div className="py-12 text-center text-xs text-stone-400">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">No categories found.</div>
            ) : (
              <div className="divide-y divide-resto-yellow-100">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-resto-yellow-50/20 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-xl bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 font-bold flex items-center justify-center font-poppins shadow-2xs">
                        #{cat.id}
                      </span>
                      <span className="font-bold text-sm text-stone-900 font-poppins">{cat.name}</span>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-resto-yellow-50 text-stone-700 border border-resto-yellow-200">
                      {cat._count?.products || 0} Linked Dishes
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

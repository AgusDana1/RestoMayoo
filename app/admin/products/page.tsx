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
    setIsModalOpen(true);
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
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
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
            <span>Katalog Makanan &amp; Minuman</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-poppins">
            Manajemen <span className="text-resto-red-700">Produk &amp; Menu</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Kelola menu hidangan Resto Mayo, status ketersediaan di etalase, dan harga satuan.
          </p>
        </div>

        <div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 text-white font-bold text-xs shadow-md shadow-resto-red-600/20 transition-all cursor-pointer active:scale-95"
          >
            <span>+ Tambah Menu Baru</span>
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-3xl border border-resto-yellow-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400">Memuat daftar menu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-resto-yellow-50/60 text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-resto-yellow-100">
                <tr>
                  <th className="py-3.5 px-4">Menu &amp; Foto</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Harga Satuan</th>
                  <th className="py-3.5 px-4">Ketersediaan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
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
                        <span>{product.is_available ? "Tersedia" : "Habis"}</span>
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
                        Hapus
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
                {editingProduct ? "Edit Menu Hidangan" : "Tambah Menu Hidangan Baru"}
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
                <label className="block font-bold text-stone-700 uppercase mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Risoles Mayonise Keju Lumer"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Kategori</label>
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
                  <label className="block font-bold text-stone-700 uppercase mb-1">Harga (IDR)</label>
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
                <label className="block font-bold text-stone-700 uppercase mb-1">URL Foto Makanan</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Deskripsi Kuliner</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Jelaskan kelezatan hidangan ini..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 text-xs bg-white"
                />
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
                  Menu Tersedia (Dapat dipesan pelanggan)
                </label>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-resto-yellow-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-resto-yellow-200 text-stone-600 font-bold cursor-pointer hover:bg-resto-yellow-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 disabled:opacity-50 text-white font-bold shadow-md shadow-resto-red-600/20 cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

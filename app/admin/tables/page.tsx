"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TableItem {
  id: number;
  table_code: string;
  table_number: number;
  status: "available" | "occupied";
  active_orders?: number;
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [tableCode, setTableCode] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tables");
      if (res.ok) {
        setTables(await res.json());
      }
    } catch (e) {
      console.error("Failed to load tables:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const openAddModal = () => {
    setEditingTable(null);
    const nextNum =
      tables.length > 0
        ? Math.max(...tables.map((t) => t.table_number)) + 1
        : 1;
    setTableNumber(String(nextNum));
    setTableCode(`M${String(nextNum).padStart(2, "0")}`);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (t: TableItem) => {
    setEditingTable(t);
    setTableCode(t.table_code);
    setTableNumber(String(t.table_number));
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      setSubmitting(true);
      const url = editingTable ? `/api/tables/${editingTable.id}` : "/api/tables";
      const method = editingTable ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_code: tableCode.trim().toUpperCase(),
          table_number: Number(tableNumber),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save table");
        return;
      }
      setIsModalOpen(false);
      await fetchTables();
    } catch {
      setErrorMsg("Terjadi kesalahan saat menyimpan data meja.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (t: TableItem) => {
    const nextStatus = t.status === "occupied" ? "available" : "occupied";
    if (
      nextStatus === "available" &&
      (t.active_orders || 0) > 0 &&
      !window.confirm(
        `Meja ${t.table_code} masih memiliki ${t.active_orders} pesanan aktif. Tetap tandai Available? (Jika pesanan masih pending/processing/ready, status akan tetap mengikuti pesanan aktif sampai diselesaikan).`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/tables/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchTables();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (t: TableItem) => {
    if (!window.confirm(`Hapus meja ${t.table_code} (#${t.table_number})?`)) return;
    try {
      const res = await fetch(`/api/tables/${t.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal menghapus meja.");
        return;
      }
      await fetchTables();
    } catch {
      alert("Terjadi kesalahan saat menghapus meja.");
    }
  };

  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const availableCount = tables.length - occupiedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-resto-yellow-200/80 pb-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 shadow-2xs mb-2">
            <span>🪑</span>
            <span>Dining Floor &amp; Seating</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-poppins">
            Resto Mayo <span className="text-resto-red-700">Table Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Monitor meja terisi, reset status meja secara manual, atau tambah meja baru.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchTables}
            className="px-4 py-2.5 rounded-2xl bg-white border border-resto-yellow-200 text-xs font-bold hover:bg-resto-yellow-50 text-stone-700 shadow-2xs transition-colors cursor-pointer"
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 text-white font-bold text-xs shadow-md shadow-resto-red-600/20 transition-all cursor-pointer active:scale-95"
          >
            <span>+ Add New Table</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-3xl border border-resto-yellow-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Total Tables</span>
          <span className="text-2xl font-black text-stone-900 font-poppins">{tables.length}</span>
        </div>
        <div className="p-4 bg-white rounded-3xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-700 block">Available</span>
          <span className="text-2xl font-black text-emerald-700 font-poppins">{availableCount}</span>
        </div>
        <div className="p-4 bg-white rounded-3xl border border-amber-300 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-800 block">Occupied</span>
          <span className="text-2xl font-black text-amber-700 font-poppins">{occupiedCount}</span>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400">Loading dining tables...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tables.map((t) => {
            const isOccupied = t.status === "occupied";
            return (
              <div
                key={t.id}
                className={`bg-white rounded-3xl border-2 p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  isOccupied
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-resto-yellow-200 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-stone-400">
                      Table #{t.table_number}
                    </span>
                    <h3 className="text-2xl font-black text-stone-900 font-poppins">
                      {t.table_code}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      isOccupied
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {isOccupied ? "Occupied" : "Available"}
                  </span>
                </div>

                <div className="text-xs text-stone-500">
                  Active Orders:{" "}
                  <strong className="text-stone-800">{t.active_orders ?? 0}</strong>
                </div>

                <div className="space-y-2 pt-2 border-t border-resto-yellow-100">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(t)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isOccupied
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {isOccupied ? "✓ Reset to Available" : "Mark as Occupied"}
                  </button>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="flex-1 py-1.5 rounded-xl bg-resto-yellow-100 hover:bg-resto-yellow-200 text-resto-yellow-950 font-bold text-[11px] border border-resto-yellow-300 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="flex-1 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-resto-yellow-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-resto-yellow-100">
              <h3 className="font-black text-base text-stone-900 font-poppins">
                {editingTable ? `Edit Table ${editingTable.table_code}` : "Add New Table"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Table Code
                </label>
                <input
                  type="text"
                  required
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value)}
                  placeholder="e.g. M11 or VIP01"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Table Number
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 focus:outline-none focus:ring-2 focus:ring-resto-red-500 bg-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
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
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

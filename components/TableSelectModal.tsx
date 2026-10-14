"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../context/CartContext";

interface Table {
  id: number;
  table_code: string;
  table_number: number;
  status: string;
}

export default function TableSelectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { customerName, tableCode, setCustomerInfo } = useCart();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [nameInput, setNameInput] = useState<string>(customerName || "");
  const [loading, setLoading] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        const current = data.find((t: Table) => t.table_code === tableCode);
        if (current) setSelectedTable(current);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tableCode]);

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen, fetchTables]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setCustomerInfo(nameInput.trim() || "Pelanggan", selectedTable.table_code, selectedTable.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border-2 border-yellow-400 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Vibrant Culinary Red with Golden Yellow Badge */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-4 sm:p-6 text-white text-center relative border-b-4 border-yellow-400">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs sm:text-sm cursor-pointer"
          >
            ✕
          </button>
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-red-950 mb-1.5 sm:mb-2 shadow-xs">
            <span>🍽️ Ruang Santap Resto Mayo</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black font-poppins text-yellow-300 drop-shadow-sm">
            Tentukan Meja &amp; Nama Anda
          </h2>
          <p className="text-[11px] sm:text-xs text-yellow-100/90 mt-0.5 font-medium">
            Pesanan lezat Anda akan langsung diantar oleh pramusaji ke meja ini.
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-5 bg-[#FFFDF5]">
          {/* Nama Pemesan */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-red-950 mb-1 sm:mb-2 font-poppins">
              Nama Lengkap Pemesan <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-amber-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-yellow-300"
            />
          </div>

          {/* Grid Meja */}
          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-red-950 font-poppins">
                Pilih Meja Resto <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center space-x-2 text-[10px] font-bold">
                <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Tersedia</span>
                </span>
                <span className="flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Terisi</span>
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-amber-700 font-medium">Memuat data meja...</div>
            ) : (
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 max-h-48 sm:max-h-52 overflow-y-auto p-1">
                {tables.map((t) => {
                  const isSelected = selectedTable?.id === t.id;
                  const isOccupied = t.status === "occupied";
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTable(t)}
                      className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-b from-red-600 to-red-700 text-yellow-300 border-yellow-400 shadow-md shadow-red-600/30 scale-102"
                          : isOccupied
                          ? "bg-amber-100/60 border-amber-300 text-amber-900 hover:border-amber-400"
                          : "bg-white border-amber-200 text-gray-800 hover:border-yellow-400 hover:bg-yellow-50/50"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-black font-poppins">{t.table_code}</span>
                      <span className={`text-[8px] sm:text-[9px] mt-0.5 font-bold ${isSelected ? "text-yellow-200" : isOccupied ? "text-amber-700" : "text-gray-400"}`}>
                        #{t.table_number}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 sm:space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!selectedTable || !nameInput.trim()}
              className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-red-600/20 border border-yellow-400/50 cursor-pointer"
            >
              Simpan &amp; Pesan ➔
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

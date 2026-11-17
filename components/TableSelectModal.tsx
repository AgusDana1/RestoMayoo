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
        if (current && current.status !== "occupied") {
          setSelectedTable(current);
        } else {
          setSelectedTable(null);
        }
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
    setCustomerInfo(nameInput.trim() || "Guest", selectedTable.table_code, selectedTable.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#30251F]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FFF9F0] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border border-[#EADBCA] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-[#30251F]/20 rounded-full mx-auto my-2.5 sm:hidden shrink-0"></div>

        {/* Header */}
        <div className="bg-[#D94B35] p-4 sm:p-6 text-[#FFF9F0] text-center relative border-b-2 border-[#F2C14E] shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs sm:text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F2C14E] text-[#30251F] mb-1.5 sm:mb-2 shadow-2xs">
            <span>🍽️</span>
            <span>Dine-In Table Confirmation</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black font-heading text-white">
            Choose Your Dining Table
          </h2>
          <p className="text-[11px] sm:text-xs text-[#FFF9F0]/90 mt-1 max-w-sm mx-auto">
            Dishes are served hot directly to this table as soon as the chef finishes preparation.
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 pb-[max(16px,env(safe-area-inset-bottom))]">
          {/* Guest Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#30251F] mb-1.5">
              Guest Name <span className="text-[#D94B35]">*</span>
            </label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="E.g. Sarah"
              className="w-full px-4 py-3 rounded-xl sm:rounded-2xl border border-[#EADBCA] bg-white text-xs sm:text-sm font-semibold text-[#30251F] focus:outline-none focus:border-[#D94B35] focus:ring-1 focus:ring-[#D94B35]"
            />
          </div>

          {/* Table Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#30251F]">
                Select Table <span className="text-[#D94B35]">*</span>
              </label>
              <div className="flex items-center space-x-2 text-[10px] font-bold">
                <span className="flex items-center space-x-1 text-[#829477] bg-[#F2F5F0] px-2 py-0.5 rounded-full border border-[#829477]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#829477]"></span>
                  <span>Available</span>
                </span>
                <span className="flex items-center space-x-1 text-[#8E7A6F] bg-white px-2 py-0.5 rounded-full border border-[#EADBCA]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8E7A6F]"></span>
                  <span>Occupied</span>
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[#8E7A6F] font-medium">Checking live table availability...</div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-52 overflow-y-auto p-1">
                {tables.map((t) => {
                  const isSelected = selectedTable?.id === t.id;
                  const isOccupied = t.status === "occupied";
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => !isOccupied && setSelectedTable(t)}
                      title={isOccupied ? `Table ${t.table_code} is occupied` : `Choose Table ${t.table_code}`}
                      className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all min-h-[48px] ${
                        isOccupied
                          ? "bg-white/40 border-[#EADBCA] text-[#8E7A6F]/60 cursor-not-allowed opacity-50 select-none"
                          : isSelected
                          ? "bg-[#D94B35] text-white border-[#D94B35] shadow-md scale-102 cursor-pointer font-bold"
                          : "bg-white border-[#EADBCA] text-[#30251F] hover:border-[#D94B35] hover:bg-[#FEF8E9] cursor-pointer active:scale-95"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-black font-heading">{t.table_code}</span>
                      <span
                        className={`text-[8px] sm:text-[9px] mt-0.5 font-bold ${
                          isOccupied
                            ? "text-[#D94B35]"
                            : isSelected
                            ? "text-[#F2C14E]"
                            : "text-[#8E7A6F]"
                        }`}
                      >
                        {isOccupied ? "Terisi" : `#${t.table_number}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 sm:space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-3 rounded-xl sm:rounded-2xl border border-[#EADBCA] text-[#5F4E44] font-bold text-xs hover:bg-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTable || !nameInput.trim()}
              className="flex-1 py-3 px-3 rounded-xl sm:rounded-2xl bg-[#D94B35] hover:bg-[#B73824] disabled:opacity-40 text-white font-bold text-xs font-heading shadow-md transition-all active:scale-98 cursor-pointer min-h-[44px]"
            >
              Confirm Table &rarr;
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

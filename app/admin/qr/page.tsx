"use client";

import React, { useState, useEffect } from "react";
import RestoMayoLogo from "../../../components/RestoMayoLogo";

interface Table {
  id: number;
  table_code: string;
  table_number: number;
  status: string;
}

export default function AdminQRPage() {
  const [baseUrl, setBaseUrl] = useState<string>("http://localhost:3000");
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"tables" | "general">("tables");
  const [copiedLink, setCopiedLink] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }

    const fetchTables = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/tables");
        if (res.ok) {
          const data = await res.json();
          setTables(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, "");

  const getTableQrUrl = (tableCode: string) => {
    const targetLink = `${cleanBaseUrl}/?table=${encodeURIComponent(tableCode)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(targetLink)}`;
  };

  const getGeneralQrUrl = () => {
    const targetLink = `${cleanBaseUrl}/`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(targetLink)}`;
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(identifier);
    setTimeout(() => setCopiedLink(""), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header (Hidden when printing) */}
      <div className="no-print bg-white rounded-3xl p-6 sm:p-8 border border-resto-yellow-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-resto-yellow-100">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 mb-2">
              <span>📱</span>
              <span>Table &amp; Menu QR Code Generator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-poppins">
              Print Resto Mayo QR Codes
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Generate and print table standee QR stickers for customer dining tables or cashier banners.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer border border-resto-yellow-400/40"
            >
              <span>🖨️</span>
              <span>Print QR Cards</span>
            </button>
          </div>
        </div>

        {/* Server URL Input & Guide */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 font-poppins">
            Website Server Address / Base URL (QR Code Target URL)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://192.168.1.XX:3000 or https://restomayo.com"
              className="flex-1 px-4 py-2.5 rounded-2xl border border-resto-yellow-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-resto-red-500 font-mono bg-stone-50 text-stone-800"
            />
            <button
              onClick={() => {
                if (typeof window !== "undefined") setBaseUrl(window.location.origin);
              }}
              className="px-3.5 py-2.5 rounded-2xl border border-resto-yellow-200 text-stone-700 hover:bg-resto-yellow-50 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Reset to Current URL
            </button>
          </div>

          {/* Quick Notice Tip */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-[11px] sm:text-xs text-amber-900 space-y-1 leading-relaxed">
            <div className="font-bold flex items-center space-x-1.5 text-amber-950">
              <span>💡</span>
              <span>Mobile Device Testing Guide (Camera / QR Scanner):</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1">
              <li>
                <strong>When testing on the same local Wi-Fi:</strong> Do not use <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">localhost</code>; replace it with your computer&apos;s local IP (e.g. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">http://192.168.1.15:3000</code>).
              </li>
              <li>
                <strong>When using a tunnel (Ngrok / Cloudflared):</strong> Enter your public tunnel URL (e.g. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">https://resto-mayo.ngrok-free.app</code>).
              </li>
              <li>
                <strong>When deployed online / hosted (Railway / Vercel / Custom Domain):</strong> Enter your live production domain (e.g. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">https://restomayo.com</code>).
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => setActiveTab("tables")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tables"
                ? "bg-gradient-to-r from-resto-red-600 to-resto-red-700 text-white shadow-xs"
                : "bg-resto-yellow-50 text-stone-700 hover:bg-resto-yellow-100 border border-resto-yellow-200"
            }`}
          >
            🪑 Table Standee QRs ({tables.length} Tables)
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-gradient-to-r from-resto-red-600 to-resto-red-700 text-white shadow-xs"
                : "bg-resto-yellow-50 text-stone-700 hover:bg-resto-yellow-100 border border-resto-yellow-200"
            }`}
          >
            📋 Main Menu QR (Cashier / Banner)
          </button>
        </div>
      </div>

      {/* Tables Standee QR Cards Grid */}
      {activeTab === "tables" && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between text-xs text-stone-500 px-1">
            <span>Displaying {tables.length} Table QR Cards (Ready to print for table standees)</span>
            <span className="text-resto-red-700 font-bold">Format: {cleanBaseUrl}/?table=MXX</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading table data...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-8">
              {tables.map((t) => {
                const targetLink = `${cleanBaseUrl}/?table=${encodeURIComponent(t.table_code)}`;
                const qrImgSrc = getTableQrUrl(t.table_code);
                const isCopied = copiedLink === t.table_code;

                return (
                  <div
                    key={t.id}
                    className="print-card bg-white rounded-3xl border-2 border-resto-yellow-300 shadow-md p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden transition-all hover:border-resto-red-500"
                  >
                    {/* Top Accent Ribbon */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-resto-red-600 via-resto-yellow-400 to-resto-red-700"></div>

                    {/* Logo & Header */}
                    <div className="pt-2 flex items-center space-x-2">
                      <RestoMayoLogo size="sm" />
                      <span className="text-base font-black text-resto-red-700 font-poppins">
                        Resto<span className="text-resto-yellow-500">Mayo</span>
                      </span>
                    </div>

                    {/* Table Number Badge */}
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 rounded-full bg-resto-red-700 text-resto-yellow-300 font-black text-xs uppercase tracking-wider shadow-xs">
                        TABLE {t.table_code}
                      </span>
                      <h3 className="text-xl font-black text-stone-900 font-poppins">
                        Dining Table #{t.table_number}
                      </h3>
                      <p className="text-[10px] text-stone-500 font-medium">
                        Scan to view menu &amp; place your order
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-3 bg-white rounded-2xl border-2 border-resto-yellow-200 shadow-inner">
                      <img
                        src={qrImgSrc}
                        alt={`QR Code Table ${t.table_code}`}
                        className="w-44 h-44 mx-auto rounded-lg"
                      />
                    </div>

                    {/* Scan Callout */}
                    <div className="px-3 py-1.5 rounded-xl bg-resto-yellow-50 border border-resto-yellow-200 text-[10px] text-resto-yellow-950 font-bold w-full">
                      📲 Point your smartphone camera to this QR Code
                    </div>

                    {/* Action buttons (hidden when printing) */}
                    <div className="no-print pt-2 flex items-center space-x-2 w-full">
                      <button
                        onClick={() => copyToClipboard(targetLink, t.table_code)}
                        className="flex-1 py-1.5 px-2 rounded-xl border border-resto-yellow-300 hover:bg-resto-yellow-50 text-[10px] font-bold text-stone-700 transition-colors cursor-pointer"
                      >
                        {isCopied ? "✓ Link Copied" : "Copy Link"}
                      </button>
                      <a
                        href={qrImgSrc}
                        download={`QR-Table-${t.table_code}-RestoMayo.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-xl bg-resto-yellow-100 hover:bg-resto-yellow-200 text-[10px] font-bold text-resto-yellow-950 text-center transition-colors border border-resto-yellow-300 cursor-pointer"
                      >
                        Download QR
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* General Menu QR */}
      {activeTab === "general" && (
        <div className="max-w-xl mx-auto">
          <div className="print-card bg-white rounded-3xl border-2 border-resto-yellow-300 shadow-lg p-8 flex flex-col items-center text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-resto-red-600 via-resto-yellow-400 to-resto-red-700"></div>

            <div className="pt-2 flex items-center space-x-2.5">
              <RestoMayoLogo size="md" />
              <span className="text-2xl font-black text-resto-red-700 font-poppins">
                Resto<span className="text-resto-yellow-500">Mayo</span>
              </span>
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3.5 py-1 rounded-full bg-resto-red-700 text-resto-yellow-300 font-black text-xs uppercase tracking-wider shadow-xs">
                DIGITAL MENU
              </span>
              <h2 className="text-2xl font-black text-stone-900 font-poppins">
                Scan for Full Culinary Menu
              </h2>
              <p className="text-xs text-stone-500 max-w-sm">
                Browse our complete catalog of food dishes, warm dimsum, and fresh beverages straight from your smartphone.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-resto-yellow-200 shadow-inner">
              <img
                src={getGeneralQrUrl()}
                alt="Resto Mayo Main Menu QR Code"
                className="w-56 h-56 mx-auto rounded-xl"
              />
            </div>

            <div className="px-4 py-2 rounded-2xl bg-resto-yellow-50 border border-resto-yellow-200 text-xs text-resto-yellow-950 font-bold w-full">
              📲 Open phone camera &amp; scan to view menu
            </div>

            <div className="no-print pt-2 flex items-center space-x-3 w-full">
              <button
                onClick={() => copyToClipboard(`${cleanBaseUrl}/`, "general")}
                className="flex-1 py-2 px-3 rounded-xl border border-resto-yellow-300 hover:bg-resto-yellow-50 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
              >
                {copiedLink === "general" ? "✓ Link Copied" : "Copy Link"}
              </button>
              <a
                href={getGeneralQrUrl()}
                download="QR-Main-Menu-RestoMayo.png"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-resto-yellow-100 hover:bg-resto-yellow-200 text-xs font-bold text-resto-yellow-950 text-center transition-colors border border-resto-yellow-300 cursor-pointer"
              >
                Download QR Image
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          header,
          nav,
          .no-print {
            display: none !important;
          }
          .print-card {
            page-break-inside: avoid;
            box-shadow: none !important;
            border: 2px solid #eab308 !important;
            margin-bottom: 2rem;
          }
        }
      `}</style>

    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingKitchen: number;
  readyOrders: number;
  tableStats: {
    total: number;
    occupied: number;
    available: number;
  };
  recentOrders: {
    id: number;
    order_number: string;
    customer_name: string;
    total_amount: number | string;
    status: string;
    created_at: string;
    table: {
      table_code: string;
      table_number: number;
    };
    payment?: {
      method: string;
      status: string;
    } | null;
  }[];
}

interface ReviewItem {
  id: number;
  order_id: number;
  customer_name: string;
  rating: number;
  comment?: string | null;
  category?: string | null;
  sentiment?: string | null;
  is_critical?: boolean;
  critical_reason?: string | null;
  ai_summary?: string | null;
  created_at: string;
  order?: {
    order_number: string;
    status: string;
    table?: {
      table_code: string;
    };
    order_items?: {
      product: { name: string };
      quantity: number;
    }[];
  };
}

interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  criticalCount: number;
  categoryBreakdown: Record<string, number>;
}

interface ExecutiveDigest {
  executiveSummary: string;
  topPraises: string[];
  topConcerns: string[];
  actionableSteps: string[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Reviews & AI Sentiment States
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [digest, setDigest] = useState<ExecutiveDigest | null>(null);
  const [generatingDigest, setGeneratingDigest] = useState<boolean>(false);
  const [filterCriticalOnly, setFilterCriticalOnly] = useState<boolean>(false);

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviews = React.useCallback(async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setReviewStats(data.stats || null);
      }
    } catch (e) {
      console.error("Error fetching reviews:", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchReviews();
    const interval = setInterval(() => {
      fetchStats();
      fetchReviews();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchReviews]);

  const handleGenerateDigest = async () => {
    if (reviews.length === 0) return;
    setGeneratingDigest(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review-summary",
          reviews,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDigest(data);
      }
    } catch (e) {
      console.error("Error generating AI digest:", e);
    } finally {
      setGeneratingDigest(false);
    }
  };

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-resto-red-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 font-medium">Loading dashboard summary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-resto-yellow-200/80 pb-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 shadow-2xs">
            <span>📊</span>
            <span>Restaurant &amp; Kitchen Overview</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 mt-2 font-poppins">
            Resto <span className="text-resto-red-700">Mayo</span> Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Monitor transaction flow, dining table occupancy, and live kitchen operations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/kitchen"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 text-white font-bold text-xs shadow-md shadow-resto-red-600/20 transition-all cursor-pointer active:scale-95"
          >
            <span>🍳</span>
            <span>Open Kitchen Display (KDS) &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Critical Complaint Alert Banner */}
      {reviewStats && reviewStats.criticalCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border-2 border-rose-300 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-xl shadow-xs animate-bounce">
                🚨
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-rose-900 font-poppins flex items-center gap-2">
                  <span>Critical Customer Complaint Alert!</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-200 text-rose-900">
                    {reviewStats.criticalCount} {reviewStats.criticalCount === 1 ? "Issue" : "Issues"}
                  </span>
                </h3>
                <p className="text-xs text-rose-700">
                  AI detected urgent complaints requiring immediate restaurant manager attention (cold food, hygiene, or excessive delays).
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              {filterCriticalOnly ? "Show All Reviews" : "Filter Critical Alerts"}
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        
        {/* Metric 1: Omset */}
        <div className="p-5 bg-white rounded-3xl border border-resto-yellow-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Paid Revenue</span>
            <span className="p-2 rounded-xl bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-200 text-sm">💰</span>
          </div>
          <div className="text-2xl font-black text-resto-red-700 font-poppins">
            {formatRupiah(stats?.totalRevenue || 0)}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
            <span>●</span>
            <span>Revenue from completed &amp; paid orders</span>
          </span>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="p-5 bg-white rounded-3xl border border-resto-yellow-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <span className="p-2 rounded-xl bg-resto-red-50 text-resto-red-700 border border-resto-red-200 text-sm">📋</span>
          </div>
          <div className="text-2xl font-black text-stone-900 font-poppins">
            {stats?.totalOrders || 0}
          </div>
          <span className="text-[11px] text-stone-400 font-medium">
            All recorded order tickets
          </span>
        </div>

        {/* Metric 3: Active Kitchen Tickets */}
        <div className="p-5 bg-white rounded-3xl border border-resto-yellow-300 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Kitchen Queue</span>
            <span className="p-2 rounded-xl bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 text-sm">🍳</span>
          </div>
          <div className="text-2xl font-black text-resto-yellow-700 font-poppins">
            {stats?.pendingKitchen || 0}
          </div>
          <span className="text-[11px] text-resto-yellow-800 font-semibold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-resto-yellow-500 animate-ping"></span>
            <span>Requires chef preparation</span>
          </span>
        </div>

        {/* Metric 4: Table Occupancy */}
        <div className="p-5 bg-white rounded-3xl border border-resto-yellow-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Table Occupancy</span>
            <span className="p-2 rounded-xl bg-resto-red-50 text-resto-red-700 border border-resto-red-200 text-sm">🪑</span>
          </div>
          <div className="text-2xl font-black text-resto-red-700 font-poppins">
            {stats?.tableStats.occupied || 0} / {stats?.tableStats.total || 10}
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            {stats?.tableStats.available || 0} dining tables ready to seat
          </span>
        </div>

        {/* Metric 5: Customer Rating & AI Sentiment */}
        <div className="p-5 bg-white rounded-3xl border border-resto-yellow-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Rating</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-sm">⭐</span>
          </div>
          <div className="text-2xl font-black text-stone-900 font-poppins flex items-baseline space-x-1.5">
            <span>{reviewStats?.avgRating ? reviewStats.avgRating.toFixed(1) : "5.0"}</span>
            <span className="text-xs text-stone-400 font-normal">/ 5.0</span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            {reviewStats?.totalReviews || 0} reviews analyzed by AI
          </span>
        </div>

      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/kitchen"
          className="p-6 bg-gradient-to-br from-resto-red-700 via-resto-red-800 to-resto-red-900 text-white rounded-3xl shadow-lg border border-resto-yellow-400/40 hover:scale-[1.01] transition-transform group"
        >
          <div className="text-3xl mb-3">🍳</div>
          <h2 className="text-lg font-bold font-poppins group-hover:text-resto-yellow-300 transition-colors">
            Kitchen Display System (KDS)
          </h2>
          <p className="text-xs text-resto-yellow-100/90 mt-1 leading-relaxed">
            Real-time display for kitchen staff to process cooking orders in FIFO (First-In, First-Out) order.
          </p>
          <span className="inline-block mt-4 text-xs font-bold text-resto-yellow-300">
            Open Kitchen Screen &rarr;
          </span>
        </Link>

        <Link
          href="/admin/orders"
          className="p-6 bg-white rounded-3xl border border-resto-yellow-200 shadow-xs hover:border-resto-red-300 hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">📋</div>
          <h2 className="text-lg font-bold text-stone-900 font-poppins group-hover:text-resto-red-700 transition-colors">
            Manage All Orders
          </h2>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Review order breakdowns, update transaction statuses, check transfer receipts, and filter customer orders.
          </p>
          <span className="inline-block mt-4 text-xs font-bold text-resto-red-700">
            View Orders List &rarr;
          </span>
        </Link>

        <Link
          href="/admin/products"
          className="p-6 bg-white rounded-3xl border border-resto-yellow-200 shadow-xs hover:border-resto-red-300 hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">🍔</div>
          <h2 className="text-lg font-bold text-stone-900 font-poppins group-hover:text-resto-red-700 transition-colors">
            Manage Menu &amp; Categories
          </h2>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Set menu availability (In Stock / Sold Out), adjust dish prices, or add new dishes to Resto Mayo.
          </p>
          <span className="inline-block mt-4 text-xs font-bold text-resto-red-700">
            Manage Menu &rarr;
          </span>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-resto-yellow-200 shadow-xs overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-resto-yellow-100">
          <div>
            <h2 className="text-base font-bold text-stone-900 font-poppins">
              Recent Order Activity
            </h2>
            <p className="text-xs text-stone-400">
              Latest transactions placed from Resto Mayo dining tables.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-resto-red-700 hover:underline"
          >
            View All Orders &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-resto-yellow-50/60 text-stone-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Order #</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-resto-yellow-100">
              {stats?.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-resto-yellow-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-resto-red-700">
                    #{order.order_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 text-[11px]">
                      {order.table?.table_code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-stone-800">
                    {order.customer_name}
                  </td>
                  <td className="py-3.5 px-4 font-black text-stone-900">
                    {formatRupiah(order.total_amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      order.payment?.status === "paid"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300"
                    }`}>
                      {order.payment?.status === "paid" ? "Paid" : "Unpaid"} ({order.payment?.method})
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      order.status === "completed"
                        ? "bg-stone-100 text-stone-800"
                        : order.status === "ready"
                        ? "bg-emerald-100 text-emerald-900"
                        : order.status === "processing"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-resto-yellow-100 text-resto-yellow-900"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/payment/${order.order_number}`}
                      target="_blank"
                      className="px-2.5 py-1 rounded-lg bg-resto-yellow-100 hover:bg-resto-yellow-200 border border-resto-yellow-300 text-resto-yellow-950 font-bold text-[11px] transition-colors"
                    >
                      View Ticket
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Feedback & AI Sentiment Intelligence Section */}
      <div className="bg-white rounded-3xl border border-resto-yellow-200 shadow-xs overflow-hidden p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-resto-yellow-100">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>✨</span>
              <span>Gemini Quality Intelligence</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 font-poppins">
              Customer Feedback &amp; AI Sentiment Center
            </h2>
            <p className="text-xs text-stone-400">
              Real-time classification of taste, service speed, hygiene, and critical complaints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                filterCriticalOnly
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-resto-yellow-100 text-stone-700 hover:bg-resto-yellow-200 border border-resto-yellow-300"
              }`}
            >
              <span>🚨</span>
              <span>Critical Only ({reviewStats?.criticalCount || 0})</span>
            </button>

            <button
              onClick={handleGenerateDigest}
              disabled={generatingDigest || reviews.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-resto-red-600 via-resto-red-700 to-resto-yellow-600 hover:from-resto-red-700 hover:to-resto-yellow-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              {generatingDigest ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing All Reviews...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Generate AI Manager Insights</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Executive Digest Panel */}
        {digest && (
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-resto-yellow-50/80 via-white to-resto-red-50/40 border border-resto-yellow-300 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-xl bg-resto-red-600 text-white flex items-center justify-center text-sm shadow-2xs">
                  📊
                </span>
                <h3 className="text-sm font-bold text-stone-900 font-poppins">
                  Executive Sentiment Pulse &amp; Operational Synthesis
                </h3>
              </div>
              <button
                onClick={() => setDigest(null)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium bg-white/90 p-4 rounded-xl border border-resto-yellow-200">
              {digest.executiveSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Top Praises */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center space-x-1">
                  <span>👍</span>
                  <span>Top Customer Praises</span>
                </h4>
                <ul className="text-xs text-emerald-800 space-y-1.5 list-disc pl-4">
                  {digest.topPraises.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>

              {/* Top Bottlenecks / Concerns */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                <h4 className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>Operational Bottlenecks</span>
                </h4>
                <ul className="text-xs text-amber-800 space-y-1.5 list-disc pl-4">
                  {digest.topConcerns.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Actionable Steps */}
              <div className="p-4 rounded-xl bg-resto-red-50/80 border border-resto-red-200 space-y-2">
                <h4 className="text-xs font-bold text-resto-red-900 flex items-center space-x-1">
                  <span>🎯</span>
                  <span>3 Actionable Manager Steps</span>
                </h4>
                <ul className="text-xs text-resto-red-800 space-y-1.5 list-disc pl-4">
                  {digest.actionableSteps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown Tags */}
        {reviewStats && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px]">
              Categories Analyzed:
            </span>
            {Object.entries(reviewStats.categoryBreakdown).map(([cat, count]) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-[11px]"
              >
                {cat}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <span className="text-3xl block">💬</span>
            <p className="text-xs font-medium">
              No customer reviews recorded yet. Completed orders can submit ratings on the payment/bill screen.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews
              .filter((r) => (!filterCriticalOnly ? true : r.is_critical))
              .map((r) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    r.is_critical
                      ? "bg-rose-50/50 border-rose-300 shadow-xs"
                      : "bg-white hover:bg-resto-yellow-50/20 border-resto-yellow-200/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">
                        {r.customer_name}
                      </span>
                      {r.order?.table?.table_code && (
                        <span className="px-2 py-0.5 rounded-md bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 font-bold text-[10px]">
                          {r.order.table.table_code}
                        </span>
                      )}
                      {r.order?.order_number && (
                        <span className="text-[10px] font-mono text-stone-400">
                          #{r.order.order_number}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-amber-400 text-xs">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= r.rating ? "text-amber-400" : "text-stone-200"}
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      {r.category && (
                        <span className="px-2 py-0.5 rounded-full bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 text-[10px] font-bold">
                          {r.category}
                        </span>
                      )}

                      {r.sentiment && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            r.sentiment === "positive"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.sentiment === "negative"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {r.sentiment}
                        </span>
                      )}
                    </div>
                  </div>

                  {r.comment && (
                    <p className="text-xs text-stone-700 italic mt-1 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}

                  {r.is_critical && r.critical_reason && (
                    <div className="mt-2 p-2 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-[11px] font-bold flex items-center space-x-1.5">
                      <span>⚠️ Critical Complaint Flag:</span>
                      <span>{r.critical_reason}</span>
                    </div>
                  )}

                  {r.ai_summary && (
                    <p className="text-[10px] text-stone-500 mt-2 flex items-center space-x-1">
                      <strong className="text-stone-700">AI Summary:</strong>
                      <span>{r.ai_summary}</span>
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

    </div>
  );
}

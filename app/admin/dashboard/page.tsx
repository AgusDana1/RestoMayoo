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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, [fetchStats]);

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

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
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

    </div>
  );
}

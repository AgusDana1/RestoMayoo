"use client";

import React, { useState, useEffect } from "react";

interface KitchenOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number | string;
  status: string;
  ordered_at: string;
  table: {
    id: number;
    table_code: string;
    table_number: number;
  };
  order_items: {
    id: number;
    quantity: number;
    notes?: string | null;
    product: {
      name: string;
    };
  }[];
  payment?: {
    method: string;
    status: string;
  } | null;
}

function getTimeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchKitchenOrders = React.useCallback(async () => {
    try {
      const res = await fetch("/api/orders?kitchen=true");
      if (res.ok) {
        const data = await res.json();
        // Sort FIFO: oldest order first
        data.sort(
          (a: KitchenOrder, b: KitchenOrder) =>
            new Date(a.ordered_at).getTime() - new Date(b.ordered_at).getTime()
        );
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      fetchKitchenOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchKitchenOrders]);

  const updateOrderStatus = async (orderNumber: string, nextStatus: string) => {
    try {
      setUpdatingId(orderNumber);
      const res = await fetch(`/api/orders/${orderNumber}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchKitchenOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const processingOrders = orders.filter((o) => o.status === "processing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "all") return true;
    return o.status === filterStatus;
  });



  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-resto-yellow-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-resto-red-50 text-resto-red-700 border border-resto-red-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-resto-red-600 animate-ping mr-1.5"></span>
              Live Kitchen Display System (KDS)
            </span>
            <span className="text-xs text-stone-300">•</span>
            <span className="text-xs text-stone-500 font-medium">FIFO Queue (First-In, First-Out)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 mt-2 font-poppins">
            Kitchen Queue &amp; <span className="text-resto-red-700">Order Preparation</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Monitor dish tickets from dining tables and update cooking statuses in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchKitchenOrders()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-resto-yellow-50 text-stone-700 font-bold text-xs border border-resto-yellow-200 transition-colors shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-resto-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Status Counters / Filter Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* All Active */}
        <button
          onClick={() => setFilterStatus("all")}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "all"
              ? "bg-resto-red-50/70 border-resto-red-300 shadow-sm"
              : "bg-white border-resto-yellow-200/80 hover:border-resto-yellow-300"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
            Total Kitchen Tickets
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-stone-900 font-poppins">
              {orders.length}
            </span>
            <span className="text-xs text-stone-400 font-medium">Active Tickets</span>
          </div>
        </button>

        {/* Pending */}
        <button
          onClick={() => setFilterStatus("pending")}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "pending"
              ? "bg-resto-yellow-100 border-resto-yellow-400 shadow-sm"
              : "bg-white border-resto-yellow-200/80 hover:border-resto-yellow-300"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-resto-yellow-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-resto-yellow-900">
              Awaiting Cooking
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-resto-yellow-700 font-poppins">
              {pendingOrders.length}
            </span>
            <span className="text-xs text-stone-400 font-medium">New Tickets</span>
          </div>
        </button>

        {/* Processing */}
        <button
          onClick={() => setFilterStatus("processing")}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "processing"
              ? "bg-amber-50 border-amber-300 shadow-sm"
              : "bg-white border-resto-yellow-200/80 hover:border-resto-yellow-300"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Currently Cooking
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700 font-poppins">
              {processingOrders.length}
            </span>
            <span className="text-xs text-stone-400 font-medium">In Preparation</span>
          </div>
        </button>

        {/* Ready */}
        <button
          onClick={() => setFilterStatus("ready")}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "ready"
              ? "bg-emerald-50 border-emerald-300 shadow-sm"
              : "bg-white border-resto-yellow-200/80 hover:border-resto-yellow-300"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Ready to Serve
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-800 font-poppins">
              {readyOrders.length}
            </span>
            <span className="text-xs text-stone-400 font-medium">Ready for Waiter</span>
          </div>
        </button>

      </div>

      {/* Grid of Kitchen Tickets */}
      {loading ? (
        <div className="py-20 text-center text-xs text-stone-500">Loading kitchen tickets...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-resto-yellow-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 flex items-center justify-center text-2xl">
            🍳
          </div>
          <h2 className="text-lg font-bold text-stone-900 font-poppins">
            Kitchen is All Clear
          </h2>
          <p className="text-xs text-stone-400">
            No order tickets with this status. New orders will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const isUpdating = updatingId === order.order_number;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border shadow-sm flex flex-col justify-between overflow-hidden transition-all ${
                  order.status === "pending"
                    ? "border-resto-yellow-300 ring-2 ring-resto-yellow-200"
                    : order.status === "processing"
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : "border-emerald-300 ring-2 ring-emerald-100"
                }`}
              >
                {/* Ticket Top Banner */}
                <div className={`p-4.5 flex items-center justify-between ${
                  order.status === "pending"
                    ? "bg-gradient-to-r from-resto-yellow-400 to-resto-yellow-500 text-stone-950"
                    : order.status === "processing"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                    : "bg-gradient-to-r from-emerald-600 to-teal-700 text-white"
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block font-mono">
                      #{order.order_number}
                    </span>
                    <span className="text-lg font-black font-poppins">
                      Table {order.table?.table_code}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold block">{getTimeAgo(order.ordered_at)}</span>
                    <span className="text-[10px] opacity-90 font-medium">{order.customer_name}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-5 flex-1 space-y-3 divide-y divide-resto-yellow-100">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-900 font-poppins">
                          {item.product.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg font-mono font-black text-xs bg-resto-yellow-100 text-resto-yellow-950 border border-resto-yellow-200">
                          x{item.quantity}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="p-2.5 rounded-xl bg-resto-yellow-50 border border-resto-yellow-200 text-[11px] text-resto-yellow-950 font-medium flex items-center space-x-1.5">
                          <span>⚠️</span>
                          <span>Chef Note: &ldquo;{item.notes}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 bg-resto-yellow-50/40 border-t border-resto-yellow-100 flex items-center space-x-2">
                  {order.status === "pending" && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateOrderStatus(order.order_number, "processing")}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>🍳 Start Cooking Order</span>
                    </button>
                  )}

                  {order.status === "processing" && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateOrderStatus(order.order_number, "ready")}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>🔔 Mark as Ready to Serve</span>
                    </button>
                  )}

                  {order.status === "ready" && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateOrderStatus(order.order_number, "completed")}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>🍽️ Mark as Served / Completed</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

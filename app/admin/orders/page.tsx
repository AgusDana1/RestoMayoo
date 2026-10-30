"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Order {
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
    price: number | string;
    total: number | string;
    notes?: string | null;
    product: {
      name: string;
    };
  }[];
  payment?: {
    id: number;
    method: string;
    status: string;
    amount: number | string;
    paid_at?: string | null;
  } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderNumber: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrders();
        if (selectedOrder?.order_number === orderNumber) {
          const updated = await res.json();
          setSelectedOrder(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatRupiah = (amount: number | string) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch =
      !search.trim() ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.table?.table_code.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-resto-yellow-200/80 pb-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-resto-yellow-100 text-resto-yellow-900 border border-resto-yellow-300 shadow-2xs mb-2">
            <span>📋</span>
            <span>Customer Order History</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-poppins">
            Resto Mayo <span className="text-resto-red-700">Orders Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            View transactions, manage kitchen cooking statuses, and review order breakdowns.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 rounded-2xl bg-white border border-resto-yellow-200 text-xs font-bold hover:bg-resto-yellow-50 text-stone-700 shadow-2xs transition-colors cursor-pointer"
          >
            ↻ Refresh Data
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-resto-yellow-200 shadow-xs">
        
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "processing", label: "Cooking" },
            { id: "ready", label: "Ready" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === tab.id
                  ? "bg-gradient-to-r from-resto-red-600 to-resto-red-700 text-white shadow-xs"
                  : "bg-resto-yellow-50/80 text-stone-600 hover:bg-resto-yellow-100 border border-resto-yellow-200/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order # or name..."
            className="w-full px-3.5 py-2 rounded-xl border border-resto-yellow-200 text-xs focus:outline-none focus:ring-2 focus:ring-resto-red-500 bg-white"
          />
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-resto-yellow-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400">No orders matching this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-resto-yellow-50/60 text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-resto-yellow-100">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Table</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Ordered Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-resto-yellow-100">
                {filteredOrders.map((order) => (
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
                    <td className="py-3.5 px-4 max-w-xs truncate text-stone-600">
                      {order.order_items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")}
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
                        {order.payment?.status === "paid" ? "Paid" : "Pending"} ({order.payment?.method})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.order_number, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-resto-yellow-200 text-xs font-semibold bg-white text-stone-800 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Cooking</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-resto-yellow-100 hover:bg-resto-yellow-200 text-resto-yellow-950 font-bold text-[11px] border border-resto-yellow-300 transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-resto-yellow-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-resto-yellow-100">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold">Order Ticket Details</span>
                <h3 className="text-xl font-black text-resto-red-700 font-poppins">
                  #{selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-resto-yellow-50/50 rounded-2xl border border-resto-yellow-200">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">Customer</span>
                <span className="font-bold text-stone-800">{selectedOrder.customer_name}</span>
              </div>
              <div className="p-3 bg-resto-yellow-50/50 rounded-2xl border border-resto-yellow-200">
                <span className="text-stone-400 block text-[10px] font-bold uppercase">Dining Table</span>
                <span className="font-bold text-resto-red-700">Table {selectedOrder.table?.table_code}</span>
              </div>
            </div>

            {/* Item list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-stone-600">Ordered Items</h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-resto-yellow-100">
                {selectedOrder.order_items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-800">{item.product.name}</span>
                      <span className="text-stone-400 ml-1.5 font-mono">x{item.quantity}</span>
                      {item.notes && (
                        <p className="text-[11px] text-resto-red-700 italic">
                          Note: &ldquo;{item.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="font-extrabold text-resto-red-700">{formatRupiah(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-resto-yellow-100 flex items-baseline justify-between">
              <span className="text-xs font-bold text-stone-600">Total Transaction</span>
              <span className="text-xl font-black text-resto-red-700 font-poppins">
                {formatRupiah(selectedOrder.total_amount)}
              </span>
            </div>

            <div className="flex space-x-2 pt-2">
              <Link
                href={`/payment/${selectedOrder.order_number}`}
                target="_blank"
                className="flex-1 py-2.5 rounded-2xl border border-resto-yellow-200 text-stone-700 font-bold text-xs text-center hover:bg-resto-yellow-50"
              >
                View Payment Page
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-resto-red-600 to-resto-red-700 hover:from-resto-red-700 hover:to-resto-red-800 text-white font-bold text-xs cursor-pointer shadow-md shadow-resto-red-600/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RestoMayoLogo from "../../../components/RestoMayoLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("admin234@restomayo.com");
  const [password, setPassword] = useState<string>("password");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#2D0508] via-[#4A0A0F] to-[#1A0204] p-4 text-white">
      
      {/* Container */}
      <div className="w-full max-w-md bg-white text-gray-900 rounded-3xl p-8 shadow-2xl border border-resto-gold-500/30 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-resto-red-900 via-resto-red-700 to-resto-gold-700"></div>

        {/* Brand */}
        <div className="text-center space-y-2 pt-2">
          <div className="flex justify-center">
            <RestoMayoLogo size="xl" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-resto-red-900 font-poppins">
            Resto<span className="text-resto-gold-600">Mayo</span>
          </h1>

          <p className="text-xs text-gray-400 font-medium">
            Sign in to Restaurant Management &amp; Kitchen Display
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Administrator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-resto-red-700"
              placeholder="admin234@restomayo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-resto-red-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-resto-red-800 hover:bg-resto-red-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {loading ? "Verifying..." : "Sign In to Admin Panel"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-gray-400 hover:text-resto-red-800 transition-colors">
            &larr; Return to Customer Menu
          </Link>
        </div>

      </div>

    </div>
  );
}


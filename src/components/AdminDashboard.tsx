import React, { useEffect, useState } from "react";
import { ShieldCheck, BarChart3, Activity } from "lucide-react";
import { Order, Product } from "../types";
import { api } from "../api/client";
import AdminCoupons from "./AdminCoupons";
import AdminOrders from "./AdminOrders";
import AdminProducts from "./AdminProducts";
import AdminUserManagement from "./AdminUserManagement";

interface AdminDashboardProps {
  products: Product[];
  ordersCount: number;
  currentUserId: string;
  orders: Order[];
  onRefresh: () => void | Promise<void>;
}

interface Analytics {
  totalRevenue: number;
  activeRentals: number;
  totalUsers: number;
  averageSustainability: number;
  totalProducts: number;
  perfectReturns: number;
  damagedReturns: number;
  returnRatePercentage: number;
  categoryDistribution: { name: string; value: number }[];
  rentTrends: { month: string; rentals: number; revenue: number }[];
}

export default function AdminDashboard({
  products,
  ordersCount,
  currentUserId,
  orders,
  onRefresh,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<Analytics | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = () =>
    api
      .getAnalytics()
      .then(setStats)
      .catch((err) => setStatsError(err?.message || "Could not load analytics."));

  useEffect(() => {
    loadStats();
  }, []);

  /** After a write, pull both the parent's data and the KPI aggregates —
   *  deleting a listing or moving an order changes the figures above. */
  const refreshAll = async () => {
    await onRefresh();
    await loadStats();
  };

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto text-left">
        
        {/* Title */}
        <div className="mb-10 border-b border-[#DADADA] pb-6 flex justify-between items-baseline flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
              <span>Platform Core Control</span>
              <span>✦</span>
              <span>Super Administrator Portal</span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight mt-1 flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-[#1C1C1C]" /> StyleSwap Admin Engine
            </h2>
          </div>
          <div className="bg-[#1C1C1C] text-[#D4AF37] px-4 py-2 rounded-full text-xs font-sans font-bold">
            🔒 Core System Secure
          </div>
        </div>

        {statsError && (
          <div className="mb-6 bg-white border border-red-200 rounded-2xl px-5 py-4 text-xs text-[#6B6B6B]">
            Live analytics unavailable: {statsError}
          </div>
        )}

        {/* Global KPI Counters — every figure below is queried from Postgres. */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-10 text-xs">
          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm space-y-2">
            <span className="text-[#6B6B6B] uppercase font-sans tracking-wider block">Total Members</span>
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{stats ? stats.totalUsers : "—"}</p>
            <span className="text-[#6B6B6B]">Avg. sustainability {stats ? stats.averageSustainability : "—"}</span>
          </div>

          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm space-y-2">
            <span className="text-[#6B6B6B] uppercase font-sans tracking-wider block">Active Rentals</span>
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{stats ? stats.activeRentals : "—"}</p>
            <span className="text-[#6B6B6B]">Booked, out, or rented</span>
          </div>

          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm space-y-2">
            <span className="text-[#6B6B6B] uppercase font-sans tracking-wider block">Durable Inventory</span>
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">
              {stats ? stats.totalProducts : products.length} Garments
            </p>
            <span className="text-[#D4AF37] font-semibold">Live catalog count</span>
          </div>

          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm space-y-2">
            <span className="text-[#6B6B6B] uppercase font-sans tracking-wider block">Agreement Volume</span>
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">{ordersCount} Swaps</p>
            <span className="text-[#6B6B6B]">
              {stats ? `${stats.returnRatePercentage}% returned` : "—"}
            </span>
          </div>

          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm space-y-2">
            <span className="text-[#6B6B6B] uppercase font-sans tracking-wider block">Gross Revenue</span>
            <p className="text-2xl font-serif font-bold text-[#1C1C1C]">
              ₹{stats ? stats.totalRevenue.toLocaleString() : "—"}
            </p>
            <span className="text-[#6B6B6B]">Sum of all orders</span>
          </div>
        </div>

        {/* Splits: Charts & settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Visual Growth Chart */}
          <div className="lg:col-span-8 bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-baseline border-b border-[#DADADA] pb-3">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#D4AF37]" /> Rental Growth & Swap Transactions
              </h3>
              <span className="text-[10px] text-[#6B6B6B]">Monthly Aggregate</span>
            </div>

            {/* Bars are grouped by month from orders.orders. An empty month
                range means no orders yet, which is worth showing plainly
                rather than filling with invented growth. */}
            <div className="relative w-full h-64 bg-[#FAF9F6] rounded-2xl flex items-end justify-between gap-2 p-6 pt-10 border border-[#DADADA]/30">
              {!stats && (
                <div className="w-full text-center text-[10px] text-[#6B6B6B] self-center">Loading…</div>
              )}
              {stats?.rentTrends.length === 0 && (
                <div className="w-full text-center text-[10px] text-[#6B6B6B] self-center">
                  No orders yet — place one and it appears here.
                </div>
              )}
              {stats?.rentTrends.map((t, i) => {
                const peak = Math.max(...stats.rentTrends.map((x) => x.rentals), 1);
                const isLatest = i === stats.rentTrends.length - 1;
                return (
                  <div key={`${t.month}-${i}`} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                    <span className="text-[9px] font-mono text-[#6B6B6B]">{t.rentals}</span>
                    <div
                      className={`w-10 rounded-t-lg transition ${isLatest ? "bg-[#303030]" : "bg-[#D3C6B8] hover:bg-[#303030]"}`}
                      style={{ height: `${Math.max((t.rentals / peak) * 170, 4)}px` }}
                      title={`${t.month}: ${t.rentals} rentals, ₹${t.revenue}`}
                    />
                    <span
                      className={`text-[10px] font-mono ${isLatest ? "text-[#1C1C1C] font-bold" : "text-[#6B6B6B]"}`}
                    >
                      {t.month}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Catalog composition, grouped live from catalog.products. */}
            <div className="space-y-4 pt-4 border-t border-[#DADADA]">
              <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#D4AF37]" /> Inventory by Category
              </h4>

              <div className="space-y-2.5 text-[11px] bg-[#FAF9F6] border border-[#DADADA] rounded-2xl p-4 max-h-48 overflow-y-auto">
                {!stats && <div className="text-[#6B6B6B]">Loading…</div>}
                {stats?.categoryDistribution.length === 0 && (
                  <div className="text-[#6B6B6B]">No products in the catalog yet.</div>
                )}
                {stats?.categoryDistribution.map((row) => {
                  const max = Math.max(...stats.categoryDistribution.map((c) => c.value), 1);
                  return (
                    <div key={row.name} className="flex items-center gap-3 py-1">
                      <span className="text-[#1C1C1C] w-36 shrink-0 font-sans">{row.name}</span>
                      <div className="flex-1 h-2 bg-[#EDEAE4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#303030] rounded-full"
                          style={{ width: `${(row.value / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-[#6B6B6B] w-6 text-right font-mono">{row.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: coupon administration. This replaced a "Platform
              Parameters" panel whose fee/deposit inputs and feature toggles
              were wired to nothing — no settings service exists to store them,
              so the panel could only ever pretend to save. */}
          <div className="lg:col-span-4 space-y-6">
            <AdminCoupons />
            <AdminProducts products={products} onChanged={refreshAll} />
          </div>
        </div>

        {/* Tables run full width — they need the room. */}
        <div className="mt-10 space-y-10">
          <AdminOrders orders={orders} onChanged={refreshAll} />
          <AdminUserManagement currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}

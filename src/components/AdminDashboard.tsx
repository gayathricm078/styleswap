import React, { useEffect, useState } from "react";
import { ShieldCheck, BarChart3, Users, Settings, Activity, ClipboardList, Sparkles, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Product } from "../types";
import { api } from "../api/client";

interface AdminDashboardProps {
  products: Product[];
  ordersCount: number;
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

export default function AdminDashboard({ products, ordersCount }: AdminDashboardProps) {
  // System control configs
  const [platformFee, setPlatformFee] = useState(15);
  const [enableTryOn, setEnableTryOn] = useState(true);
  const [enableAiStylist, setEnableAiStylist] = useState(true);
  const [securityPct, setSecurityPct] = useState(25);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<Analytics | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAnalytics()
      .then(setStats)
      .catch((err) => setStatsError(err?.message || "Could not load analytics."));
  }, []);

  const handleSaveSettings = () => {
    // These toggles are UI-only: there is no settings service behind them yet.
    setSuccessMsg("Saved locally — platform settings are not yet persisted server-side.");
    setTimeout(() => setSuccessMsg(null), 3500);
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

            {/* Handcrafted Beautiful Minimalist SVG Bar Chart */}
            <div className="relative w-full h-64 bg-[#FAF9F6] rounded-2xl flex items-end justify-between p-6 pt-10 border border-[#DADADA]/30">
              {/* Gridlines */}
              <div className="absolute inset-x-6 top-10 border-b border-[#DADADA]/20 text-[9px] text-[#6B6B6B]/60 text-right">80 Swaps</div>
              <div className="absolute inset-x-6 top-28 border-b border-[#DADADA]/20 text-[9px] text-[#6B6B6B]/60 text-right">40 Swaps</div>
              <div className="absolute inset-x-6 top-44 border-b border-[#DADADA]/20 text-[9px] text-[#6B6B6B]/60 text-right">10 Swaps</div>

              {/* Minimal bar groups */}
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div className="w-10 bg-[#D3C6B8] rounded-t-lg transition hover:bg-[#303030]" style={{ height: "45px" }}></div>
                <span className="text-[10px] font-mono text-[#6B6B6B]">Feb</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div className="w-10 bg-[#D3C6B8] rounded-t-lg transition hover:bg-[#303030]" style={{ height: "65px" }}></div>
                <span className="text-[10px] font-mono text-[#6B6B6B]">Mar</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div className="w-10 bg-[#D3C6B8] rounded-t-lg transition hover:bg-[#303030]" style={{ height: "90px" }}></div>
                <span className="text-[10px] font-mono text-[#6B6B6B]">Apr</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div className="w-10 bg-[#D3C6B8] rounded-t-lg transition hover:bg-[#303030]" style={{ height: "135px" }}></div>
                <span className="text-[10px] font-mono text-[#6B6B6B]">May</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div className="w-10 bg-[#303030] rounded-t-lg" style={{ height: "170px" }}></div>
                <span className="text-[10px] font-mono text-[#1C1C1C] font-bold">Jun</span>
              </div>
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

          {/* Right Column: Platform Configuration Settings */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-5 shadow-sm text-xs">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] border-b border-[#DADADA] pb-3 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-[#D4AF37]" /> Platform Parameters
              </h3>

              {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-center gap-1">
                  <Check className="w-4 h-4" /> {successMsg}
                </div>
              )}

              {/* Commission input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase">Platform Fee Commission (%)</label>
                <div className="flex gap-2">
                  <input
                    id="admin-fee-input"
                    type="number"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-lg p-2.5 font-mono font-bold"
                  />
                  <span className="bg-gray-100 px-3.5 flex items-center rounded-lg border border-[#DADADA] font-bold">%</span>
                </div>
              </div>

              {/* Security deposit percentage */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase">Default Security Deposit Rate (%)</label>
                <div className="flex gap-2">
                  <input
                    id="admin-deposit-input"
                    type="number"
                    value={securityPct}
                    onChange={(e) => setSecurityPct(Number(e.target.value))}
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-lg p-2.5 font-mono font-bold"
                  />
                  <span className="bg-gray-100 px-3.5 flex items-center rounded-lg border border-[#DADADA] font-bold">%</span>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="space-y-4 pt-4 border-t border-[#DADADA]">
                <h4 className="text-[10px] text-[#1C1C1C] font-bold uppercase tracking-wider">Feature Flags Status</h4>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#1C1C1C]">Gemini 3.5 AI Stylist</span>
                    <p className="text-[10px] text-[#6B6B6B]">Enables conversational look generation.</p>
                  </div>
                  <button
                    id="flag-stylist-toggle"
                    onClick={() => setEnableAiStylist(!enableAiStylist)}
                    className="text-[#303030] hover:text-black transition"
                  >
                    {enableAiStylist ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#1C1C1C]">AI Virtual Try-On Studio</span>
                    <p className="text-[10px] text-[#6B6B6B]">Enables face mesh alignment overlays.</p>
                  </div>
                  <button
                    id="flag-tryon-toggle"
                    onClick={() => setEnableTryOn(!enableTryOn)}
                    className="text-[#303030] hover:text-black transition"
                  >
                    {enableTryOn ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                  </button>
                </div>
              </div>

              <button
                id="admin-save-btn"
                onClick={handleSaveSettings}
                className="w-full bg-[#303030] hover:bg-black text-white text-[10px] font-sans font-bold uppercase tracking-widest py-3.5 rounded-xl transition"
              >
                Apply Parameters
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

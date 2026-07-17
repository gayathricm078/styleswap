import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Order, Product } from "../types";
import { api } from "../api/client";
import AdminAnalytics, { Analytics } from "./AdminAnalytics";
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
    <div className="bg-[#F8F6F2] min-h-screen py-6 sm:py-10 px-4 sm:px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto text-left">

        {/* Title */}
        <div className="mb-6 sm:mb-8 border-b border-[#DADADA] pb-5 flex justify-between items-baseline flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
              <span>Platform Core Control</span>
              <span className="text-[#D4AF37]">✦</span>
              <span>Super Administrator Portal</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight mt-1 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-[#1C1C1C] shrink-0" />
              StyleSwap Admin Engine
            </h2>
          </div>
        </div>

        <AdminAnalytics stats={stats} error={statsError} ordersCount={ordersCount} />

        {/* Coupons and catalog sit side by side on desktop, stack on mobile.
            They replaced a "Platform Parameters" panel whose fee/deposit inputs
            and feature toggles were wired to nothing — no settings service
            exists to store them, so it could only ever pretend to save. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
          <AdminCoupons />
          <AdminProducts products={products} onChanged={refreshAll} />
        </div>

        {/* Tables run full width — they need the room. */}
        <div className="mt-6 space-y-6">
          <AdminOrders orders={orders} onChanged={refreshAll} />
          <AdminUserManagement currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}

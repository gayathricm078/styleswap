import React, { useState } from "react";
import { BarChart3, Table2, TrendingUp, Package } from "lucide-react";

/**
 * Admin analytics.
 *
 * Colour decisions here are validated, not taste:
 *  - Every mark is ONE hue (--series-1, charcoal). Both datasets are single-series:
 *    "rentals per month" is one measure over time, and the categories (Women, Men,
 *    Kids…) are *nominal* — colouring those bars by their value would re-encode
 *    what bar length already shows and spend the identity channel for nothing.
 *  - The brand gold #D4AF37 scores 1.95:1 on the cream surface, well under the 3:1
 *    marks floor, so it never fills a mark. It is used only for non-data accents
 *    (icons, rules), where it isn't carrying a value. Charcoal #303030 passes.
 *  - Text never wears the data colour; values and labels use ink tokens.
 */

export interface Analytics {
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

interface Props {
  stats: Analytics | null;
  error: string | null;
  ordersCount: number;
}

/** 1,284 / 12.9K / 4.2M — stat values stay short so tiles never wrap. */
function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

function StatTile({
  label,
  value,
  context,
}: {
  label: string;
  value: React.ReactNode;
  context?: string;
}) {
  return (
    <div className="bg-white border border-[#DADADA] rounded-[20px] p-4 sm:p-5">
      <span className="block text-[9px] sm:text-[10px] uppercase tracking-widest text-[#6B6B6B] font-sans">
        {label}
      </span>
      {/* Proportional figures: tabular-nums would make a 3-digit value look loose
          at this size. Columns of numbers (the table below) get tabular. */}
      <p className="mt-1.5 text-xl sm:text-2xl font-sans font-semibold text-[#1C1C1C] leading-none">
        {value}
      </p>
      {context && <span className="block mt-1.5 text-[10px] text-[#6B6B6B]">{context}</span>}
    </div>
  );
}

/** Columns: rentals per month.
 *  Discrete monthly buckets, and the series is frequently one point early on —
 *  a line needs two. Columns read correctly at n=1 and n=12. */
function RentalColumns({ data }: { data: Analytics["rentTrends"] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-[11px] text-[#6B6B6B]">
        No orders yet — place one and it appears here.
      </div>
    );
  }

  const peak = Math.max(...data.map((d) => d.rentals), 1);
  // Clean tick numbers rather than the raw peak.
  const ceiling = Math.max(1, Math.ceil(peak / 4) * 4);
  const ticks = [ceiling, Math.round(ceiling / 2), 0];

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* Y axis: carries the values not directly labelled. */}
        <div className="w-7 shrink-0 h-48 relative">
          {ticks.map((t, i) => (
            <span
              key={t}
              className="absolute right-0 text-[9px] text-[#6B6B6B] font-mono tabular-nums -translate-y-1/2"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative h-48">
            {/* Hairline gridlines, one step off surface, solid, recessive. */}
            {ticks.map((t, i) => (
              <div
                key={t}
                className="absolute inset-x-0 border-t border-[#EDEAE4]"
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
              />
            ))}

            {/* 2px surface gap between adjacent columns via gap-0.5 */}
            <div className="absolute inset-0 flex items-end gap-0.5">
              {data.map((d, i) => {
                const pct = (d.rentals / ceiling) * 100;
                const isHover = hover === i;
                return (
                  <div
                    key={`${d.month}-${i}`}
                    className="flex-1 min-w-0 h-full flex items-end justify-center relative"
                    // The mark is the hit target, and the target is bigger than
                    // the painted pixels — the whole column slot is hoverable.
                    onPointerEnter={() => setHover(i)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                    role="img"
                    aria-label={`${d.month}: ${d.rentals} rentals, ₹${d.revenue} revenue`}
                  >
                    <div
                      className="w-full max-w-[24px] rounded-t transition-opacity"
                      style={{
                        height: `${Math.max(pct, 1.5)}%`,
                        background: "#303030",
                        opacity: isHover ? 0.78 : 1,
                      }}
                    />
                    {isHover && (
                      <div className="absolute bottom-full mb-2 z-20 pointer-events-none whitespace-nowrap bg-[#1C1C1C] text-white rounded-lg px-2.5 py-1.5 shadow-lg">
                        {/* Value leads, label follows. */}
                        <div className="text-[11px] font-semibold tabular-nums">
                          {d.rentals} rental{d.rentals === 1 ? "" : "s"}
                        </div>
                        <div className="text-[9px] text-[#A0A0A0] tabular-nums">
                          ₹{d.revenue.toLocaleString()} · {d.month}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* X axis */}
          <div className="flex gap-0.5 mt-2">
            {data.map((d, i) => (
              <span
                key={`${d.month}-label-${i}`}
                className="flex-1 min-w-0 text-center text-[9px] sm:text-[10px] text-[#6B6B6B] font-mono truncate"
              >
                {d.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Horizontal bars: inventory by category.
 *  Horizontal because the category names are long ("Home Decoration"). */
function CategoryBars({ data }: { data: Analytics["categoryDistribution"] }) {
  const [hover, setHover] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-[11px] text-[#6B6B6B]">
        Catalog is empty.
      </div>
    );
  }

  const peak = Math.max(...data.map((d) => d.value), 1);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-1.5">
      {sorted.map((d) => {
        const pct = (d.value / peak) * 100;
        const isHover = hover === d.name;
        return (
          <div
            key={d.name}
            className="flex items-center gap-3 group cursor-default"
            onPointerEnter={() => setHover(d.name)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(d.name)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            role="img"
            aria-label={`${d.name}: ${d.value} listings`}
          >
            <span className="w-24 sm:w-32 shrink-0 text-[10px] sm:text-[11px] text-[#1C1C1C] font-sans truncate">
              {d.name}
            </span>
            <div className="flex-1 min-w-0 h-4 flex items-center">
              <div
                // ≤24px thick, 4px rounded data-end, square at the baseline.
                className="h-2.5 rounded-r transition-opacity"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: "#303030",
                  opacity: isHover ? 0.78 : 1,
                }}
              />
            </div>
            {/* Value at the tip. Ink token, never the data colour. */}
            <span className="w-6 shrink-0 text-right text-[10px] text-[#6B6B6B] font-mono tabular-nums">
              {d.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics({ stats, error, ordersCount }: Props) {
  const [showTable, setShowTable] = useState(false);

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl px-5 py-4 text-xs text-[#6B6B6B]">
        Live analytics unavailable: {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white border border-[#DADADA] rounded-[24px] px-5 py-10 text-center text-xs text-[#6B6B6B]">
        Loading analytics…
      </div>
    );
  }

  const avgOrder = ordersCount > 0 ? Math.round(stats.totalRevenue / ordersCount) : 0;

  return (
    <div className="space-y-6">
      {/* Hero + KPI row. The hero is the one number the view leads with, in the
          same sans as everything else — a serif hero reads as decoration. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-4 bg-[#1C1C1C] rounded-[24px] p-6 flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-sans">
            Gross revenue
          </span>
          <p className="mt-2 text-5xl font-sans font-semibold text-white leading-none">
            ₹{compact(stats.totalRevenue)}
          </p>
          <span className="mt-2.5 text-[11px] text-[#A0A0A0]">
            {ordersCount} order{ordersCount === 1 ? "" : "s"}
            {ordersCount > 0 && ` · ₹${compact(avgOrder)} average`}
          </span>
        </div>

        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatTile
            label="Members"
            value={compact(stats.totalUsers)}
            context={`Avg. sustainability ${stats.averageSustainability}`}
          />
          <StatTile
            label="Active rentals"
            value={compact(stats.activeRentals)}
            context="Booked, out, or rented"
          />
          <StatTile
            label="Inventory"
            value={compact(stats.totalProducts)}
            context="Live catalog"
          />
          <StatTile
            label="Returned"
            value={`${stats.returnRatePercentage}%`}
            context={`${stats.perfectReturns} clean · ${stats.damagedReturns} damaged`}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 border-b border-[#DADADA] pb-3 mb-5">
            <h3 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" /> Rentals per month
            </h3>
            <span className="text-[9px] text-[#6B6B6B] shrink-0">Orders placed</span>
          </div>
          <RentalColumns data={stats.rentTrends} />
        </div>

        <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 border-b border-[#DADADA] pb-3 mb-5">
            <h3 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#D4AF37]" /> Inventory by category
            </h3>
            <span className="text-[9px] text-[#6B6B6B] shrink-0">Listings</span>
          </div>
          <CategoryBars data={stats.categoryDistribution} />
        </div>
      </div>

      {/* Table view — every value a tooltip shows must be reachable without hovering. */}
      <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 sm:p-6">
        <button
          id="analytics-table-toggle"
          onClick={() => setShowTable((v) => !v)}
          aria-expanded={showTable}
          className="flex items-center gap-1.5 text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] hover:text-[#6B6B6B] transition"
        >
          <Table2 className="w-3.5 h-3.5 text-[#D4AF37]" />
          {showTable ? "Hide data table" : "View as data table"}
        </button>

        {showTable && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <caption className="sr-only">Rentals and revenue per month</caption>
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-[#6B6B6B] border-b border-[#DADADA]">
                    <th scope="col" className="py-2 pr-3 font-bold">Month</th>
                    <th scope="col" className="py-2 pr-3 font-bold text-right">Rentals</th>
                    <th scope="col" className="py-2 font-bold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {stats.rentTrends.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-3 text-[#6B6B6B]">No orders yet.</td>
                    </tr>
                  ) : (
                    stats.rentTrends.map((t, i) => (
                      <tr key={`${t.month}-${i}`} className="border-b border-[#F0EDE7] last:border-0">
                        <td className="py-2 pr-3 text-[#1C1C1C]">{t.month}</td>
                        <td className="py-2 pr-3 text-right text-[#6B6B6B]">{t.rentals}</td>
                        <td className="py-2 text-right text-[#6B6B6B]">₹{t.revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <caption className="sr-only">Listings per category</caption>
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-[#6B6B6B] border-b border-[#DADADA]">
                    <th scope="col" className="py-2 pr-3 font-bold">Category</th>
                    <th scope="col" className="py-2 font-bold text-right">Listings</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {stats.categoryDistribution.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-3 text-[#6B6B6B]">Catalog is empty.</td>
                    </tr>
                  ) : (
                    [...stats.categoryDistribution]
                      .sort((a, b) => b.value - a.value)
                      .map((c) => (
                        <tr key={c.name} className="border-b border-[#F0EDE7] last:border-0">
                          <td className="py-2 pr-3 text-[#1C1C1C]">{c.name}</td>
                          <td className="py-2 text-right text-[#6B6B6B]">{c.value}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

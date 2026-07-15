import React, { useEffect, useState } from "react";
import { Ticket, Plus, Trash2, Check, AlertCircle, Percent, IndianRupee } from "lucide-react";
import { Coupon } from "../types";
import { api, ApiError } from "../api/client";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<Coupon["discountType"]>("percentage");
  const [value, setValue] = useState<string>("10");
  const [description, setDescription] = useState("");

  const load = async () => {
    try {
      setCoupons(await api.listCoupons());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numeric = parseInt(value, 10);
    if (!code.trim()) return setError("Give the coupon a code.");
    if (!description.trim()) return setError("Describe what the coupon does — customers see this.");
    if (Number.isNaN(numeric) || numeric <= 0) return setError("Value must be a positive number.");
    if (discountType === "percentage" && numeric > 100) {
      return setError("A percentage discount cannot exceed 100%.");
    }

    setBusy(true);
    try {
      await api.createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        value: numeric,
        description: description.trim(),
      });
      setCoupons(await api.listCoupons());
      setCode("");
      setDescription("");
      flash(`${code.trim().toUpperCase()} is live.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create that coupon.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async (coupon: Coupon) => {
    const ok = window.confirm(
      `Deactivate ${coupon.code}?\n\nCustomers will no longer be able to apply it. ` +
        `Orders already placed with it keep their discount.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      await api.deactivateCoupon(coupon.code);
      setCoupons(await api.listCoupons());
      flash(`${coupon.code} deactivated.`);
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Could not deactivate that coupon.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-5 shadow-sm">
      <div className="flex justify-between items-baseline border-b border-[#DADADA] pb-3 gap-4 flex-wrap">
        <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-[#D4AF37]" /> Discount Codes
        </h3>
        <span className="text-[10px] text-[#6B6B6B]">
          {coupons.length} active
        </span>
      </div>

      {notice && (
        <div className="bg-[#FAF9F6] border border-[#DADADA] rounded-2xl px-4 py-3 text-[11px] text-[#1C1C1C] flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
          {notice}
        </div>
      )}

      {error && (
        <div className="bg-white border border-red-200 rounded-2xl px-4 py-3 text-[11px] text-[#6B6B6B] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Existing codes */}
      {loading ? (
        <div className="text-[11px] text-[#6B6B6B] py-4 text-center">Loading codes…</div>
      ) : coupons.length === 0 ? (
        <div className="text-[11px] text-[#6B6B6B] py-4 text-center">
          No active codes. Create one below.
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div
              key={c.code}
              className="flex items-center justify-between gap-3 bg-[#FAF9F6] border border-[#DADADA] rounded-2xl px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#1C1C1C]">{c.code}</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#8A6D1F] bg-[#E8E2D4] px-2 py-0.5 rounded-full">
                    {c.discountType === "percentage" ? `${c.value}% off` : `₹${c.value} off`}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B6B6B] truncate mt-0.5">{c.description}</p>
              </div>
              <button
                id={`deactivate-${c.code}`}
                onClick={() => handleDeactivate(c)}
                disabled={busy}
                title={`Deactivate ${c.code}`}
                className="shrink-0 text-[#6B6B6B] hover:text-red-600 transition disabled:opacity-40 p-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      <form onSubmit={handleCreate} className="space-y-3 pt-4 border-t border-[#DADADA]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1">
              Code
            </label>
            <input
              id="coupon-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER25"
              className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-[#1C1C1C] transition"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1">
              Value
            </label>
            <div className="relative">
              <input
                id="coupon-value-input"
                type="number"
                min={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#1C1C1C] transition"
              />
              {discountType === "percentage" ? (
                <Percent className="w-3 h-3 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              ) : (
                <IndianRupee className="w-3 h-3 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1">
            Discount type
          </label>
          <div className="flex gap-2">
            {(["percentage", "fixed"] as const).map((t) => (
              <button
                key={t}
                type="button"
                id={`coupon-type-${t}`}
                onClick={() => setDiscountType(t)}
                className={`flex-1 px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold border transition ${
                  discountType === t
                    ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                    : "bg-[#FAF9F6] text-[#6B6B6B] border-[#DADADA] hover:border-[#1C1C1C]"
                }`}
              >
                {t === "percentage" ? "% of rental" : "Flat ₹"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1">
            Description
          </label>
          <input
            id="coupon-desc-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="25% off your summer rental"
            className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#1C1C1C] transition"
          />
        </div>

        <button
          id="create-coupon-btn"
          type="submit"
          disabled={busy}
          className="w-full bg-[#303030] text-white text-[10px] font-sans font-semibold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-black transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> {busy ? "Working…" : "Create code"}
        </button>

        <p className="text-[10px] text-[#6B6B6B] leading-relaxed">
          Discounts apply to the rental total, never the refundable deposit, and
          are capped at the rental value.
        </p>
      </form>
    </div>
  );
}

import React, { useState } from "react";
import { Package, Trash2, Check, Search } from "lucide-react";
import { Product } from "../types";
import { api, ApiError } from "../api/client";

interface Props {
  products: Product[];
  onChanged: () => void | Promise<void>;
}

export default function AdminProducts({ products, onChanged }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handleDelete = async (product: Product) => {
    // Deleting a rented garment would orphan the live rental, so refuse it
    // here as well as making the consequence explicit for everything else.
    if (product.status !== "Available") {
      flash(`${product.name} is "${product.status}" — only Available items can be delisted.`);
      return;
    }

    const ok = window.confirm(
      `Permanently delete "${product.name}"?\n\n` +
        `Its reviews go with it. Past orders keep their own snapshot, so order ` +
        `history stays intact.\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setBusyId(product.id);
    try {
      await api.deleteProduct(product.id);
      await onChanged();
      flash(`${product.name} delisted.`);
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Could not delete that listing.");
    } finally {
      setBusyId(null);
    }
  };

  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.brand.toLowerCase().includes(needle) ||
          p.category.toLowerCase().includes(needle)
      )
    : products;

  return (
    <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-5 shadow-sm">
      <div className="flex justify-between items-baseline border-b border-[#DADADA] pb-3 gap-4 flex-wrap">
        <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
          <Package className="w-4 h-4 text-[#D4AF37]" /> Catalog Control
        </h3>
        <span className="text-[10px] text-[#6B6B6B]">
          {products.length} listing{products.length === 1 ? "" : "s"}
        </span>
      </div>

      {notice && (
        <div className="bg-[#FAF9F6] border border-[#DADADA] rounded-2xl px-4 py-3 text-[11px] text-[#1C1C1C] flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
          {notice}
        </div>
      )}

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="admin-product-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, brand, or category"
          className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#1C1C1C] transition"
        />
      </div>

      {visible.length === 0 ? (
        <div className="text-[11px] text-[#6B6B6B] py-6 text-center">
          {products.length === 0 ? "Catalog is empty." : `No listings match "${filter}".`}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visible.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-[#FAF9F6] border border-[#DADADA] rounded-2xl px-3 py-2.5"
            >
              <img
                src={p.image}
                alt=""
                className="w-10 h-10 rounded-lg object-cover bg-[#F0EDE7] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[11px] text-[#1C1C1C] truncate">{p.name}</div>
                <div className="text-[10px] text-[#6B6B6B] truncate">
                  {p.brand} · {p.category} · ₹{p.rentalPrice}/day
                </div>
              </div>
              <span
                className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  p.status === "Available"
                    ? "bg-[#DCE5DC] text-[#3F5F3F]"
                    : "bg-[#F0EDE7] text-[#6B6B6B]"
                }`}
              >
                {p.status}
              </span>
              <button
                id={`delete-product-${p.id}`}
                onClick={() => handleDelete(p)}
                disabled={busyId === p.id || p.status !== "Available"}
                title={
                  p.status === "Available"
                    ? `Delete ${p.name}`
                    : `Cannot delete while ${p.status}`
                }
                className="shrink-0 text-[#6B6B6B] hover:text-red-600 transition disabled:opacity-25 disabled:hover:text-[#6B6B6B] disabled:cursor-not-allowed p-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-[#6B6B6B] leading-relaxed pt-1 border-t border-[#F0EDE7]">
        Only Available items can be delisted — deleting one that is booked or
        rented would orphan a live rental.
      </p>
    </div>
  );
}

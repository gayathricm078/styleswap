import React, { useState } from "react";
import { ClipboardList, Check, AlertCircle, Search } from "lucide-react";
import { Order } from "../types";
import { api, ApiError } from "../api/client";

interface Props {
  orders: Order[];
  onChanged: () => void | Promise<void>;
}

/** The seven states orders.orders.status permits. Anything else is rejected
 *  by the service with a 400. */
const STATUSES: Order["status"][] = [
  "Pending Approval",
  "Booked",
  "Out For Delivery",
  "Currently Rented",
  "Returned",
  "Under Maintenance",
  "Rejected",
];

const STATUS_STYLES: Record<string, string> = {
  "Pending Approval": "bg-[#F0EDE7] text-[#6B6B6B]",
  Booked: "bg-[#E8E2D4] text-[#8A6D1F]",
  "Out For Delivery": "bg-[#DCE5DC] text-[#3F5F3F]",
  "Currently Rented": "bg-[#1C1C1C] text-[#D4AF37]",
  Returned: "bg-[#DCE5DC] text-[#3F5F3F]",
  "Under Maintenance": "bg-[#F5E4E4] text-[#8A2F2F]",
  Rejected: "bg-[#F5E4E4] text-[#8A2F2F]",
};

export default function AdminOrders({ orders, onChanged }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const handleStatusChange = async (order: Order, status: string) => {
    if (status === order.status) return;
    setBusyId(order.id);
    try {
      await api.updateOrderStatus(order.id, status);
      await onChanged();
      flash(`${order.id} → ${status}`);
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Could not update that order.");
    } finally {
      setBusyId(null);
    }
  };

  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(needle) ||
          o.status.toLowerCase().includes(needle) ||
          o.items.some((i) => i.product.name.toLowerCase().includes(needle))
      )
    : orders;

  return (
    <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-5 shadow-sm">
      <div className="flex justify-between items-baseline border-b border-[#DADADA] pb-3 gap-4 flex-wrap">
        <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-[#D4AF37]" /> Order Fulfilment
        </h3>
        <span className="text-[10px] text-[#6B6B6B]">
          {orders.length} order{orders.length === 1 ? "" : "s"}
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
          id="admin-order-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by order id, status, or item"
          className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#1C1C1C] transition"
        />
      </div>

      {visible.length === 0 ? (
        <div className="text-[11px] text-[#6B6B6B] py-6 text-center">
          {orders.length === 0 ? "No orders yet." : `No orders match "${filter}".`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-[#6B6B6B] border-b border-[#DADADA]">
                <th className="py-2 pr-3 font-bold">Order</th>
                <th className="py-2 pr-3 font-bold">Items</th>
                <th className="py-2 pr-3 font-bold">Total</th>
                <th className="py-2 pr-3 font-bold">Return</th>
                <th className="py-2 pr-3 font-bold">Current</th>
                <th className="py-2 font-bold text-right">Set status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id} className="border-b border-[#F0EDE7] last:border-0 align-top">
                  <td className="py-3 pr-3">
                    <div className="font-mono font-bold text-[#1C1C1C]">{order.id}</div>
                    <div className="text-[#6B6B6B]">{order.date}</div>
                  </td>
                  <td className="py-3 pr-3 text-[#6B6B6B] max-w-[220px]">
                    {order.items.map((i) => (
                      <div key={i.id} className="truncate">
                        {i.product.name}
                        <span className="text-[#A0A0A0]">
                          {" "}
                          · {i.selectedSize} · {i.rentalDuration}d
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-[#1C1C1C]">₹{order.totalAmount}</td>
                  <td className="py-3 pr-3 text-[#6B6B6B]">
                    {order.damageReport ? (
                      <span
                        className="text-[#8A2F2F]"
                        title={order.damageReport.description}
                      >
                        {order.damageReport.severity} · ₹{order.damageReport.charge}
                      </span>
                    ) : (
                      order.returnStatus
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-bold whitespace-nowrap ${
                        STATUS_STYLES[order.status] || "bg-[#F0EDE7] text-[#6B6B6B]"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <select
                      id={`order-status-${order.id}`}
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      className="bg-[#FAF9F6] border border-[#DADADA] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[#1C1C1C] disabled:opacity-50 transition"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-[#6B6B6B] leading-relaxed pt-1 border-t border-[#F0EDE7]">
        Status here is the fulfilment state only. Damage verdicts and fees come
        from the return scan and cannot be edited by hand.
      </p>
    </div>
  );
}

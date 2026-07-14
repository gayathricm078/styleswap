import React, { useState } from "react";
import { Trash2, ShieldAlert, Tag, Ticket, ArrowRight, ShoppingBag, Sparkle } from "lucide-react";
import { CartItem, Coupon } from "../types";
import { COUPONS } from "../data";

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateDuration: (id: string, days: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (appliedCoupon: Coupon | null, discountAmount: number) => void;
  onViewChange: (view: string) => void;
}

export default function CartPage({
  cartItems,
  onUpdateDuration,
  onRemoveItem,
  onCheckout,
  onViewChange,
}: CartPageProps) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Totals calculations
  const rentalTotal = cartItems.reduce((acc, item) => acc + (item.product.rentalPrice * item.rentalDuration), 0);
  const securityDepositTotal = cartItems.reduce((acc, item) => acc + item.product.securityDeposit, 0);

  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    const found = COUPONS.find((c) => c.code === code);
    
    if (found) {
      setAppliedCoupon(found);
      setCouponCode("");
    } else {
      setCouponError("Invalid voucher code. Try 'STYLE20' or 'ECOLUXE'.");
    }
  };

  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === "percentage"
      ? (rentalTotal * appliedCoupon.value) / 100
      : appliedCoupon.value
    : 0;

  const grandTotal = rentalTotal + securityDepositTotal - discountAmount;

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        
        {/* Title */}
        <div className="text-left mb-10 border-b border-[#DADADA] pb-6">
          <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-[#1C1C1C]" /> Your Rental Bag
          </h2>
          <p className="text-xs text-[#6B6B6B] font-sans mt-1">
            Review your selected fashion items, adjust rental durations, and apply sustainability credentials.
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-[#DADADA] rounded-[32px] p-16 text-center max-w-xl mx-auto space-y-5 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#DADADA] flex items-center justify-center mx-auto text-xl">
              ✦
            </div>
            <h3 className="font-serif text-xl font-semibold text-[#1C1C1C]">Your Bag is Empty</h3>
            <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto leading-relaxed">
              You currently do not have any designer garments or jewelry reserved in your rental draft.
            </p>
            <button
              id="cart-browse-btn"
              onClick={() => onViewChange("browse")}
              className="bg-[#303030] text-white text-xs font-sans font-bold uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-black transition shadow-sm"
            >
              Explore Collections
            </button>
          </div>
        ) : (
          /* Cart List */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left: Cart Items list */}
            <div className="lg:col-span-8 space-y-4 text-left">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  id={`cart-item-${item.id}`}
                  className="bg-white border border-[#DADADA] rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-center relative shadow-sm"
                >
                  {/* Delete button top right */}
                  <button
                    id={`cart-remove-${item.id}`}
                    onClick={() => onRemoveItem(item.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Product thumbnail */}
                  <div className="w-20 h-28 rounded-t-full rounded-b-md overflow-hidden shrink-0 border border-[#DADADA]/30 bg-slate-100">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Specs column */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-sans uppercase tracking-widest text-[#D4AF37] font-semibold">
                      {item.product.brand}
                    </span>
                    <h3 className="text-xs font-sans font-bold text-[#1C1C1C] truncate mt-0.5">{item.product.name}</h3>
                    <p className="text-[11px] text-[#6B6B6B] mt-1 flex flex-wrap gap-x-4">
                      <span>Size: <strong className="text-[#1C1C1C]">{item.selectedSize}</strong></span>
                      <span>Color: <strong className="text-[#1C1C1C]">{item.selectedColor}</strong></span>
                      <span>Rate: <strong className="text-[#1C1C1C]">₹{item.product.rentalPrice}/day</strong></span>
                    </p>

                    {/* Security Deposit badge */}
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#6B6B6B] font-sans">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Security Deposit: <strong>₹{item.product.securityDeposit}</strong> (100% Refundable)</span>
                    </div>
                  </div>

                  {/* Quantity & Duration adjusters */}
                  <div className="flex flex-col items-start sm:items-end gap-3 justify-between">
                    <div>
                      <label className="block text-[10px] text-[#6B6B6B] font-semibold uppercase mb-1">Rental Duration</label>
                      <div className="flex border border-[#DADADA] rounded-lg overflow-hidden bg-[#FAF9F6] text-xs">
                        {[4, 7, 14].map((days) => (
                          <button
                            key={days}
                            id={`cart-duration-set-${item.id}-${days}`}
                            onClick={() => onUpdateDuration(item.id, days)}
                            className={`px-3 py-1.5 transition ${item.rentalDuration === days ? "bg-[#303030] text-white font-bold" : "hover:bg-gray-100"}`}
                          >
                            {days}d
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[9px] uppercase tracking-widest text-[#6B6B6B]">Rental sum</p>
                      <p className="text-sm font-serif font-bold text-[#1C1C1C]">
                        ₹{item.product.rentalPrice * item.rentalDuration}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Secure checkout notice */}
              <div className="bg-[#FAF9F6] border border-[#DADADA] rounded-2xl p-4 flex gap-3 text-xs text-[#6B6B6B] leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="font-semibold text-[#1C1C1C]">About Our Rental Trust Assurance</p>
                  <p>All items undergo rigorous dry clean cycles, organic ozone sterilization, and tactile seam inspection between rentals. Security deposits are processed for return within 24 hours of fabric arrival back at our warehouse.</p>
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4 text-left">
              <div className="bg-white border border-[#DADADA] rounded-[28px] p-6 space-y-6 shadow-sm sticky top-28">
                <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] border-b border-[#DADADA] pb-3">
                  Rental Estimation
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Sum Rental Fees</span>
                    <span className="font-mono font-bold text-[#1C1C1C]">₹{rentalTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Refundable Deposits</span>
                    <span className="font-mono font-bold text-[#6B6B6B]">₹{securityDepositTotal}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-semibold bg-green-50 p-2.5 rounded-lg">
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Coupon: {appliedCoupon.code}</span>
                      <span className="font-mono">-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#DADADA] flex justify-between items-baseline">
                    <span className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">Grand Total</span>
                    <div className="text-right">
                      <span className="text-xl font-serif font-bold text-[#1C1C1C]">₹{grandTotal}</span>
                      <p className="text-[9px] text-[#6B6B6B] font-sans">Includes refundables & cleaning fees</p>
                    </div>
                  </div>
                </div>

                {/* Voucher input form */}
                <div className="space-y-2 pt-4 border-t border-[#DADADA]">
                  <label className="block text-[10px] text-[#6B6B6B] font-semibold uppercase tracking-wider">
                    Add Voucher / Sustainability Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="cart-coupon-input"
                      type="text"
                      placeholder="e.g. STYLE20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-[#FAF9F6] border border-[#DADADA] rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <button
                      id="cart-apply-coupon-btn"
                      onClick={handleApplyCoupon}
                      className="bg-[#303030] hover:bg-black text-white text-[10px] font-sans font-bold uppercase tracking-widest px-4 rounded-lg transition"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-500 font-medium">{couponError}</p>}
                  {!appliedCoupon && (
                    <p className="text-[9px] text-[#6B6B6B] italic">Try using 'STYLE20' for a 20% look discount!</p>
                  )}
                </div>

                {/* Eco-benefits message */}
                <div className="bg-[#FAF9F6] rounded-2xl p-4 text-[11px] text-[#1C1C1C] font-sans leading-relaxed border border-[#DADADA]/50 flex gap-2.5">
                  <Sparkle className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <div>
                    <span className="font-bold">Eco Milestone Reached!</span>
                    <p className="text-[#6B6B6B] text-[10px]">This order diverts approx. 8.4kg of fabric waste from modern landfills and reduces global textile CO₂ footprint.</p>
                  </div>
                </div>

                {/* Checkout button */}
                <button
                  id="cart-checkout-btn"
                  onClick={() => onCheckout(appliedCoupon, discountAmount)}
                  className="w-full bg-[#303030] hover:bg-black text-white text-xs font-sans font-bold uppercase tracking-widest py-4 rounded-full transition shadow-md flex items-center justify-center gap-2"
                >
                  Proceed to Secure Checkout <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

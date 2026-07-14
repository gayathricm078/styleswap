import React, { useState } from "react";
import { CreditCard, Truck, Calendar, Sparkles, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { Address, CartItem, Coupon } from "../types";

interface CheckoutPageProps {
  cartItems: CartItem[];
  userProfile: any;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  onPlaceOrder: (address: Address, paymentMethod: string) => void;
  onCancel: () => void;
}

export default function CheckoutPage({
  cartItems,
  userProfile,
  appliedCoupon,
  discountAmount,
  onPlaceOrder,
  onCancel,
}: CheckoutPageProps) {
  const [selectedAddress, setSelectedAddress] = useState<Address>(userProfile.addresses[0]);
  const [paymentMethod, setPaymentMethod] = useState("Razorpay (Online)");

  // Sum calculations
  const rentalTotal = cartItems.reduce((acc, item) => acc + (item.product.rentalPrice * item.rentalDuration), 0);
  const securityDepositTotal = cartItems.reduce((acc, item) => acc + item.product.securityDeposit, 0);
  const grandTotal = rentalTotal + securityDepositTotal - discountAmount;

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-left mb-10 border-b border-[#DADADA] pb-6 flex justify-between items-end">
          <div>
            <h2 className="font-serif text-3xl text-[#1C1C1C] tracking-tight">Secure Checkout</h2>
            <p className="text-xs text-[#6B6B6B] font-sans mt-1">Verify shipping destinations, rental agreements, and billing clearances.</p>
          </div>
          <button
            id="checkout-cancel-btn"
            onClick={onCancel}
            className="text-xs font-sans uppercase tracking-widest font-semibold text-[#6B6B6B] hover:text-black underline"
          >
            Cancel & Return to Bag
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          
          {/* Left: Forms */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Step 1: Delivery Address */}
            <div className="bg-white border border-[#DADADA] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5 border-b border-[#DADADA] pb-3">
                <Truck className="w-4 h-4 text-[#D4AF37]" /> 1. Delivery Destination
              </h3>

              <div className="space-y-3">
                {userProfile.addresses.map((addr: Address) => (
                  <div
                    key={addr.id}
                    id={`checkout-address-${addr.id}`}
                    onClick={() => setSelectedAddress(addr)}
                    className={`border rounded-xl p-4 cursor-pointer transition ${selectedAddress.id === addr.id ? "border-[#1C1C1C] bg-[#FAF9F6]" : "border-[#DADADA] hover:border-[#6B6B6B]"}`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-xs font-sans font-bold text-[#1C1C1C]">{addr.label}</h4>
                      {selectedAddress.id === addr.id && <span className="text-[10px] bg-[#1C1C1C] text-white px-2 py-0.5 rounded uppercase font-bold">Selected</span>}
                    </div>
                    <p className="text-xs text-[#6B6B6B] leading-relaxed">
                      {addr.street}, {addr.city}, {addr.state} {addr.zip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Payment Gateway Selector */}
            <div className="bg-white border border-[#DADADA] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5 border-b border-[#DADADA] pb-3">
                <CreditCard className="w-4 h-4 text-[#D4AF37]" /> 2. Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Razorpay Online */}
                <div
                  id="pay-razorpay-card"
                  onClick={() => setPaymentMethod("Razorpay (Online)")}
                  className={`border rounded-xl p-4 cursor-pointer transition flex flex-col justify-between h-28 ${paymentMethod === "Razorpay (Online)" ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#DADADA] hover:border-black"}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#1C1C1C]">Razorpay Online</span>
                    {paymentMethod === "Razorpay (Online)" && <CheckCircle2 className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]/20" />}
                  </div>
                  <p className="text-[10px] text-[#6B6B6B] leading-normal">
                    Secure credit/debit card, UPI, net banking checkout simulation. 
                  </p>
                </div>

                {/* Cash on Delivery */}
                <div
                  id="pay-cod-card"
                  onClick={() => setPaymentMethod("Cash on Delivery")}
                  className={`border rounded-xl p-4 cursor-pointer transition flex flex-col justify-between h-28 ${paymentMethod === "Cash on Delivery" ? "border-[#1C1C1C] bg-[#FAF9F6]" : "border-[#DADADA] hover:border-black"}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#1C1C1C]">Cash on Delivery</span>
                    {paymentMethod === "Cash on Delivery" && <CheckCircle2 className="w-4 h-4 text-black fill-black/10" />}
                  </div>
                  <p className="text-[10px] text-[#6B6B6B] leading-normal">
                    Hand payment to StyleSwap courier agent at delivery time.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Order Summary Column */}
          <div className="md:col-span-5">
            <div className="bg-white border border-[#DADADA] rounded-[24px] p-6 space-y-6 shadow-sm">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] border-b border-[#DADADA] pb-3">
                Order Verification
              </h3>

              <div className="space-y-4 max-h-48 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs border-b border-[#FAF9F6] pb-3">
                    <div className="w-10 h-14 rounded overflow-hidden border border-[#DADADA] shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="font-bold text-[#1C1C1C] truncate">{item.product.name}</h4>
                      <p className="text-[10px] text-[#6B6B6B]">{item.selectedSize} • {item.selectedColor}</p>
                      <p className="text-[10px] text-[#D4AF37] font-semibold">{item.rentalDuration} days swap</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Billing totals */}
              <div className="space-y-3.5 text-xs border-t border-[#DADADA] pt-4">
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Rental sum</span>
                  <span className="font-mono font-semibold text-[#1C1C1C]">₹{rentalTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Security Deposits</span>
                  <span className="font-mono font-semibold text-[#6B6B6B]">₹{securityDepositTotal}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Coupon Applied ({appliedCoupon.code})</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-[#DADADA] flex justify-between items-baseline">
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">Grand Total</span>
                  <div className="text-right">
                    <span className="text-xl font-serif font-bold text-[#1C1C1C]">₹{grandTotal}</span>
                    <p className="text-[9px] text-[#6B6B6B]">Includes refundables</p>
                  </div>
                </div>
              </div>

              {/* Confirm Rental Button */}
              <button
                id="checkout-place-order-btn"
                onClick={() => onPlaceOrder(selectedAddress, paymentMethod)}
                className="w-full bg-[#303030] hover:bg-black text-white text-xs font-sans font-bold uppercase tracking-widest py-4 rounded-full transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                Confirm Rental Agreement <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>

              <p className="text-[10px] text-[#6B6B6B] text-center italic">
                By confirming, you agree to return garments in their baseline integrity on the scheduled return pick-up dates.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

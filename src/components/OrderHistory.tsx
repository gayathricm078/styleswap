import React, { useState } from "react";
import { Sparkles, Calendar, ShieldCheck, ClipboardList, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { Order, CartItem } from "../types";

interface OrderHistoryProps {
  orders: Order[];
  onTriggerReturnScan: (orderId: string, itemId: string, damagePreset: string) => Promise<any>;
  onViewChange: (view: string) => void;
}

export default function OrderHistory({ orders, onTriggerReturnScan, onViewChange }: OrderHistoryProps) {
  const [activeReturnItem, setActiveReturnItem] = useState<{ orderId: string; item: CartItem } | null>(null);
  const [damagePreset, setDamagePreset] = useState("perfect");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const handleReturnScanSubmit = async () => {
    if (!activeReturnItem) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      // Calls parent routine which proxies to server-side Gemini scanner
      const result = await onTriggerReturnScan(activeReturnItem.orderId, activeReturnItem.item.id, damagePreset);
      setScanResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetReturnState = () => {
    setActiveReturnItem(null);
    setDamagePreset("perfect");
    setScanResult(null);
  };

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-left mb-10 border-b border-[#DADADA] pb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
            <span>Customer Trackings</span>
            <span>✦</span>
            <span>StyleSwap Security scans</span>
          </div>
          <h2 className="font-serif text-3xl text-[#1C1C1C] tracking-tight mt-1 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-[#1C1C1C]" /> Rental Order & Return Tracker
          </h2>
          <p className="text-xs text-[#6B6B6B] font-sans mt-1">
            Monitor active wardrobes, schedule courier pickups, and trigger automated AI fabric condition appraisals.
          </p>
        </div>

        {/* AI Return Appraisal modal overlay */}
        {activeReturnItem && (
          <div className="bg-white border border-[#DADADA] rounded-3xl p-8 text-left space-y-6 shadow-2xl mb-10 animate-slideUp">
            <div className="flex justify-between items-center border-b border-[#DADADA] pb-4">
              <h3 className="font-serif text-xl font-medium text-[#1C1C1C] flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" /> AI Return Damage Scanner
              </h3>
              <button
                id="damage-modal-close-btn"
                onClick={handleResetReturnState}
                className="text-xs font-sans uppercase tracking-widest font-semibold hover:text-[#D4AF37]"
              >
                Close Scanner
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Product Info Left */}
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-24 rounded-t-full rounded-b-md overflow-hidden border border-[#DADADA] shrink-0">
                    <img src={activeReturnItem.item.product.image} alt={activeReturnItem.item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans tracking-widest text-[#D4AF37] font-semibold">{activeReturnItem.item.product.brand}</span>
                    <h4 className="text-xs font-bold text-[#1C1C1C] mt-0.5">{activeReturnItem.item.product.name}</h4>
                    <p className="text-[11px] text-[#6B6B6B]">Variant: {activeReturnItem.item.selectedSize} / {activeReturnItem.item.selectedColor}</p>
                    <p className="text-[11px] font-mono font-bold text-[#1C1C1C]">Original Deposit: ₹{activeReturnItem.item.product.securityDeposit}</p>
                  </div>
                </div>

                {/* Preset Picker */}
                <div className="space-y-2 pt-2 border-t border-[#DADADA]/50">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Simulate Return Fabric Defect
                  </label>
                  <p className="text-[11px] text-[#6B6B6B]">Select condition scenario to test automated optical inspection:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      id="preset-perfect-btn"
                      onClick={() => setDamagePreset("perfect")}
                      className={`py-2 text-[10px] font-sans uppercase font-bold rounded-xl border transition ${damagePreset === "perfect" ? "bg-green-50 border-green-600 text-green-700" : "border-[#DADADA] bg-white hover:border-black"}`}
                    >
                      Pristine
                    </button>
                    <button
                      id="preset-stain-btn"
                      onClick={() => setDamagePreset("stain")}
                      className={`py-2 text-[10px] font-sans uppercase font-bold rounded-xl border transition ${damagePreset === "stain" ? "bg-yellow-50 border-yellow-600 text-yellow-700" : "border-[#DADADA] bg-white hover:border-black"}`}
                    >
                      Stain/Spill
                    </button>
                    <button
                      id="preset-tear-btn"
                      onClick={() => setDamagePreset("tear")}
                      className={`py-2 text-[10px] font-sans uppercase font-bold rounded-xl border transition ${damagePreset === "tear" ? "bg-red-50 border-red-600 text-red-700" : "border-[#DADADA] bg-white hover:border-black"}`}
                    >
                      Hem Tear
                    </button>
                  </div>
                </div>

                <button
                  id="damage-run-scan-btn"
                  onClick={handleReturnScanSubmit}
                  disabled={isScanning}
                  className="w-full bg-[#303030] hover:bg-black text-white text-xs font-sans font-bold uppercase tracking-widest py-3 rounded-full transition shadow flex items-center justify-center gap-2"
                >
                  {isScanning ? "Processing Optical Mesh..." : "Analyze Return Integrity"}
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </div>

              {/* Scanning Outcomes Right */}
              <div>
                {isScanning && (
                  <div className="bg-[#FAF9F6] rounded-2xl p-8 border border-[#DADADA] text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-t-[#D4AF37] border-r-transparent border-b-[#1C1C1C] border-l-transparent animate-spin mx-auto"></div>
                    <p className="text-xs text-[#6B6B6B]">Optical loom scan active. Verifying stitch elasticity...</p>
                  </div>
                )}

                {scanResult && (
                  <div className="bg-[#FAF9F6] rounded-2xl p-6 border border-[#DADADA] text-left space-y-4 animate-fadeIn text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-[#DADADA]">
                      <span className="font-bold text-[#1C1C1C] uppercase tracking-wider text-[10px]">Appraisal Summary</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${scanResult.condition === "Perfect" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {scanResult.condition}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[#6B6B6B] leading-relaxed italic">"{scanResult.damageSummary}"</p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#DADADA]/50">
                        <div>
                          <span className="text-[9px] text-[#6B6B6B] uppercase block">Action required</span>
                          <span className="font-bold text-[#1C1C1C] font-mono">{scanResult.actionRequired}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#6B6B6B] uppercase block">Assessed fine</span>
                          <span className="font-bold text-red-600 font-mono">₹{scanResult.feeCharged}</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-[#DADADA]/40 mt-3 text-[10px] leading-relaxed">
                        {scanResult.condition === "Perfect" ? (
                          <div className="flex items-center gap-1.5 text-green-700">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>Deposit refund of <strong>₹{activeReturnItem.item.product.securityDeposit}</strong> was fully approved!</span>
                          </div>
                        ) : (
                          <div className="flex items-start gap-1.5 text-red-700">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <span>Refund of <strong>₹{activeReturnItem.item.product.securityDeposit - scanResult.feeCharged}</strong> approved (Deducted fine).</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!isScanning && !scanResult && (
                  <div className="bg-[#FAF9F6] border border-dashed border-[#DADADA] rounded-2xl p-10 text-center text-xs text-[#6B6B6B]">
                    Please select a return scenario preset on the left and click 'Analyze Return Integrity' to run the Gemini inspection model.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Cards Track */}
        {orders.length === 0 ? (
          <div className="bg-white border border-[#DADADA] rounded-[32px] p-16 text-center shadow-sm">
            <h3 className="font-serif text-xl font-semibold text-[#1C1C1C]">No Active Rental Agreements</h3>
            <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto leading-relaxed mt-1">
              You haven't rented any luxury items yet. Once you secure an agreement, status trackings and AI fabric returns show up here.
            </p>
            <button
              id="order-history-browse-btn"
              onClick={() => onViewChange("browse")}
              className="bg-[#303030] text-white text-xs font-sans font-bold uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-black transition mt-5 shadow"
            >
              Rent Your First Outfit
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((ord) => (
              <div
                key={ord.id}
                id={`order-card-${ord.id}`}
                className="bg-white border border-[#DADADA] rounded-3xl p-6 text-left space-y-4 shadow-sm"
              >
                {/* Header line */}
                <div className="flex justify-between items-baseline border-b border-[#DADADA]/50 pb-3 flex-wrap gap-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#6B6B6B] font-mono">Agreement: #{ord.id}</span>
                    <p className="text-xs font-sans text-[#1C1C1C] font-semibold">Date Placed: {ord.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6B6B6B]">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${ord.status === "Booked" || ord.status === "Currently Rented" ? "bg-[#D4AF37]/20 text-[#1C1C1C]" : "bg-green-100 text-green-800"}`}>
                      {ord.status}
                    </span>
                  </div>
                </div>

                {/* Sub items list */}
                <div className="divide-y divide-[#DADADA]/30">
                  {ord.items.map((item) => (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-16 rounded-t-full rounded-b-md overflow-hidden border border-[#DADADA] shrink-0">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-sans font-bold text-[#1C1C1C]">{item.product.name}</h4>
                          <p className="text-[10px] text-[#6B6B6B]">Size: {item.selectedSize} • Color: {item.selectedColor}</p>
                          <p className="text-[10px] text-[#D4AF37] font-semibold">{item.rentalDuration} Days Rental</p>
                        </div>
                      </div>

                      {/* Action column */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <div className="text-right mr-4 hidden sm:block">
                          <p className="text-[9px] text-[#6B6B6B] uppercase font-sans">Rental Sum</p>
                          <p className="text-xs font-serif font-bold text-[#1C1C1C]">₹{item.product.rentalPrice * item.rentalDuration}</p>
                        </div>

                        {ord.status === "Currently Rented" || ord.status === "Booked" ? (
                          <button
                            id={`trigger-return-${ord.id}-${item.id}`}
                            onClick={() => {
                              setActiveReturnItem({ orderId: ord.id, item });
                              setScanResult(null);
                            }}
                            className="bg-[#303030] hover:bg-black text-white text-[10px] font-sans font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition flex items-center gap-1 cursor-pointer"
                          >
                            Return & Scan <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1 uppercase tracking-wider">
                            ✓ Returned Perfect
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & billing footer */}
                <div className="pt-3 border-t border-[#DADADA]/50 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#6B6B6B] block">Delivery Address</span>
                    <p className="text-[#1C1C1C] leading-tight font-medium mt-0.5">{ord.deliveryAddress.street}, {ord.deliveryAddress.city}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-widest text-[#6B6B6B] block">Billed Total</span>
                    <p className="font-serif font-bold text-[#1C1C1C] text-sm">₹{ord.totalAmount}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

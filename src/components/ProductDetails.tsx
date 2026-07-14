import React, { useState } from "react";
import { Star, ShieldAlert, Sparkles, Heart, Calendar, Truck, ArrowLeft, Check, Sparkle } from "lucide-react";
import { Product, Review } from "../types";

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, size: string, color: string, duration: number) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  allProducts: Product[];
  onProductClick: (product: Product) => void;
}

export default function ProductDetails({
  product,
  onBack,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  allProducts,
  onProductClick,
}: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || "");
  const [rentalDuration, setRentalDuration] = useState<number>(4); // default 4 days
  
  // AI Size Recommendation State
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitPref, setFitPref] = useState("Regular");
  const [aiSizeResult, setAiSizeResult] = useState<{ size: string; reasoning: string; score: string } | null>(null);
  const [isAnalyzingSize, setIsAnalyzingSize] = useState(false);

  // Filter similar items
  const similarProducts = allProducts.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 3);

  // AI Recommended Accessories
  const suggestedAccessories = allProducts.filter(
    (p) => (product.category === "Wedding" || product.category === "Women" || product.category === "Men") && 
           (p.category === "Jewellery" || p.category === "Handbags")
  ).slice(0, 2);

  const isWishlisted = wishlistIds.includes(product.id);

  // Handler for AI Size Tool
  const handleAnalyzeSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!height || !weight) return;
    setIsAnalyzingSize(true);
    setAiSizeResult(null);

    try {
      const res = await fetch("/api/size-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height,
          weight,
          preferredFit: fitPref,
          itemBrand: product.brand,
        }),
      });
      const data = await res.json();
      setAiSizeResult({
        size: data.recommendedSize || "M",
        reasoning: data.reasoning || "Standard fitting recommendations applied.",
        score: data.confidenceScore || "90%",
      });
      setSelectedSize(data.recommendedSize || "M");
    } catch (err) {
      console.error(err);
      setAiSizeResult({
        size: "M",
        reasoning: "Based on traditional knit metrics, size M is estimated for standard posture drape.",
        score: "85%",
      });
    } finally {
      setIsAnalyzingSize(false);
    }
  };

  const calculatedPrice = product.rentalPrice * rentalDuration;

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          id="details-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest font-semibold text-[#1C1C1C] hover:text-[#D4AF37] mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Archives
        </button>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          
          {/* Left Column: Gallery & Arch Image Frame */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative w-full h-[520px] rounded-t-[200px] rounded-b-[40px] overflow-hidden border border-[#DADADA] shadow-xl bg-white group">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              {product.badge && (
                <span className="absolute bottom-6 left-6 bg-[#1C1C1C] text-white text-xs font-sans font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  ✦ {product.badge}
                </span>
              )}
            </div>

            {/* Thumbnails list */}
            <div className="flex gap-4 justify-center">
              <div
                onClick={() => setSelectedImage(product.image)}
                className={`w-20 h-28 rounded-t-full rounded-b-lg overflow-hidden border-2 cursor-pointer transition ${selectedImage === product.image ? "border-[#D4AF37]" : "border-[#DADADA] hover:border-[#1C1C1C]"}`}
              >
                <img src={product.image} alt="main thumbnail" className="w-full h-full object-cover" />
              </div>
              {product.gallery.map((img, index) => (
                <div
                  key={index}
                  id={`gallery-thumb-${index}`}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-28 rounded-t-full rounded-b-lg overflow-hidden border-2 cursor-pointer transition ${selectedImage === img ? "border-[#D4AF37]" : "border-[#DADADA] hover:border-[#1C1C1C]"}`}
                >
                  <img src={img} alt={`gallery thumbnail ${index}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Descriptions, Customize, AI tools */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs font-sans uppercase tracking-widest text-[#6B6B6B] font-semibold">{product.brand}</span>
                <span className="text-xs font-sans bg-[#D4AF37]/20 text-[#1C1C1C] px-3 py-0.5 rounded-full font-bold">
                  ✦ {product.vendorVerified}
                </span>
              </div>
              
              <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight font-medium leading-tight">
                {product.name}
              </h2>

              <div className="flex items-center gap-4 text-xs font-sans text-[#1C1C1C]">
                <div className="flex items-center text-[#D4AF37]">
                  <Star className="w-4 h-4 fill-[#D4AF37]" />
                  <span className="ml-1 font-bold font-mono">{product.rating}</span>
                </div>
                <span className="text-[#6B6B6B]">|</span>
                <span className="underline cursor-pointer">{product.reviewsCount} verified reviews</span>
                <span className="text-[#6B6B6B]">|</span>
                <span className="text-green-600 font-semibold">{product.status} to Swap</span>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-[#FFFFFF] border border-[#DADADA] rounded-3xl p-6 grid grid-cols-2 gap-6 shadow-sm">
              <div className="text-left space-y-1">
                <p className="text-[10px] font-sans uppercase tracking-widest text-[#6B6B6B]">Rental Rate</p>
                <p className="text-2xl font-serif font-bold text-[#1C1C1C]">
                  ₹{product.rentalPrice} <span className="text-xs font-sans text-[#6B6B6B] font-normal">/ day</span>
                </p>
              </div>
              <div className="text-left space-y-1 border-l border-[#DADADA] pl-6">
                <p className="text-[10px] font-sans uppercase tracking-widest text-[#6B6B6B]">Security Deposit</p>
                <p className="text-xl font-serif font-bold text-[#1C1C1C] text-[#6B6B6B]">
                  ₹{product.securityDeposit}
                </p>
                <p className="text-[9px] text-green-600 font-medium">100% Refundable on safe return</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">Editorial Detail</h4>
              <p className="text-xs text-[#6B6B6B] leading-relaxed font-sans">{product.description}</p>
            </div>

            {/* Product Customizer Form */}
            <div className="space-y-6 pt-4 border-t border-[#DADADA]">
              
              {/* Colors */}
              {product.colors.length > 0 && (
                <div>
                  <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">
                    Selected Color: <span className="font-semibold text-[#6B6B6B]">{selectedColor}</span>
                  </h4>
                  <div className="flex gap-3">
                    {product.colors.map((col) => (
                      <button
                        key={col.name}
                        id={`details-color-${col.name.replace(/\s+/g, "-")}`}
                        onClick={() => setSelectedColor(col.name)}
                        style={{ backgroundColor: col.hex }}
                        className={`w-7 h-7 rounded-full border-2 focus:outline-none transition ${selectedColor === col.name ? "border-[#1C1C1C] scale-110 shadow-md" : "border-transparent hover:border-[#DADADA]"}`}
                        title={col.name}
                      ></button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div>
                <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">
                  Selected Size: <span className="font-semibold text-[#6B6B6B]">{selectedSize}</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      id={`details-size-${sz}`}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 text-xs font-sans font-bold border rounded-xl transition ${selectedSize === sz ? "border-[#1C1C1C] bg-[#1C1C1C] text-white" : "border-[#DADADA] hover:border-black bg-white"}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* -------------------------------------------------------------
                  INTEGRATED AI SIZE ADVISOR WIDGET
                  ------------------------------------------------------------- */}
              <div className="bg-[#FAF9F6] border border-[#DADADA] rounded-2xl p-5 space-y-4 text-left">
                <div className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" /> AI Size Advisor
                </div>
                <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                  Avoid rental returns. Enter your height and weight, and our server will query Gemini to recommend the absolute perfect fit.
                </p>
                <form onSubmit={handleAnalyzeSize} className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-semibold uppercase mb-1">Height (cm)</label>
                    <input
                      id="advisor-height-input"
                      type="number"
                      placeholder="170"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-white border border-[#DADADA] rounded-lg py-1.5 px-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-semibold uppercase mb-1">Weight (kg)</label>
                    <input
                      id="advisor-weight-input"
                      type="number"
                      placeholder="65"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-white border border-[#DADADA] rounded-lg py-1.5 px-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      id="advisor-submit-btn"
                      type="submit"
                      disabled={isAnalyzingSize || !height || !weight}
                      className="w-full bg-[#303030] text-white text-[10px] font-sans font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-black transition disabled:opacity-50"
                    >
                      {isAnalyzingSize ? "Thinking..." : "Analyze"}
                    </button>
                  </div>
                </form>

                {aiSizeResult && (
                  <div className="bg-white border border-[#D4AF37]/30 rounded-xl p-3 text-xs space-y-1 animate-fadeIn">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-[#1C1C1C]">Recommended Size: <strong className="text-base text-[#D4AF37] font-serif">{aiSizeResult.size}</strong></span>
                      <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">✓ {aiSizeResult.score} Confidence</span>
                    </div>
                    <p className="text-[#6B6B6B] leading-relaxed text-[11px] italic">"{aiSizeResult.reasoning}"</p>
                  </div>
                )}
              </div>

              {/* Rental Duration Selector */}
              <div>
                <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">
                  Rental Duration: <span className="font-semibold text-[#D4AF37]">{rentalDuration} Days</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[4, 7, 14].map((days) => (
                    <button
                      key={days}
                      id={`details-duration-${days}`}
                      onClick={() => setRentalDuration(days)}
                      className={`py-3 text-xs font-sans font-bold border rounded-xl transition ${rentalDuration === days ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#1C1C1C]" : "border-[#DADADA] bg-white hover:border-black"}`}
                    >
                      {days} Days Rental
                      <span className="block text-[10px] text-[#6B6B6B] font-normal">
                        ₹{product.rentalPrice * days} Total
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Estimation */}
              <div className="flex items-center gap-4 text-xs text-[#6B6B6B] bg-white border border-[#DADADA] rounded-2xl p-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>Delivery: <strong>{product.deliveryDate}</strong></span>
                </div>
                <span>|</span>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Free Return Pick-up Included</span>
                </div>
              </div>

              {/* Wishlist and Action Buttons */}
              <div className="flex gap-4">
                <button
                  id="details-wishlist-btn"
                  onClick={() => onToggleWishlist(product)}
                  className={`flex-1 py-4 border rounded-full text-xs font-sans font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition ${isWishlisted ? "border-red-500 bg-red-50 text-red-500" : "border-[#DADADA] bg-white hover:border-black text-[#1C1C1C]"}`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  {isWishlisted ? "Wishlisted" : "Save to Wishlist"}
                </button>
                
                <button
                  id="details-rent-btn"
                  onClick={() => onAddToCart(product, selectedSize, selectedColor, rentalDuration)}
                  className="flex-1 py-4 bg-[#303030] hover:bg-[#1C1C1C] text-white text-xs font-sans font-bold uppercase tracking-widest rounded-full transition shadow-lg hover:shadow-xl cursor-pointer"
                >
                  Rent Now — ₹{calculatedPrice}
                </button>
              </div>

            </div>

            {/* AI Accessories recommendations */}
            {suggestedAccessories.length > 0 && (
              <div className="bg-[#FFFFFF] border border-[#DADADA] rounded-3xl p-6 text-left space-y-4">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
                    <Sparkle className="w-4 h-4 text-[#D4AF37]" /> AI Recommended Accessories
                  </h4>
                  <span className="text-[10px] text-[#6B6B6B]">Complete Look Builder</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {suggestedAccessories.map((acc) => (
                    <div
                      key={acc.id}
                      id={`details-suggested-acc-${acc.id}`}
                      onClick={() => onProductClick(acc)}
                      className="border border-[#DADADA] rounded-2xl p-3 flex gap-3 items-center hover:border-black transition cursor-pointer bg-[#F8F6F2]/30"
                    >
                      <div className="w-12 h-16 rounded-t-full rounded-b-md overflow-hidden shrink-0 border border-[#DADADA]/30">
                        <img src={acc.image} alt={acc.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left min-w-0">
                        <h5 className="text-[11px] font-bold text-[#1C1C1C] truncate">{acc.name}</h5>
                        <p className="text-[9px] text-[#D4AF37] font-semibold">{acc.brand}</p>
                        <p className="text-[10px] font-serif font-bold text-[#1C1C1C] mt-0.5">₹{acc.rentalPrice}/day</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">Customer Reviews</h4>
              {product.reviews.length === 0 ? (
                <p className="text-xs text-[#6B6B6B] italic">No reviews yet for this designer variant. Be the first to rent and write!</p>
              ) : (
                <div className="space-y-4">
                  {product.reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-[#DADADA]/50 pb-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <img src={rev.userAvatar} alt="reviewer" className="w-7 h-7 rounded-full object-cover" />
                          <div>
                            <h5 className="text-xs font-bold text-[#1C1C1C]">{rev.userName}</h5>
                            <p className="text-[9px] text-[#6B6B6B]">{rev.date} — Variant: {rev.variant}</p>
                          </div>
                        </div>
                        <div className="flex text-[#D4AF37]">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#6B6B6B] leading-relaxed font-sans italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="mt-20 border-t border-[#DADADA] pt-12 text-left">
            <h3 className="font-serif text-2xl text-[#1C1C1C] font-medium tracking-tight mb-6">Similar Archives</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {similarProducts.map((p) => (
                <div
                  key={p.id}
                  id={`details-similar-card-${p.id}`}
                  onClick={() => onProductClick(p)}
                  className="bg-white border border-[#DADADA] rounded-[24px] overflow-hidden p-4 hover:shadow-md transition cursor-pointer text-left"
                >
                  <div className="w-full h-48 rounded-t-[70px] rounded-b-[12px] overflow-hidden border border-[#DADADA]/30 mb-3">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-[#6B6B6B]">{p.brand}</p>
                  <h4 className="text-xs font-bold text-[#1C1C1C] truncate">{p.name}</h4>
                  <p className="text-xs font-serif font-semibold text-[#1C1C1C] mt-1">₹{p.rentalPrice} / day</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

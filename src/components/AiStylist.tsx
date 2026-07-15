import React, { useState } from "react";
import { Sparkles, Star, ShieldCheck, ArrowRight, RotateCcw, AlertCircle, Sparkle } from "lucide-react";
import { api, ApiError } from "../api/client";

interface StyledItem {
  name: string;
  brand: string;
  description: string;
  rentalPrice: number;
}

interface StylistResult {
  outfitName: string;
  explanation: string;
  dress: StyledItem;
  shoes: StyledItem;
  handbag: StyledItem;
  jewellery: StyledItem;
  totalPrice: number;
  sustainabilityImpact: string;
}

interface AiStylistProps {
  onAddLookToCart: (
    items: { name: string; brand: string; price: number; type: string; description: string }[],
    totalPrice: number
  ) => void;
  onViewChange: (view: string) => void;
}

export default function AiStylist({ onAddLookToCart, onViewChange }: AiStylistProps) {
  // Input parameters
  const [occasion, setOccasion] = useState("Gallery Opening");
  const [budget, setBudget] = useState(60);
  const [bodyType, setBodyType] = useState("Athletic / Balanced");
  const [colors, setColors] = useState("Warm Earth Tones, Beige, Sand");
  const [style, setStyle] = useState("Luxury Minimalist & Architectural");
  const [weather, setWeather] = useState("Clear evening, mild breeze");

  // Output States
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StylistResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const occasionsList = ["Wedding Gown", "Gala Opening", "Vineyard Wedding", "Business Formal", "Summer Party", "Cocktail", "Gallery Opening"];
  const bodyTypes = ["Athletic / Balanced", "Hourglass", "Tall & Lean", "Petite", "Broad Shoulder / Oval"];
  const styleVibes = ["Luxury Minimalist & Architectural", "Classically Tailored", "Vintage Editorial", "Avant-Garde & Structural"];

  const handleGenerateOutfit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(await api.stylist({ occasion, budget, bodyType, colors, style, weather }));
    } catch (err: any) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : "Unable to reach the styling service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRentCompleteLook = () => {
    if (!result) return;
    
    // Package items to send to cart
    const itemsToBundle = [
      { name: result.dress.name, brand: result.dress.brand, price: result.dress.rentalPrice, type: "Dress", description: result.dress.description },
      { name: result.shoes.name, brand: result.shoes.brand, price: result.shoes.rentalPrice, type: "Shoes", description: result.shoes.description },
      { name: result.handbag.name, brand: result.handbag.brand, price: result.handbag.rentalPrice, type: "Handbag", description: result.handbag.description },
      { name: result.jewellery.name, brand: result.jewellery.brand, price: result.jewellery.rentalPrice, type: "Jewellery", description: result.jewellery.description },
    ];

    onAddLookToCart(itemsToBundle, result.totalPrice);
  };

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        
        {/* Title Stage */}
        <div className="text-left mb-10 border-b border-[#DADADA] pb-6 flex justify-between items-end flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
              <span>Atelier intelligence</span>
              <span className="text-[#D4AF37]">✦</span>
              <span>Gemini 3.5 Engine</span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight mt-1 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-[#D4AF37]" /> AI Personal Stylist
            </h2>
            <p className="text-xs text-[#6B6B6B] font-sans mt-1">
              Construct complete high-fashion looks tailored to your physical profile, event theme, and the weather forecast.
            </p>
          </div>
          {result && (
            <button
              id="stylist-reset-btn"
              onClick={() => setResult(null)}
              className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest font-semibold border border-[#DADADA] bg-white rounded-full px-5 py-2.5 hover:bg-[#303030] hover:text-white transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start New Look
            </button>
          )}
        </div>

        {/* Main Grid: Form Left, Results/Loader Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          
          {/* Left Column: Customization parameters Form */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#DADADA] pb-4">
                <Sparkle className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                  Configure Style Intent
                </span>
              </div>

              <form onSubmit={handleGenerateOutfit} className="space-y-4">
                {/* Occasion */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Occasion / Event Theme
                  </label>
                  <select
                    id="stylist-occasion-select"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl py-3 px-3.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#303030]"
                  >
                    {occasionsList.map((oc) => (
                      <option key={oc} value={oc}>{oc}</option>
                    ))}
                    <option value="Contemporary Art Gala">Contemporary Art Gala</option>
                    <option value="Bespoke Ritz Cocktail">Bespoke Ritz Cocktail</option>
                  </select>
                </div>

                {/* Budget slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                      Max Rental Price / Day
                    </label>
                    <span className="text-xs font-mono font-bold text-[#1C1C1C]">₹{budget}</span>
                  </div>
                  <input
                    id="stylist-budget-slider"
                    type="range"
                    min="20"
                    max="150"
                    step="5"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full accent-[#303030] bg-[#FAF9F6] h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#6B6B6B] font-mono">
                    <span>₹20</span>
                    <span>₹80</span>
                    <span>₹150</span>
                  </div>
                </div>

                {/* Body Type */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Physical Profile / Body Type
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {bodyTypes.map((bt) => (
                      <button
                        key={bt}
                        id={`stylist-body-${bt.replace(/\s+/g, "-")}`}
                        type="button"
                        onClick={() => setBodyType(bt)}
                        className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition ${bodyType === bt ? "border-[#1C1C1C] bg-[#1C1C1C] text-white font-semibold" : "border-[#DADADA] hover:border-[#1C1C1C] bg-white"}`}
                      >
                        {bodyType === bt ? "✦ " : ""} {bt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Preferred Color Tones
                  </label>
                  <input
                    id="stylist-colors-input"
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Warm earth tones, beige, sand, alabaster"
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl py-3 px-3.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#303030]"
                  />
                  <span className="text-[10px] text-[#6B6B6B] font-sans block">Use comma-separated words.</span>
                </div>

                {/* Preferred style vibe */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Stylistic Silhouette
                  </label>
                  <select
                    id="stylist-style-select"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl py-3 px-3.5 text-xs text-[#1C1C1C] focus:outline-none"
                  >
                    {styleVibes.map((vibe) => (
                      <option key={vibe} value={vibe}>{vibe}</option>
                    ))}
                  </select>
                </div>

                {/* Local Weather */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Local Forecast / Weather
                  </label>
                  <input
                    id="stylist-weather-input"
                    type="text"
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    placeholder="Sunset gala, breezy mid 70s"
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl py-3 px-3.5 text-xs text-[#1C1C1C] focus:outline-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  id="stylist-generate-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#303030] hover:bg-black text-white text-xs font-sans font-bold uppercase tracking-widest py-4 rounded-full transition shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? "Generating Complete Look..." : "Generate Custom Outfit Look"}
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Loading or Results */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            
            {/* 1. INITIAL PLACEHOLDER */}
            {!isLoading && !result && !error && (
              <div className="bg-white border border-[#DADADA] rounded-[32px] p-16 text-center space-y-5 shadow-sm min-h-[500px] flex flex-col justify-center items-center">
                <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#DADADA] flex items-center justify-center text-2xl animate-pulse text-[#D4AF37]">
                  ✦
                </div>
                <h3 className="font-serif text-2xl text-[#1C1C1C]">Awaiting Style Blueprint</h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto leading-relaxed">
                  Adjust the style parameters in the left panel and click generate. StyleSwap will calibrate a designer ensemble including dress, jewelry, and coordinate items.
                </p>
                <div className="flex gap-2 text-[10px] text-[#6B6B6B] font-mono tracking-wider">
                  <span>✦ ZARA ARCHIVES</span>
                  <span>•</span>
                  <span>✦ COS TAILORING</span>
                  <span>•</span>
                  <span>✦ AESOP MINIMALISM</span>
                </div>
              </div>
            )}

            {/* 2. HIGH-END SARTORIAL LOADER */}
            {isLoading && (
              <div className="bg-white border border-[#DADADA] rounded-[32px] p-16 text-center space-y-6 shadow-sm min-h-[500px] flex flex-col justify-center items-center">
                <div className="relative">
                  {/* Styled scanning rings */}
                  <div className="w-20 h-20 rounded-full border-4 border-t-[#D4AF37] border-r-transparent border-b-[#303030] border-l-transparent animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-[#D4AF37] absolute top-7 left-7 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-medium text-[#1C1C1C]">StyleSwap Generative Atelier</h3>
                  <p className="text-xs text-[#6B6B6B] tracking-wider uppercase">Scrutinizing physical matrix & local forecast...</p>
                </div>
                <div className="max-w-xs space-y-1.5 text-center text-[10px] font-mono text-[#6B6B6B]">
                  <p className="animate-pulse">⏳ Calling server-side Gemini 3.5 Flash...</p>
                  <p>✓ Calibrating structural drop jewelry...</p>
                  <p>✓ Estimating carbon offsets and linen drapes...</p>
                </div>
              </div>
            )}

            {/* 3. GENERATION OUTCOME RESULT */}
            {result && (
              <div className="space-y-8 animate-slideUp">
                
                {/* Header overview card */}
                <div className="bg-[#D3C6B8] border border-[#DADADA] rounded-[32px] p-8 space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-sans uppercase tracking-widest bg-white/80 px-2.5 py-0.5 rounded text-[#1C1C1C] font-bold">
                        ✦ ATELIER COORDINATE BUNDLE
                      </span>
                      <h3 className="font-serif text-3xl text-[#1C1C1C] mt-2 tracking-tight">
                        {result.outfitName}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-[#6B6B6B]">Look Bundle Rental</p>
                      <p className="text-2xl font-serif font-bold text-[#1C1C1C]">₹{result.totalPrice} <span className="text-xs font-sans text-[#6B6B6B] font-normal">/ day</span></p>
                    </div>
                  </div>
                  <p className="text-xs text-[#1C1C1C]/95 leading-relaxed font-sans border-t border-[#1C1C1C]/15 pt-4">
                    "{result.explanation}"
                  </p>
                  <div className="text-[10px] font-mono text-[#1C1C1C] font-bold bg-white/40 rounded-xl px-4 py-2.5 inline-block">
                    🌱 Ecoluxe Benefit: {result.sustainabilityImpact}
                  </div>
                </div>

                {/* 4 Coordinate Card items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Dress */}
                  <div className="bg-white border border-[#DADADA] rounded-2xl p-4 flex flex-col justify-between h-56 text-left">
                    <div>
                       <span className="text-[9px] font-sans uppercase tracking-widest text-[#D4AF37] font-bold">✦ Dress</span>
                      <h4 className="text-xs font-bold text-[#1C1C1C] truncate mt-1">{result.dress.name}</h4>
                      <p className="text-[10px] text-[#6B6B6B]">{result.dress.brand}</p>
                      <p className="text-[10px] text-[#6B6B6B] line-clamp-3 mt-1.5 leading-relaxed">{result.dress.description}</p>
                    </div>
                    <p className="text-xs font-serif font-bold text-[#1C1C1C] pt-2 border-t border-[#FAF9F6]">₹{result.dress.rentalPrice}/day</p>
                  </div>

                  {/* Footwear */}
                  <div className="bg-white border border-[#DADADA] rounded-2xl p-4 flex flex-col justify-between h-56 text-left">
                    <div>
                      <span className="text-[9px] font-sans uppercase tracking-widest text-[#D4AF37] font-bold">✦ Footwear</span>
                      <h4 className="text-xs font-bold text-[#1C1C1C] truncate mt-1">{result.shoes.name}</h4>
                      <p className="text-[10px] text-[#6B6B6B]">{result.shoes.brand}</p>
                      <p className="text-[10px] text-[#6B6B6B] line-clamp-3 mt-1.5 leading-relaxed">{result.shoes.description}</p>
                    </div>
                    <p className="text-xs font-serif font-bold text-[#1C1C1C] pt-2 border-t border-[#FAF9F6]">₹{result.shoes.rentalPrice}/day</p>
                  </div>

                  {/* Handbag */}
                  <div className="bg-white border border-[#DADADA] rounded-2xl p-4 flex flex-col justify-between h-56 text-left">
                    <div>
                      <span className="text-[9px] font-sans uppercase tracking-widest text-[#D4AF37] font-bold">✦ Handbag</span>
                      <h4 className="text-xs font-bold text-[#1C1C1C] truncate mt-1">{result.handbag.name}</h4>
                      <p className="text-[10px] text-[#6B6B6B]">{result.handbag.brand}</p>
                      <p className="text-[10px] text-[#6B6B6B] line-clamp-3 mt-1.5 leading-relaxed">{result.handbag.description}</p>
                    </div>
                    <p className="text-xs font-serif font-bold text-[#1C1C1C] pt-2 border-t border-[#FAF9F6]">₹{result.handbag.rentalPrice}/day</p>
                  </div>

                  {/* Jewelry */}
                  <div className="bg-white border border-[#DADADA] rounded-2xl p-4 flex flex-col justify-between h-56 text-left">
                    <div>
                      <span className="text-[9px] font-sans uppercase tracking-widest text-[#D4AF37] font-bold">✦ Jewelry</span>
                      <h4 className="text-xs font-bold text-[#1C1C1C] truncate mt-1">{result.jewellery.name}</h4>
                      <p className="text-[10px] text-[#6B6B6B]">{result.jewellery.brand}</p>
                      <p className="text-[10px] text-[#6B6B6B] line-clamp-3 mt-1.5 leading-relaxed">{result.jewellery.description}</p>
                    </div>
                    <p className="text-xs font-serif font-bold text-[#1C1C1C] pt-2 border-t border-[#FAF9F6]">₹{result.jewellery.rentalPrice}/day</p>
                  </div>
                </div>

                {/* Bundle Call to Action */}
                <div className="bg-[#1C1C1C] text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-left">
                    <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#D4AF37]">
                      Complete Look Bundle Advantage
                    </h4>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      Rent all 4 pieces together. StyleSwap waives the second accessory security deposit.
                    </p>
                  </div>
                  <button
                    id="rent-complete-look-btn"
                    onClick={handleRentCompleteLook}
                    className="bg-[#D4AF37] text-[#1C1C1C] font-sans font-bold uppercase tracking-widest text-xs px-8 py-3.5 rounded-full hover:bg-white transition flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    Rent Complete Look <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* Error Fallback Panel */}
            {error && (
              <div className="bg-[#FAF9F6] border border-red-200 rounded-3xl p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h4 className="font-serif text-xl text-[#1C1C1C]">Atelier Offline</h4>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto leading-relaxed">
                  {error}
                </p>
                <button
                  id="error-styling-btn"
                  onClick={handleGenerateOutfit}
                  className="bg-[#303030] text-white text-xs font-sans font-semibold uppercase tracking-widest px-6 py-2.5 rounded-full hover:bg-black transition"
                >
                  Retry Connection
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

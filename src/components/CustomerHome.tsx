import React, { useState } from "react";
import { Sparkles, ArrowRight, Star, Heart, Flame, ShieldAlert, Award, ArrowLeft } from "lucide-react";
import { Product } from "../types";
import { CATEGORIES } from "../data";

interface CustomerHomeProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onViewChange: (view: string) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
}

export default function CustomerHome({
  products,
  onProductClick,
  onViewChange,
  onToggleWishlist,
  wishlistIds,
}: CustomerHomeProps) {
  const [onboardingStep, setOnboardingStep] = useState<number | null>(0); // 0 = Welcome/Splash, 1 = Onboarding 1, 2 = Onboarding 2, 3 = Onboarding 3, null = dismissed

  const onboardingSlides = [
    {
      title: "Affordable Luxury",
      tagline: "Swap Your Style, Not Your Budget.",
      description: "Gain unlimited access to premium Zara, COS, and custom bridal archives at a fraction of their retail price. Experience high fashion without the footprint of heavy costs.",
      image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=600",
    },
    {
      title: "AI Outfit Recommendations",
      tagline: "Your Personal Atelier, Powered by Gemini.",
      description: "Input your body type, occasion, style preferences, and current local weather to generate complete outfits with calibrated accessories in real time.",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
    },
    {
      title: "Sustainable Fashion",
      tagline: "Rent. Wear. Swap. Repeat.",
      description: "Join the circular economy. Every rental reduces landfill textile load and reduces fresh water use. Track your personal sustainability score on your profile.",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
    }
  ];

  // Filter products for various rows
  const trendingProducts = products.filter((p) => p.badge === "Trending" || p.badge === "Most Rented");
  const aiRecommended = products.filter((p) => p.badge === "Premium" || p.badge === "Customer Favorite");
  const newArrivals = products.filter((p) => p.badge === "New").slice(0, 4);

  return (
    <div className="bg-[#F8F6F2] min-h-screen pb-20 animate-fadeIn">
      {/* 1. STUNNING SPLASH & ONBOARDING STAGE */}
      {onboardingStep !== null && (
        <div className="bg-[#D3C6B8] border-b border-[#DADADA] py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Slide Text Content */}
            <div className="space-y-6 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans tracking-widest text-[#1C1C1C] uppercase bg-[#FAF9F6] px-3 py-1 rounded-full font-bold">
                  ✦ Onboarding {onboardingStep + 1} of 3
                </span>
                <span className="text-xs text-[#6B6B6B] font-medium font-serif italic">StyleSwap Elite Introductory Tour</span>
              </div>
              
              <h2 className="font-serif text-4xl lg:text-5xl text-[#1C1C1C] tracking-tight leading-tight font-medium">
                {onboardingSlides[onboardingStep].title}
              </h2>
              <p className="text-sm font-sans font-semibold text-[#D4AF37] uppercase tracking-widest">
                "{onboardingSlides[onboardingStep].tagline}"
              </p>
              <p className="text-sm text-[#1C1C1C]/80 leading-relaxed font-sans max-w-lg">
                {onboardingSlides[onboardingStep].description}
              </p>

              <div className="flex items-center gap-4 pt-4">
                {onboardingStep > 0 ? (
                  <button
                    id="onboarding-back-btn"
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest font-semibold text-[#1C1C1C] border border-[#1C1C1C] rounded-full px-5 py-2.5 hover:bg-[#FAF9F6]/20 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                ) : (
                  <button
                    id="onboarding-skip-btn"
                    onClick={() => setOnboardingStep(null)}
                    className="text-xs font-sans uppercase tracking-widest font-medium text-[#1C1C1C] hover:underline"
                  >
                    Skip Intro
                  </button>
                )}

                {onboardingStep < 2 ? (
                  <button
                    id="onboarding-next-btn"
                    onClick={() => setOnboardingStep(onboardingStep + 1)}
                    className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest font-semibold text-white bg-[#303030] rounded-full px-6 py-3 hover:bg-[#1C1C1C] transition shadow-md"
                  >
                    Next Concept <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    id="onboarding-start-btn"
                    onClick={() => setOnboardingStep(null)}
                    className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest font-semibold text-white bg-[#1C1C1C] rounded-full px-8 py-3.5 hover:bg-[#303030] transition shadow-lg ring-2 ring-[#D4AF37]/50"
                  >
                    Start Swapping <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  </button>
                )}
              </div>
            </div>

            {/* Slide Arch Frame Image */}
            <div className="flex justify-center">
              <div className="relative w-72 h-96 lg:w-80 lg:h-[420px] rounded-t-[160px] rounded-b-[40px] overflow-hidden border-4 border-[#F8F6F2] shadow-2xl transition-all duration-700 hover:scale-[1.02]">
                <img
                  src={onboardingSlides[onboardingStep].image}
                  alt={onboardingSlides[onboardingStep].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LUXURY HERO STAGE (Zara, COS aesthetic) */}
      <section className="max-w-7xl mx-auto px-6 pt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left column: serif typography & key tags */}
        <div className="lg:col-span-5 text-left space-y-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
            <span>✦ Luxury Circular Atelier</span>
            <span className="text-[#D4AF37]">✦</span>
            <span>StyleSwap Premium</span>
          </div>

          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-[#1C1C1C] tracking-tight leading-[1.05] font-light">
            Less <br />
            is <br />
            <span className="font-serif italic font-medium text-[#D4AF37]">more.</span>
          </h2>

          <p className="text-sm text-[#6B6B6B] font-sans leading-relaxed max-w-sm">
            Swap your wardrobe, reduce your footprint, and explore high-end couture rented seamlessly for wedding days, galas, and bespoke styling encounters.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              id="hero-explore-btn"
              onClick={() => onViewChange("browse")}
              className="px-8 py-3.5 border border-[#303030] rounded-full text-xs font-sans font-semibold uppercase tracking-widest text-[#1C1C1C] hover:bg-[#303030] hover:text-[#FFFFFF] transition"
            >
              Explore Rentals
            </button>
            <button
              id="hero-stylist-btn"
              onClick={() => onViewChange("stylist")}
              className="px-8 py-3.5 bg-[#303030] text-[#FFFFFF] hover:bg-[#1C1C1C] transition rounded-full text-xs font-sans font-semibold uppercase tracking-widest flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" /> AI Personal Stylist
            </button>
          </div>
        </div>

        {/* Right column: Arch-shaped stacked editorial layout */}
        <div className="lg:col-span-7 grid grid-cols-12 gap-6 relative">
          <div className="col-span-7 flex flex-col justify-end">
            <div className="w-full h-80 lg:h-[440px] rounded-t-[140px] rounded-b-[30px] overflow-hidden shadow-xl border border-[#DADADA] relative group">
              <img
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600"
                alt="COS tailoring style"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl text-left border border-[#DADADA]/30">
                <p className="text-[10px] text-[#6B6B6B] uppercase font-sans tracking-widest font-semibold">Bouclé Blazer</p>
                <p className="text-xs font-serif text-[#1C1C1C]">COS Premium — ₹18/day</p>
              </div>
            </div>
          </div>
          
          <div className="col-span-5 space-y-6">
            <div className="w-full h-56 lg:h-[240px] rounded-t-[120px] rounded-b-[20px] overflow-hidden shadow-lg border border-[#DADADA] relative group">
              <img
                src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600"
                alt="Jewellery"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            
            <div className="bg-[#D3C6B8] p-6 rounded-3xl text-left border border-[#DADADA]/20 space-y-3">
              <span className="text-[10px] font-sans uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded text-[#1C1C1C] font-bold">ECO STATS</span>
              <p className="text-xs font-serif text-[#1C1C1C] font-medium leading-relaxed">
                "Renting standard couture saves up to 80% water waste compared to fast-fashion retail."
              </p>
              <p className="text-[9px] font-sans uppercase tracking-widest text-[#6B6B6B]">✦ Global Green Textiles</p>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND MANIFESTO CENTERPIECE - "Swap your style, not your budget" */}
      <section className="w-full bg-[#FAF9F6] border-y border-[#DADADA]/60 my-16 py-24 lg:py-32 overflow-hidden relative">
        {/* Subtle decorative lettering to give it a high-end designer visual presence */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2 text-[150px] font-serif text-[#1C1C1C]/[0.02] font-light select-none pointer-events-none hidden xl:block uppercase tracking-[0.2em]">
          Style
        </div>
        <div className="absolute top-1/2 right-10 -translate-y-1/2 text-[150px] font-serif text-[#1C1C1C]/[0.02] font-light select-none pointer-events-none hidden xl:block uppercase tracking-[0.2em]">
          Value
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <div className="flex items-center justify-center gap-3">
            <span className="h-[1px] w-12 bg-[#D4AF37]" />
            <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#D4AF37] font-bold">
              The StyleSwap Creed
            </span>
            <span className="h-[1px] w-12 bg-[#D4AF37]" />
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#1C1C1C] tracking-tight leading-tight font-light italic">
            "Swap your style, <span className="font-serif text-[#D4AF37] not-italic font-bold">not your budget.</span>"
          </h2>

          <p className="text-sm sm:text-base text-[#6B6B6B] font-light max-w-2xl mx-auto leading-relaxed font-sans">
            Circular elegance. Authentic archives. Our design philosophy pairs high-end atelier collections with accessible rental structures, enabling you to curate without boundaries and wear premium coordinates responsibly.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#1C1C1C] font-semibold bg-white px-5 py-2.5 rounded-full border border-[#DADADA] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Curated & Inspected
            </div>
            <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#1C1C1C] font-semibold bg-white px-5 py-2.5 rounded-full border border-[#DADADA] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" /> AI Calibrated Fit
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES HORIZONTAL NAVIGATION TRACK */}
      <section className="max-w-7xl mx-auto px-6 pt-24 text-left">
        <div className="flex justify-between items-baseline mb-8">
          <div>
            <h3 className="font-serif text-2xl lg:text-3xl text-[#1C1C1C] font-medium tracking-tight">
              Curated Collections
            </h3>
            <p className="text-xs text-[#6B6B6B] font-sans uppercase tracking-widest mt-1">
              Select category archives to initiate sorting
            </p>
          </div>
          <button
            id="categories-all-btn"
            onClick={() => onViewChange("browse")}
            className="text-xs font-sans uppercase tracking-widest font-semibold text-[#1C1C1C] hover:text-[#D4AF37] transition flex items-center gap-1"
          >
            All Archives <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              id={`cat-card-${cat.id}`}
              onClick={() => {
                // To filter we click and route to browse
                onViewChange("browse");
              }}
              className="bg-white hover:bg-[#D3C6B8] border border-[#DADADA] rounded-2xl p-4 text-center cursor-pointer transition duration-300 group shadow-sm flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-full bg-[#F8F6F2] group-hover:bg-white flex items-center justify-center mx-auto mb-2 transition">
                <span className="text-[#1C1C1C] font-serif text-sm font-semibold">✦</span>
              </div>
              <div>
                <h4 className="text-xs font-sans font-semibold text-[#1C1C1C] group-hover:text-[#1C1C1C] transition truncate">
                  {cat.name}
                </h4>
                <p className="text-[10px] text-[#6B6B6B] group-hover:text-[#1C1C1C]/70 transition">
                  {cat.count} items
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AI STYLIST BANNER WITH SPARKS */}
      <section className="max-w-7xl mx-auto px-6 pt-24">
        <div className="bg-[#1C1C1C] text-white rounded-[32px] p-8 lg:p-12 text-left relative overflow-hidden shadow-xl border border-[#DADADA]/25 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Subtle glowing orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="md:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Generative AI Integration
            </div>
            <h3 className="font-serif text-3xl lg:text-4xl text-[#FAF9F6] tracking-tight leading-snug">
              Struggling to curate? <br />
              Let our <span className="font-serif italic text-[#D4AF37]">AI Stylist</span> design your entire coordinate look.
            </h3>
            <p className="text-xs text-[#6B6B6B] font-sans leading-relaxed max-w-xl">
              Specify your event theme, budget limits, preferred tones, body metrics, and the local forecast. Our server calls Gemini to instantly calibrate a custom outfit set complete with matching jewelry, footwear, and accessories.
            </p>
          </div>

          <div className="md:col-span-4 flex justify-start md:justify-end">
            <button
              id="ai-stylist-banner-btn"
              onClick={() => onViewChange("stylist")}
              className="bg-[#D4AF37] text-[#1C1C1C] hover:bg-[#FAF9F6] font-sans font-bold uppercase tracking-wider text-xs px-8 py-4 rounded-full transition flex items-center gap-2 shadow-lg"
            >
              Consult AI Stylist <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. DYNAMIC HORIZONTAL SCROLL: TRENDING RENTALS */}
      <section className="max-w-7xl mx-auto px-6 pt-24 text-left">
        <div className="flex justify-between items-baseline mb-8">
          <div>
            <h3 className="font-serif text-2xl lg:text-3xl text-[#1C1C1C] font-medium tracking-tight flex items-center gap-1.5">
              <Flame className="w-6 h-6 text-[#D4AF37]" /> Trending Rentals
            </h3>
            <p className="text-xs text-[#6B6B6B] font-sans uppercase tracking-widest mt-1">
              Currently popular in circular fashion communities
            </p>
          </div>
          <button
            id="browse-trending-btn"
            onClick={() => onViewChange("browse")}
            className="text-xs font-sans uppercase tracking-widest font-semibold text-[#1C1C1C] hover:text-[#D4AF37] transition flex items-center gap-1"
          >
            All Trending <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trendingProducts.map((prod) => {
            const isWishlisted = wishlistIds.includes(prod.id);
            return (
              <div
                key={prod.id}
                id={`trending-prod-card-${prod.id}`}
                className="bg-white border border-[#DADADA] rounded-[28px] overflow-hidden group shadow-sm hover:shadow-md transition duration-300 flex flex-col h-[480px] relative"
              >
                {/* Wishlist overlay button */}
                <button
                  id={`wishlist-toggle-${prod.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(prod);
                  }}
                  className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#DADADA] flex items-center justify-center hover:bg-white transition cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-[#1C1C1C]"}`} />
                </button>

                {/* Oval Arch Image Frame on top */}
                <div 
                  onClick={() => onProductClick(prod)}
                  className="p-4 pb-0 flex-1 cursor-pointer"
                >
                  <div className="w-full h-72 rounded-t-[100px] rounded-b-[20px] overflow-hidden border border-[#DADADA]/30 relative">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {prod.badge && (
                      <span className="absolute bottom-3 left-3 bg-[#1C1C1C] text-white text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        ✦ {prod.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Panel */}
                <div className="p-5 text-left flex flex-col justify-between">
                  <div onClick={() => onProductClick(prod)} className="cursor-pointer">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-sans">{prod.brand}</p>
                      <div className="flex items-center gap-0.5 text-xs text-[#1C1C1C] font-semibold">
                        <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" /> {prod.rating}
                      </div>
                    </div>
                    <h4 className="text-xs font-sans font-bold text-[#1C1C1C] truncate">{prod.name}</h4>
                    <p className="text-[11px] text-[#6B6B6B] truncate mt-1">{prod.vendorName}</p>
                  </div>

                  <div className="pt-3 border-t border-[#DADADA]/50 mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-[#6B6B6B] font-sans">Rental</p>
                      <p className="text-sm font-serif font-semibold text-[#1C1C1C]">
                        ₹{prod.rentalPrice} <span className="text-xs font-sans text-[#6B6B6B] font-normal">/ day</span>
                      </p>
                    </div>
                    <button
                      id={`rent-now-card-btn-${prod.id}`}
                      onClick={() => onProductClick(prod)}
                      className="bg-[#303030] text-white text-[10px] font-sans font-bold uppercase tracking-wider px-4 py-2.5 rounded-full hover:bg-[#1C1C1C] transition cursor-pointer"
                    >
                      Rent Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. AI RECOMMENDED LUXURY SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-24 text-left">
        <div className="flex justify-between items-baseline mb-8">
          <div>
            <h3 className="font-serif text-2xl lg:text-3xl text-[#1C1C1C] font-medium tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" /> AI Recommended Favorites
            </h3>
            <p className="text-xs text-[#6B6B6B] font-sans uppercase tracking-widest mt-1">
              Custom suggestions reflecting premium fabrics and architectural jewelry
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiRecommended.slice(0, 3).map((prod) => {
            const isWishlisted = wishlistIds.includes(prod.id);
            return (
              <div
                key={prod.id}
                id={`ai-fav-card-${prod.id}`}
                className="bg-white border border-[#DADADA] rounded-3xl p-5 hover:border-[#1C1C1C] transition duration-300 relative flex flex-col md:flex-row gap-5 items-center"
              >
                {/* Image left */}
                <div 
                  onClick={() => onProductClick(prod)}
                  className="w-24 h-36 rounded-t-full rounded-b-[12px] overflow-hidden shrink-0 border border-[#DADADA]/30 cursor-pointer"
                >
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                </div>

                {/* Content right */}
                <div className="flex-1 text-left flex flex-col justify-between h-36">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-sans font-bold">✦ AI MATCH</span>
                      <button 
                        id={`wishlist-fav-toggle-${prod.id}`}
                        onClick={() => onToggleWishlist(prod)} 
                        className="text-[#6B6B6B] hover:text-[#D4AF37] transition"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                    </div>
                    <h4 
                      onClick={() => onProductClick(prod)}
                      className="text-xs font-sans font-bold text-[#1C1C1C] line-clamp-1 cursor-pointer mt-1 hover:underline"
                    >
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-[#6B6B6B] line-clamp-2 mt-1 leading-relaxed">{prod.description}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-[#DADADA]/40 mt-2">
                    <span className="text-xs font-serif font-semibold text-[#1C1C1C]">₹{prod.rentalPrice}/day</span>
                    <button
                      id={`view-fav-btn-${prod.id}`}
                      onClick={() => onProductClick(prod)}
                      className="text-[10px] font-sans uppercase tracking-widest font-semibold text-[#1C1C1C] hover:underline flex items-center gap-1"
                    >
                      Customize <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. REVIEWS & CUSTOMER FEEDBACK (Zara styled) */}
      <section className="max-w-7xl mx-auto px-6 pt-24 text-left">
        <h3 className="font-serif text-2xl lg:text-3xl text-[#1C1C1C] font-medium tracking-tight mb-2">
          Circular Community Reviews
        </h3>
        <p className="text-xs text-[#6B6B6B] font-sans uppercase tracking-widest mb-8">
          Words from our eco-conscious style swappers
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#FFFFFF] border border-[#DADADA] rounded-[24px] p-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                alt="Reviewer"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="text-xs font-sans font-bold text-[#1C1C1C]">Charlotte Ross</h4>
                <p className="text-[10px] text-[#6B6B6B]">Gold Tier Member — 28 swaps</p>
              </div>
            </div>
            <div className="flex text-[#D4AF37]">
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
            </div>
            <p className="text-xs text-[#1C1C1C]/80 leading-relaxed font-sans italic">
              "The Silk Wedding Gown was flawless! I rented it for a photo shoot and everyone assumed it was a thousand-dollar purchase. The return was so simple, they picked it up from my door!"
            </p>
            <p className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider">✦ Verified Bridal Swap</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#DADADA] rounded-[24px] p-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
                alt="Reviewer"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="text-xs font-sans font-bold text-[#1C1C1C]">Marcus Sterling</h4>
                <p className="text-[10px] text-[#6B6B6B]">Premium Tier Member — 14 swaps</p>
              </div>
            </div>
            <div className="flex text-[#D4AF37]">
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
            </div>
            <p className="text-xs text-[#1C1C1C]/80 leading-relaxed font-sans italic">
              "First time trying linen rentals for a summer event. The AI sizing was incredibly precise. The suit arrived in pristine state, smelling faintly of lavender. Extremely professional service."
            </p>
            <p className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider">✦ Verified Men's Suit Swap</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#DADADA] rounded-[24px] p-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
                alt="Reviewer"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="text-xs font-sans font-bold text-[#1C1C1C]">Helena G.</h4>
                <p className="text-[10px] text-[#6B6B6B]">Silver Tier Member — 8 swaps</p>
              </div>
            </div>
            <div className="flex text-[#D4AF37]">
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 text-[#DADADA]" />
            </div>
            <p className="text-xs text-[#1C1C1C]/80 leading-relaxed font-sans italic">
              "The gold earrings were beautiful but what really sold me was the AI Stylist recommendation. It compiled a complete look that had my husband complement me all night. Highly recommended."
            </p>
            <p className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider">✦ Verified Accessory Swap</p>
          </div>
        </div>
      </section>
    </div>
  );
}

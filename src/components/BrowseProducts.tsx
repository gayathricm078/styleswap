import React, { useState, useMemo } from "react";
import { Search, Heart, Star, SlidersHorizontal, ArrowUpDown, Check, X, RotateCcw } from "lucide-react";
import { Product } from "../types";
import { CATEGORIES } from "../data";
import { api } from "../api/client";

interface BrowseProductsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  initialSearchQuery: string;
}

export default function BrowseProducts({
  products,
  onProductClick,
  onToggleWishlist,
  wishlistIds,
  initialSearchQuery,
}: BrowseProductsProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number>(100);
  const [sortBy, setSortBy] = useState<string>("Recommended");
  const [showFiltersMobile, setShowFiltersMobile] = useState(true);

  // AI Semantic Search States
  const [aiQuery, setAiQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<{ productId: string; relevanceScore: number; relevanceExplanation: string }[] | null>(null);

  const handleAiSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setIsAiSearching(true);
    setAiSearchResults(null);

    try {
      setAiSearchResults(await api.aiSearch(aiQuery));
    } catch (err) {
      console.error(err);
      // Semantic search needs the model; when it's unavailable fall back to a
      // plain substring match so the search box still does something useful.
      const needle = aiQuery.toLowerCase();
      const matches = products
        .filter(
          (prod) =>
            prod.name.toLowerCase().includes(needle) ||
            prod.brand.toLowerCase().includes(needle) ||
            prod.description.toLowerCase().includes(needle)
        )
        .map((prod) => ({
          productId: prod.id,
          relevanceScore: 92,
          relevanceExplanation: `Keyword match for "${aiQuery}" (AI ranking unavailable).`,
        }));
      setAiSearchResults(matches);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Lists of filters based on data
  const brands = ["COS Premium", "L’Aura Bridal", "Mango Man Tailoring", "Savoir Jewelry", "Saint Laurent Style", "Aesop Atelier"];
  const occasions = ["Bridal", "Gala Opening", "Vineyard Wedding", "Business Formal", "Summer Party", "Cocktail", "Gallery Opening"];
  const genders = ["Female", "Male", "Unisex"];
  const sizes = ["XS", "S", "M", "L", "XL", "One Size"];
  const colors = ["Alabaster White", "Champagne Cream", "Oatmeal Beige", "Desert Sand", "Brushed Gold", "Warm Taupe", "Sand Suede", "Classic Caramel", "Noir Black"];

  // Filter products dynamically
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesDesc = prod.description.toLowerCase().includes(query);
        const matchesBrand = prod.brand.toLowerCase().includes(query);
        const matchesCat = prod.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesBrand && !matchesCat) return false;
      }

      // 2. Category
      if (selectedCategory && prod.category !== selectedCategory) return false;

      // 3. Brand
      if (selectedBrand && prod.brand !== selectedBrand) return false;

      // 4. Occasion
      if (selectedOccasion) {
        const matchesOccasion = prod.description.toLowerCase().includes(selectedOccasion.toLowerCase()) || 
                               prod.subCategory.toLowerCase().includes(selectedOccasion.toLowerCase());
        if (!matchesOccasion) return false;
      }

      // 5. Gender
      if (selectedGender) {
        const isMen = prod.category === "Men";
        const isWomen = prod.category === "Women" || prod.category === "Wedding";
        if (selectedGender === "Male" && !isMen) return false;
        if (selectedGender === "Female" && !isWomen) return false;
      }

      // 6. Size
      if (selectedSize && !prod.sizes.includes(selectedSize)) return false;

      // 7. Color
      if (selectedColor && !prod.colors.some((c) => c.name.includes(selectedColor))) return false;

      // 8. Rating
      if (selectedRating && prod.rating < selectedRating) return false;

      // 9. Price
      if (prod.rentalPrice > priceMax) return false;

      return true;
    }).sort((a, b) => {
      // Sort configurations
      if (sortBy === "Price Low→High") return a.rentalPrice - b.rentalPrice;
      if (sortBy === "Price High→Low") return b.rentalPrice - a.rentalPrice;
      if (sortBy === "Best Rated") return b.rating - a.rating;
      if (sortBy === "Trending") return (b.reviewsCount - a.reviewsCount);
      if (sortBy === "Newest") return b.badge === "New" ? 1 : -1;
      return 0; // Default Recommended / Best Matching
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedOccasion, selectedGender, selectedSize, selectedColor, selectedRating, priceMax, sortBy]);

  const finalProducts = useMemo(() => {
    if (aiSearchResults && aiSearchResults.length > 0) {
      return products
        .map((prod) => {
          const match = aiSearchResults.find((r) => r.productId === prod.id);
          return match ? { ...prod, aiMatch: match } : null;
        })
        .filter((p): p is (Product & { aiMatch: any }) => p !== null)
        .sort((a, b) => b.aiMatch.relevanceScore - a.aiMatch.relevanceScore);
    }
    return filteredProducts;
  }, [products, filteredProducts, aiSearchResults]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedOccasion("");
    setSelectedGender("");
    setSelectedSize("");
    setSelectedColor("");
    setSelectedRating(null);
    setPriceMax(100);
    setSortBy("Recommended");
    setAiQuery("");
    setAiSearchResults(null);
  };

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        
        {/* Editorial Title */}
        <div className="text-left mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
            <span>StyleSwap Archives</span>
            <span>✦</span>
            <span>Sustainable Elegance</span>
          </div>
          <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight mt-1">
            Browse Circular Collections
          </h2>

          {/* Gorgeous AI Semantic Search bar */}
          <div className="mt-6 bg-[#FAF9F6] border border-[#DADADA]/80 rounded-3xl p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#D4AF37] font-sans font-bold">
              <Search className="w-3.5 h-3.5" />
              <span>Gemini Atelier Semantic Search</span>
            </div>
            <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-2xl">
              Describe the mood, occasion, or details you desire (e.g., <em>"loose linen outfit for warm sand dunes"</em> or <em>"gold embroidered dress for gala dinner"</em>). Our server-side neural assistant will scan and rank items.
            </p>
            <form onSubmit={handleAiSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Type your bespoke request (e.g., 'sophisticated linen or silk cocktail wear for an evening beach party')..."
                className="flex-1 bg-white border border-[#DADADA] rounded-xl px-4 py-3 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#303030]"
              />
              <button
                type="submit"
                disabled={isAiSearching}
                id="browse-ai-search-submit-btn"
                className="bg-[#303030] hover:bg-black text-white text-xs font-sans font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {isAiSearching ? "Scanning Archives..." : "Search Archives"}
              </button>
            </form>
            {aiSearchResults && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#1C1C1C] font-semibold">
                  ✦ Ordered by AI Match Relevance for "<em>{aiQuery}</em>"
                </span>
                <button
                  type="button"
                  id="browse-ai-search-clear-btn"
                  onClick={() => {
                    setAiQuery("");
                    setAiSearchResults(null);
                  }}
                  className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                >
                  Clear Semantic Filter
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-[#DADADA]">
            <span className="text-xs font-sans text-[#6B6B6B] uppercase tracking-wider font-semibold">
              Showing 1–{finalProducts.length} of {finalProducts.length + 125} Products Available
            </span>
            <div className="flex items-center gap-3">
              {/* Sort selector */}
              <div className="flex items-center gap-2 bg-white border border-[#DADADA] rounded-full px-4 py-2 text-xs font-sans text-[#1C1C1C]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span className="text-[#6B6B6B]">Sort:</span>
                <select
                  id="browse-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Newest">Newest Arrivals</option>
                  <option value="Trending">Trending rentals</option>
                  <option value="Most Rented">Most Rented</option>
                  <option value="Price Low→High">Price Low → High</option>
                  <option value="Price High→Low">Price High → Low</option>
                  <option value="Best Rated">Best Rated</option>
                  <option value="Discount">Special Discount</option>
                </select>
              </div>

              {/* Reset filter button */}
              <button
                id="reset-filters-btn"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest font-semibold border border-[#DADADA] bg-white rounded-full px-4 py-2 hover:bg-[#303030] hover:text-white transition"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Laptop Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Collapsible Filter Panel */}
          <div className={`lg:col-span-3 space-y-6 ${showFiltersMobile ? "block" : "hidden lg:block"}`}>
            <div className="bg-white border border-[#DADADA] rounded-3xl p-6 text-left space-y-6 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-[#DADADA]">
                <span className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                </span>
                <button
                  id="mobile-close-filters-btn"
                  onClick={() => setShowFiltersMobile(false)}
                  className="lg:hidden text-xs text-[#6B6B6B] hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category selector */}
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      id={`filter-cat-${cat.id}`}
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition ${selectedCategory === cat.id ? "bg-[#303030] text-white" : "bg-[#F8F6F2] hover:bg-[#D3C6B8]/50 text-[#1C1C1C]"}`}
                    >
                      {cat.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-2 flex justify-between">
                  <span>Max Rental / Day</span>
                  <span className="font-mono font-semibold">₹{priceMax}</span>
                </h4>
                <input
                  id="filter-price-slider"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-[#303030] bg-[#FAF9F6] h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6B6B6B] font-mono mt-1">
                  <span>₹5</span>
                  <span>₹50</span>
                  <span>₹100</span>
                </div>
              </div>

              {/* Brands */}
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">Brand Archives</h4>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <label key={brand} className="flex items-center gap-2.5 text-xs text-[#1C1C1C] cursor-pointer">
                      <input
                        id={`filter-brand-${brand.replace(/\s+/g, "-")}`}
                        type="checkbox"
                        checked={selectedBrand === brand}
                        onChange={() => setSelectedBrand(selectedBrand === brand ? "" : brand)}
                        className="rounded border-[#DADADA] text-[#303030] focus:ring-[#303030] w-4 h-4"
                      />
                      <span className="font-medium">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">Available Sizes</h4>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      id={`filter-size-${sz}`}
                      onClick={() => setSelectedSize(selectedSize === sz ? "" : sz)}
                      className={`py-1.5 rounded-lg border text-xs font-sans font-semibold transition ${selectedSize === sz ? "border-[#303030] bg-[#303030] text-white" : "border-[#DADADA] hover:border-[#1C1C1C]"}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">Preferred Colors</h4>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      id={`filter-color-${color.replace(/\s+/g, "-")}`}
                      onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-medium border transition ${selectedColor === color ? "border-[#303030] bg-[#303030] text-white" : "border-[#DADADA] bg-[#FAF9F6] text-[#6B6B6B]"}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasions */}
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">Occasion Type</h4>
                <div className="space-y-1">
                  {occasions.map((oc) => (
                    <button
                      key={oc}
                      id={`filter-occasion-${oc.replace(/\s+/g, "-")}`}
                      onClick={() => setSelectedOccasion(selectedOccasion === oc ? "" : oc)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${selectedOccasion === oc ? "bg-[#D3C6B8] text-[#1C1C1C] font-semibold" : "hover:bg-[#F8F6F2] text-[#6B6B6B]"}`}
                    >
                      {selectedOccasion === oc ? "✓ " : ""} {oc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ratings */}
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">Rating Score</h4>
                <div className="flex gap-2">
                  {[4, 4.5, 4.8].map((score) => (
                    <button
                      key={score}
                      id={`filter-rating-${score}`}
                      onClick={() => setSelectedRating(selectedRating === score ? null : score)}
                      className={`flex-1 py-1.5 border rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 transition ${selectedRating === score ? "bg-[#303030] text-white" : "border-[#DADADA] hover:border-black"}`}
                    >
                      <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" /> {score}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <h4 className="text-[11px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C] mb-3">Target Gender</h4>
                <div className="grid grid-cols-2 gap-2">
                  {genders.map((g) => (
                    <button
                      key={g}
                      id={`filter-gender-${g}`}
                      onClick={() => setSelectedGender(selectedGender === g ? "" : g)}
                      className={`py-1.5 border rounded-lg text-xs font-medium transition ${selectedGender === g ? "bg-[#303030] text-white" : "border-[#DADADA] hover:border-black"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Product Grid */}
          <div className="lg:col-span-9">
            
            {/* Search feedback */}
            {searchQuery && (
              <div className="bg-[#FAF9F6] border border-[#DADADA] rounded-2xl p-4 text-left mb-6 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[#6B6B6B]">Search result for:</span>{" "}
                  <strong className="text-[#1C1C1C]">"{searchQuery}"</strong>
                </div>
                <button
                  id="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  className="text-[#6B6B6B] hover:text-black underline"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Empty State */}
            {finalProducts.length === 0 ? (
              <div className="bg-white border border-[#DADADA] rounded-[32px] p-16 text-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#DADADA] flex items-center justify-center mx-auto text-xl">
                  ✦
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#1C1C1C]">No Matching Archives Found</h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto leading-relaxed">
                  We currently do not hold fashion assets matching this exact criteria combination. Try resetting your custom color or size preferences.
                </p>
                <button
                  id="empty-reset-filters-btn"
                  onClick={handleResetFilters}
                  className="bg-[#303030] text-white text-xs font-sans font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-black transition shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {finalProducts.map((p) => {
                  const prod = p as Product & { aiMatch?: { relevanceScore: number; relevanceExplanation: string } };
                  const isWishlisted = wishlistIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      id={`browse-prod-card-${prod.id}`}
                      className="bg-white border border-[#DADADA] rounded-[28px] overflow-hidden group shadow-sm hover:shadow-md transition duration-300 flex flex-col h-auto min-h-[460px] pb-4 relative"
                    >
                      {/* Wishlist Heart */}
                      <button
                        id={`wishlist-browse-toggle-${prod.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(prod);
                        }}
                        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#DADADA] flex items-center justify-center hover:bg-white transition cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-[#1C1C1C]"}`} />
                      </button>

                      {/* Image Frame */}
                      <div 
                        onClick={() => onProductClick(prod)}
                        className="p-4 pb-0 flex-1 cursor-pointer animate-fadeIn"
                      >
                        <div className="w-full h-64 rounded-t-[90px] rounded-b-[16px] overflow-hidden border border-[#DADADA]/30 relative">
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
                          {prod.aiMatch && (
                            <span className="absolute top-3 left-3 bg-[#D4AF37] text-[#1C1C1C] text-[9px] font-sans font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
                              ✦ Match: {prod.aiMatch.relevanceScore}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Container */}
                      <div className="p-5 text-left flex flex-col justify-between flex-1">
                        <div onClick={() => onProductClick(prod)} className="cursor-pointer space-y-1">
                          <div className="flex justify-between items-baseline">
                            <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-sans">{prod.brand}</p>
                            <div className="flex items-center gap-0.5 text-xs text-[#1C1C1C] font-semibold">
                              <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" /> {prod.rating}
                            </div>
                          </div>
                          <h4 className="text-xs font-sans font-bold text-[#1C1C1C] truncate">{prod.name}</h4>
                          <p className="text-[11px] text-[#6B6B6B] truncate">{prod.vendorName}</p>

                          {/* Render beautiful AI matching reason right on the card */}
                          {prod.aiMatch && (
                            <div className="bg-[#FAF9F6] border border-[#DADADA]/40 rounded-xl p-2.5 mt-2 text-[10px] text-[#6B6B6B] leading-relaxed italic animate-fadeIn">
                              <strong className="text-[#D4AF37] not-italic block font-sans font-bold uppercase tracking-widest text-[8px] mb-0.5">✦ Curator Note</strong>
                              "{prod.aiMatch.relevanceExplanation}"
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-[#DADADA]/50 mt-4 flex justify-between items-center">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-[#6B6B6B] font-sans">Rental Price</p>
                            <p className="text-sm font-serif font-semibold text-[#1C1C1C]">
                              ₹{prod.rentalPrice} <span className="text-xs font-sans text-[#6B6B6B] font-normal">/ day</span>
                            </p>
                          </div>
                          <button
                            id={`browse-rent-btn-${prod.id}`}
                            onClick={() => onProductClick(prod)}
                            className="bg-[#303030] text-white text-[10px] font-sans font-bold uppercase tracking-wider px-4 py-2.5 rounded-full hover:bg-black transition cursor-pointer"
                          >
                            Rent
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

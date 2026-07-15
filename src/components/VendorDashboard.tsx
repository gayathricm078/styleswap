import React, { useState } from "react";
import { PlusCircle, ShoppingBag, ClipboardList, TrendingUp, Star, DollarSign, Check, X, ShieldAlert } from "lucide-react";
import { Product } from "../types";
import { api, ApiError } from "../api/client";

interface VendorDashboardProps {
  products: Product[];
  onAddListing: (newProduct: Product) => void;
  onUpdateProductPrice: (id: string, newPrice: number) => void;
  incomingOrders: any[];
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  vendorUserId?: string;
}

export default function VendorDashboard({
  products,
  onAddListing,
  onUpdateProductPrice,
  incomingOrders,
  onUpdateOrderStatus,
  vendorUserId,
}: VendorDashboardProps) {
  // Add item form state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("COS Premium");
  const [category, setCategory] = useState<Product["category"]>("Women");
  const [rentalPrice, setRentalPrice] = useState(35);
  const [securityDeposit, setSecurityDeposit] = useState(100);
  const [sizes, setSizes] = useState<string[]>(["S", "M"]);
  const [colors, setColors] = useState("Oatmeal Beige");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [formSuccess, setFormSuccess] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generateImageError, setGenerateImageError] = useState("");

  const handleGenerateListingImage = async () => {
    if (!name.trim()) return;
    setIsGeneratingImage(true);
    setGenerateImageError("");
    try {
      const data = await api.generateImage(
        `A pristine high-fashion catalog flat-lay or model studio photo of a ${name} by ${brand} in ${colors} color, minimalist editorial styling`,
        "3:4"
      );
      setImageUrl(data.imageUrl);
    } catch (err: any) {
      console.error(err);
      // Leave imageUrl alone — silently swapping in a stock photo would let a
      // vendor publish a listing whose image isn't their garment.
      setGenerateImageError(
        err instanceof ApiError
          ? `${err.message} Paste an image URL instead.`
          : "The image service is unavailable. Paste an image URL instead."
      );
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Listings this vendor actually owns. The backend enforces the same rule on
  // write, so editing anything outside this set would 403 anyway.
  const vendorProducts = products.filter((p) => vendorUserId && p.vendorUserId === vendorUserId);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    // Use a high-quality visual placeholder if imageUrl is empty
    const img = imageUrl.trim() || "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=600";

    const newProd: Product = {
      id: "prod-vendor-" + Date.now(),
      name,
      brand,
      category,
      subCategory: "Atelier Curated",
      image: img,
      gallery: [img],
      rentalPrice,
      securityDeposit,
      sizes,
      colors: colors.split(",").map((c) => ({ name: c.trim(), hex: "#D3C6B8" })),
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      status: "Available",
      badge: "New",
      vendorName: "Aura Archives",
      vendorVerified: "Trusted Vendor",
      deliveryDate: "Tomorrow",
      description,
    };

    onAddListing(newProd);

    // Reset Form
    setName("");
    setDescription("");
    setImageUrl("");
    setColors("Oatmeal Beige");
    setSizes(["S", "M"]);
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  const toggleSizeSelection = (sz: string) => {
    if (sizes.includes(sz)) {
      setSizes(sizes.filter((s) => s !== sz));
    } else {
      setSizes([...sizes, sz]);
    }
  };

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto text-left">
        
        {/* Header */}
        <div className="mb-10 border-b border-[#DADADA] pb-6 flex justify-between items-baseline flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
              <span>Merchant Console</span>
              <span>✦</span>
              <span>Aura Archives Curator</span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight mt-1 flex items-center gap-2">
              Curator Dashboard
            </h2>
          </div>
          <div className="bg-white px-4 py-2 border border-[#DADADA] rounded-full text-xs font-sans text-green-700 font-bold">
            ● Aura Premium Verified Store
          </div>
        </div>

        {/* Curator Stats metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-sans">Gross Revenue</span>
              <p className="text-xl font-serif font-bold text-[#1C1C1C]">₹14,240</p>
            </div>
          </div>

          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-sans">Active Wardrobe</span>
              <p className="text-xl font-serif font-bold text-[#1C1C1C]">{vendorProducts.length} Items</p>
            </div>
          </div>

          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-sans">Outgoing Rentals</span>
              <p className="text-xl font-serif font-bold text-[#1C1C1C]">{incomingOrders.length} Swaps</p>
            </div>
          </div>

          <div className="bg-white border border-[#DADADA] rounded-[24px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-700">
              <Star className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-sans">Customer Score</span>
              <p className="text-xl font-serif font-bold text-[#1C1C1C]">4.95 / 5</p>
            </div>
          </div>
        </div>

        {/* Splitting Form and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Add listing Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#DADADA] pb-4">
                <PlusCircle className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                  List New Wardrobe Asset
                </span>
              </div>

              {formSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-xs font-sans flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4" /> Closet item added successfully to the marketplace!
                </div>
              )}

              <form onSubmit={handleAddProduct} className="space-y-4 text-xs text-[#1C1C1C]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase mb-1">Product Title</label>
                    <input
                      id="vendor-title-input"
                      type="text"
                      placeholder="e.g. Asymmetrical Linen Gown"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase mb-1">Brand Atelier</label>
                    <select
                      id="vendor-brand-select"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3 focus:outline-none"
                    >
                      <option value="COS Premium">COS Premium</option>
                      <option value="Mango Man Tailoring">Mango Man Tailoring</option>
                      <option value="Savoir Jewelry">Savoir Jewelry</option>
                      <option value="Saint Laurent Style">Saint Laurent Style</option>
                      <option value="Zara Archives">Zara Archives</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase mb-1">Category</label>
                    <select
                      id="vendor-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Product["category"])}
                      className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3 focus:outline-none"
                    >
                      <option value="Women">Women</option>
                      <option value="Men">Men</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Jewellery">Jewellery</option>
                      <option value="Handbags">Handbags</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase mb-1">Price / Day (₹)</label>
                    <input
                      id="vendor-price-input"
                      type="number"
                      value={rentalPrice}
                      onChange={(e) => setRentalPrice(Number(e.target.value))}
                      required
                      className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase mb-1">Deposit (₹)</label>
                    <input
                      id="vendor-deposit-input"
                      type="number"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                      required
                      className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase mb-1">Color Options</label>
                  <input
                    id="vendor-colors-input"
                    type="text"
                    placeholder="e.g. Desert Sand, Oat Cream"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3 focus:outline-none"
                  />
                </div>

                {/* Sizes checkboxes */}
                <div>
                  <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase mb-2">Available Sizes</label>
                  <div className="flex gap-2">
                    {["XS", "S", "M", "L", "XL", "One Size"].map((sz) => (
                      <button
                        key={sz}
                        id={`vendor-form-size-${sz}`}
                        type="button"
                        onClick={() => toggleSizeSelection(sz)}
                        className={`flex-1 py-2 border rounded-xl font-bold transition ${sizes.includes(sz) ? "border-[#1C1C1C] bg-[#1C1C1C] text-white" : "border-[#DADADA] bg-white hover:border-black"}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase">Catalog Image URL (Optional)</label>
                    <button
                      type="button"
                      disabled={isGeneratingImage || !name.trim()}
                      onClick={handleGenerateListingImage}
                      className="text-[10px] font-sans font-semibold uppercase text-[#D4AF37] hover:text-black transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      {isGeneratingImage ? "Synthesizing..." : "✦ Generate with AI"}
                    </button>
                  </div>
                  <input
                    id="vendor-image-input"
                    type="text"
                    placeholder="Paste unsplash or click generate..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3 focus:outline-none"
                  />
                  {generateImageError && (
                    <p className="text-[10px] text-amber-700 mt-1">{generateImageError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-[#6B6B6B] font-bold uppercase mb-1">Curator's Editorial Description</label>
                  <textarea
                    id="vendor-desc-input"
                    placeholder="Describe material drapes, weaving origin, silhouette fit..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3 focus:outline-none leading-relaxed"
                  ></textarea>
                </div>

                <button
                  id="vendor-form-submit-btn"
                  type="submit"
                  className="w-full bg-[#303030] hover:bg-black text-white text-xs font-sans font-bold uppercase tracking-widest py-4 rounded-full transition shadow"
                >
                  Confirm Listing Agreement
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Listed closet & Requests */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Incoming Swap Requests */}
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] border-b border-[#DADADA] pb-3 flex justify-between items-center">
                <span>Incoming Swap Requests</span>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {incomingOrders.length} Pending
                </span>
              </h3>

              {incomingOrders.length === 0 ? (
                <p className="text-xs text-[#6B6B6B] italic py-6 text-center">No pending rental orders in this period.</p>
              ) : (
                <div className="space-y-4">
                  {incomingOrders.map((ord) => (
                    <div key={ord.id} className="border border-[#DADADA] rounded-2xl p-4 space-y-3 bg-[#FAF9F6]/30">
                      <div className="flex justify-between items-baseline flex-wrap gap-2">
                        <div>
                          <p className="text-[9px] text-[#6B6B6B] font-mono">Order Ref: #{ord.id}</p>
                          <p className="text-xs text-[#1C1C1C] font-semibold">User: {ord.userProfile?.name || "Jane Doe"}</p>
                        </div>
                        <span className="text-xs font-bold font-mono text-[#1C1C1C]">₹{ord.totalAmount}</span>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {ord.items.map((item: any) => (
                          <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                            <div className="flex gap-2 items-center">
                              <img src={item.product.image} alt={item.product.name} className="w-8 h-12 rounded object-cover" />
                              <div>
                                <h4 className="font-bold text-[#1C1C1C]">{item.product.name}</h4>
                                <p className="text-[10px] text-[#6B6B6B]">Size: {item.selectedSize} | {item.rentalDuration} days</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-[#DADADA]/50">
                        <button
                          id={`vendor-order-reject-${ord.id}`}
                          onClick={() => onUpdateOrderStatus(ord.id, "Rejected")}
                          className="px-4 py-1.5 border border-[#DADADA] rounded-full text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition"
                        >
                          Decline
                        </button>
                        <button
                          id={`vendor-order-approve-${ord.id}`}
                          onClick={() => onUpdateOrderStatus(ord.id, "Approved")}
                          className="px-4 py-1.5 bg-[#303030] hover:bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Curator Listings */}
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] border-b border-[#DADADA] pb-3">
                Your Active Wardrobe Listings ({vendorProducts.length})
              </h3>

              <div className="divide-y divide-[#DADADA]/40 max-h-[500px] overflow-y-auto pr-1">
                {vendorProducts.map((p) => (
                  <div key={p.id} className="py-4 flex justify-between items-center gap-4 flex-wrap">
                    <div className="flex gap-3 items-center text-xs">
                      <div className="w-10 h-14 rounded-lg overflow-hidden border shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">{p.brand}</span>
                        <h4 className="font-bold text-[#1C1C1C]">{p.name}</h4>
                        <p className="text-[10px] text-[#6B6B6B]">Rating: {p.rating} / 5</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-right">
                      <div>
                        <span className="text-[9px] text-[#6B6B6B] block uppercase font-sans">Rental Rate</span>
                        <input
                          id={`vendor-rate-edit-${p.id}`}
                          type="number"
                          value={p.rentalPrice}
                          onChange={(e) => onUpdateProductPrice(p.id, Number(e.target.value))}
                          className="w-16 bg-[#FAF9F6] border border-[#DADADA] rounded px-2 py-1 text-xs font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#6B6B6B] block uppercase font-sans">Status</span>
                        <span className="font-bold text-green-600 uppercase text-[10px]">● {p.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

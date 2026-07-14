import React, { useState } from "react";
import { User, ShieldCheck, Heart, Sparkles, MapPin, Trash2, Award, Sparkle, Percent, Star } from "lucide-react";
import { Product, Address } from "../types";

interface UserProfileProps {
  userProfile: any;
  wishlistProducts: Product[];
  onRemoveWishlist: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onUpdateProfile: (updated: any) => void;
}

export default function UserProfile({
  userProfile,
  wishlistProducts,
  onRemoveWishlist,
  onProductClick,
  onUpdateProfile,
}: UserProfileProps) {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [phone, setPhone] = useState(userProfile.phone);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdateProfile({
      ...userProfile,
      name,
      email,
      phone,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Grid: Info card Left, Metrics & Wishlist Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Personal details */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D3C6B8]/20 rounded-full blur-2xl -z-10"></div>
              
              {/* Profile image with gold bezel */}
              <div className="relative w-24 h-24 mx-auto rounded-full p-1 border-2 border-[#D4AF37]">
                <img src={userProfile.avatar} alt="user avatar" className="w-full h-full rounded-full object-cover" />
                <span className="absolute bottom-0 right-0 bg-[#303030] text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-white">
                  Gold Tier
                </span>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-[#1C1C1C]">{userProfile.name}</h3>
                <p className="text-xs text-[#6B6B6B] font-sans">Active circular swapper since 2024</p>
              </div>

              <div className="bg-[#FAF9F6] border border-[#DADADA] rounded-2xl p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Voucher Account</span>
                  <span className="font-bold text-[#1C1C1C]">Gold Premium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Default Payment</span>
                  <span className="font-bold text-[#1C1C1C]">Razorpay Simulated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Active Rental Limit</span>
                  <span className="font-bold text-[#1C1C1C] text-green-600">4 Items at once</span>
                </div>
              </div>

              {/* Form editing */}
              {!isEditing ? (
                <button
                  id="profile-edit-btn"
                  onClick={() => setIsEditing(true)}
                  className="w-full border border-[#DADADA] bg-[#FAF9F6] text-[#1C1C1C] text-xs font-sans font-bold uppercase tracking-widest py-3 rounded-full hover:bg-[#303030] hover:text-white transition"
                >
                  Edit Profile Information
                </button>
              ) : (
                <div className="space-y-3 text-left">
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-semibold uppercase">Full Name</label>
                    <input
                      id="profile-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] font-semibold uppercase">Email Address</label>
                    <input
                      id="profile-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="profile-save-btn"
                      onClick={handleSave}
                      className="flex-1 bg-[#303030] text-white text-[10px] font-sans font-bold uppercase py-2 rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      id="profile-cancel-btn"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 border border-[#DADADA] text-[#1C1C1C] text-[10px] font-sans font-bold uppercase py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Addresses Board */}
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 text-left space-y-4 shadow-sm">
              <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5 border-b border-[#DADADA] pb-3">
                <MapPin className="w-4 h-4 text-[#D4AF37]" /> Saved Addresses
              </h4>
              <div className="space-y-3">
                {userProfile.addresses.map((addr: Address) => (
                  <div key={addr.id} className="border border-[#DADADA] rounded-xl p-3 flex justify-between items-center bg-[#FAF9F6]/50">
                    <div>
                      <h5 className="text-xs font-bold text-[#1C1C1C]">{addr.label}</h5>
                      <p className="text-[11px] text-[#6B6B6B] leading-tight">{addr.street}, {addr.city}</p>
                    </div>
                    <button
                      id={`address-delete-${addr.id}`}
                      onClick={() => alert("Address modification restricted in demo sandbox.")}
                      className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Metrics & Saved Favorites list */}
          <div className="lg:col-span-8 space-y-8 text-left">
            
            {/* Sustainability Metrics & Loyalty progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sustainability Score */}
              <div className="bg-[#D3C6B8] border border-[#DADADA] rounded-[32px] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-sans uppercase tracking-widest bg-white/60 px-2.5 py-0.5 rounded text-[#1C1C1C] font-bold">
                      ✦ CIRCULAR FOOTPRINT ACCRUED
                    </span>
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  
                  {/* Big indicator */}
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-serif text-5xl font-bold text-[#1C1C1C]">{userProfile.sustainabilityScore}</span>
                    <span className="text-xs font-sans text-[#1C1C1C] uppercase font-bold">Swap Points</span>
                  </div>
                  <p className="text-xs text-[#1C1C1C]/80 mt-1 leading-relaxed">
                    By choosing StyleSwap rented designer wear instead of buying fast fashion, you saved:
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-[#1C1C1C]/15 pt-4 mt-4 text-[11px] text-[#1C1C1C] font-mono font-bold">
                  <div>
                    <span className="text-[9px] text-[#6B6B6B] block uppercase font-sans font-normal">Fabric</span>
                    <span>18.6 kg</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6B6B6B] block uppercase font-sans font-normal">Water</span>
                    <span>42,000L</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6B6B6B] block uppercase font-sans font-normal">Carbon</span>
                    <span>120kg CO₂</span>
                  </div>
                </div>
              </div>

              {/* Loyalty Club Tier benefits */}
              <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> GOLD ARCH LUXURY BENEFITS
                  </span>
                  
                  <div className="mt-4 space-y-2 text-xs text-[#6B6B6B]">
                    <div className="flex gap-2 items-center">
                      <span className="text-[#D4AF37]">✦</span>
                      <span>1.5x Swap points multiplier on every rental</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-[#D4AF37]">✦</span>
                      <span>Complimentary Dry Cleaning & Sterilization</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-[#D4AF37]">✦</span>
                      <span>Free Express shipping & Home pickup schedules</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-[#D4AF37]">✦</span>
                      <span>Priority access to new brand drop inventory</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#FAF9F6] mt-4 flex justify-between items-center text-[11px] font-sans">
                  <span className="text-[#6B6B6B]">Tier Progress: 85% to Platinum</span>
                  <span className="font-bold text-[#D4AF37]">1,450 / 2,000 pts</span>
                </div>
              </div>

            </div>

            {/* Saved Wishlist Items */}
            <div>
              <h3 className="font-serif text-2xl text-[#1C1C1C] tracking-tight mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" /> Saved Archives
              </h3>
              
              {wishlistProducts.length === 0 ? (
                <div className="bg-white border border-[#DADADA] rounded-[24px] p-12 text-center text-xs text-[#6B6B6B] leading-relaxed shadow-sm">
                  Your saved items catalog is empty. Click the heart icon on any dress or ring in our collections to bookmark it.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      id={`profile-wish-card-${p.id}`}
                      className="bg-white border border-[#DADADA] rounded-2xl p-4 flex flex-col justify-between h-80 relative hover:shadow-md transition text-left"
                    >
                      {/* Delete wishlist heart option */}
                      <button
                        id={`profile-wish-remove-${p.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveWishlist(p);
                        }}
                        className="absolute top-4 right-4 text-red-500 bg-white shadow-sm p-1.5 rounded-full border border-[#DADADA]/30 hover:bg-red-50 transition cursor-pointer"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div onClick={() => onProductClick(p)} className="cursor-pointer">
                        <div className="w-full h-40 rounded-t-[50px] rounded-b-[10px] overflow-hidden border border-[#DADADA]/30 mb-3">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] uppercase tracking-widest text-[#6B6B6B]">{p.brand}</span>
                        <h4 className="text-xs font-bold text-[#1C1C1C] truncate">{p.name}</h4>
                      </div>

                      <div className="pt-2 border-t border-[#DADADA]/20 flex justify-between items-center">
                        <span className="text-xs font-serif font-bold text-[#1C1C1C]">₹{p.rentalPrice}/day</span>
                        <button
                          id={`profile-wish-rent-${p.id}`}
                          onClick={() => onProductClick(p)}
                          className="bg-[#303030] text-white text-[9px] font-sans font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full hover:bg-black transition"
                        >
                          Rent Look
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

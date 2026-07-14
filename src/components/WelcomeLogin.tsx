import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Mail, Lock, User, Check, ArrowRight, Shield, ShoppingBag, Leaf, Eye, EyeOff } from "lucide-react";
import { UserRole } from "../types";

interface WelcomeLoginProps {
  onLogin: (user: any, role: UserRole) => void;
}

export default function WelcomeLogin({ onLogin }: WelcomeLoginProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [prefCategory, setPrefCategory] = useState<string>("Women");
  const [prefSize, setPrefSize] = useState<string>("M");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Quick select personas for easier evaluation and demo-ing
  const demoPersonas = [
    {
      name: "Victoria Fontaine",
      email: "victoria@styleswap.com",
      password: "password123",
      role: "customer" as UserRole,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      description: "Customer Portal"
    },
    {
      name: "Atelier COS Resell",
      email: "cos@styleswap.com",
      password: "password123",
      role: "vendor" as UserRole,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
      description: "Vendor Workspace"
    },
    {
      name: "System Administrator",
      email: "admin@styleswap.com",
      password: "password123",
      role: "admin" as UserRole,
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150",
      description: "Admin Dashboard"
    }
  ];

  const handleApplyPersona = (p: typeof demoPersonas[0]) => {
    setEmail(p.email);
    setPassword(p.password);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please fill out all fields.");
      setLoading(false);
      return;
    }

    if (!isLogin && !name.trim()) {
      setError("Please provide your name.");
      setLoading(false);
      return;
    }

    // Check if it's one of our demo personas for quick validation
    const foundDemo = demoPersonas.find(p => p.email.toLowerCase() === email.toLowerCase());

    setTimeout(() => {
      if (isLogin) {
        if (foundDemo) {
          onLogin(
            {
              id: `user-${foundDemo.role}`,
              name: foundDemo.name,
              email: foundDemo.email,
              profilePic: foundDemo.avatar,
              role: foundDemo.role,
              sustainabilityScore: foundDemo.role === "customer" ? 89 : 100,
              rewardPoints: foundDemo.role === "customer" ? 1250 : 0,
              tier: foundDemo.role === "customer" ? "Gold" : "Partner",
              addresses: [
                {
                  id: "addr-demo",
                  label: "Main Residence (Default)",
                  street: "742 Fifth Avenue, Apt 4B",
                  city: "New York",
                  state: "NY",
                  zip: "10019",
                  isDefault: true
                }
              ]
            },
            foundDemo.role
          );
        } else {
          // Custom customer login fallback
          onLogin(
            {
              id: "user-custom",
              name: email.split("@")[0].replace(/^\w/, c => c.toUpperCase()),
              email: email,
              profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              role: "customer" as UserRole,
              sustainabilityScore: 75,
              rewardPoints: 100,
              tier: "Silver",
              addresses: [
                {
                  id: "addr-custom",
                  label: "Home Address",
                  street: "123 Style Boulevard",
                  city: "San Francisco",
                  state: "CA",
                  zip: "94103",
                  isDefault: true
                }
              ]
            },
            "customer"
          );
        }
      } else {
        // Register standard customer
        onLogin(
          {
            id: `user-registered-${Date.now()}`,
            name: name,
            email: email,
            profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
            role: "customer" as UserRole,
            sustainabilityScore: 100, // starting point
            rewardPoints: 150, // welcome points
            tier: "Silver",
            preferredCategory: prefCategory,
            preferredSize: prefSize,
            addresses: []
          },
          "customer"
        );
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col md:flex-row text-[#1C1C1C]">
      
      {/* Left Column - Fashion Moodboard & Circular Statement */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#151515] overflow-hidden flex-col justify-between p-12 lg:p-16 text-[#F8F6F2]">
        {/* Abstract Background pattern */}
        <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=1200')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#151515]/80 to-[#1C1C1C]/60" />
        
        {/* Top bar with Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-medium tracking-tight">StyleSwap</h1>
          </div>
          <span className="text-[10px] tracking-[0.2em] font-sans font-light uppercase text-[#D4AF37] block mt-1">
            Circular Luxury Fashion Archive
          </span>
        </div>

        {/* Middle Core Statement */}
        <div className="relative z-10 max-w-md my-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="font-serif text-3xl lg:text-4xl leading-snug tracking-tight text-[#FAF9F6]">
              "Swap your style, <span className="text-[#D4AF37] italic font-medium">not your budget.</span>"
            </p>
            <div className="h-[1px] w-20 bg-[#D4AF37] my-6" />
            <p className="text-sm text-[#A0A0A0] leading-relaxed font-light">
              Access premium, curated capsule wardrobes from leading designers with zero waste. Experience circular luxury without high retail pricing. Fully backed by integrated AI fit estimation and automated return wear integrity scanning.
            </p>
          </motion.div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 mt-10">
            <div className="border-l border-[#2E2E2E] pl-4">
              <span className="text-xl font-serif text-[#D4AF37] block">93%</span>
              <span className="text-[9px] uppercase tracking-wider text-[#A0A0A0] font-sans">Water Saved</span>
            </div>
            <div className="border-l border-[#2E2E2E] pl-4">
              <span className="text-xl font-serif text-[#D4AF37] block">-11kg</span>
              <span className="text-[9px] uppercase tracking-wider text-[#A0A0A0] font-sans">CO₂ Per Item</span>
            </div>
            <div className="border-l border-[#2E2E2E] pl-4">
              <span className="text-xl font-serif text-[#D4AF37] block">10k+</span>
              <span className="text-[9px] uppercase tracking-wider text-[#A0A0A0] font-sans">Eco Swaps</span>
            </div>
          </div>
        </div>

        {/* Footer brand list */}
        <div className="relative z-10 pt-6 border-t border-[#262626] flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-[#6E6E6E] font-medium">
          <span>COS Atelier</span>
          <span>•</span>
          <span>L'Aura Bridal</span>
          <span>•</span>
          <span>Savoir Jewelry</span>
          <span>•</span>
          <span>Aesop Home</span>
        </div>
      </div>

      {/* Right Column - Elegant Auth Card */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-[#F8F6F2]">
        
        {/* Mobile Header Branding */}
        <div className="md:hidden text-center mb-10">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#1C1C1C]">StyleSwap</h1>
          <span className="text-[9px] tracking-[0.2em] font-sans font-light uppercase text-[#D4AF37] block mt-1">
            Circular Fashion Rental
          </span>
        </div>

        <div className="max-w-md w-full mx-auto">
          
          {/* Header switch buttons */}
          <div className="flex border-b border-[#DADADA] mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`pb-4 text-sm font-sans uppercase tracking-widest font-semibold transition-all relative flex-1 ${isLogin ? "text-[#1C1C1C]" : "text-[#8E8E8E] hover:text-[#1C1C1C]"}`}
            >
              Sign In
              {isLogin && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1C1C1C]" 
                />
              )}
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`pb-4 text-sm font-sans uppercase tracking-widest font-semibold transition-all relative flex-1 ${!isLogin ? "text-[#1C1C1C]" : "text-[#8E8E8E] hover:text-[#1C1C1C]"}`}
            >
              Join Archive
              {!isLogin && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1C1C1C]" 
                />
              )}
            </button>
          </div>

          <p className="text-xs text-[#6B6B6B] mb-6 leading-relaxed">
            {isLogin 
              ? "Access your StyleSwap circular portal to manage wardrobe swaps, size estimations, and curated active rentals."
              : "Register your dimensions and preferred style curation focus to receive personalized recommendations from our AI Stylist."
            }
          </p>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>{error}</span>
              </div>
            )}

            {/* Registration fields */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-sans uppercase tracking-wider text-[#6B6B6B] font-semibold block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-[#6B6B6B]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Victoria Fontaine"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DADADA] rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-[#1C1C1C] placeholder-[#A0A0A0] focus:outline-none focus:border-[#1C1C1C] transition shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1">
              <label className="text-[10px] font-sans uppercase tracking-wider text-[#6B6B6B] font-semibold block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DADADA] rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-[#1C1C1C] placeholder-[#A0A0A0] focus:outline-none focus:border-[#1C1C1C] transition shadow-sm"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-sans uppercase tracking-wider text-[#6B6B6B] font-semibold block">Password</label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-sans text-[#D4AF37] hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DADADA] rounded-xl py-3 pl-10 pr-10 text-xs font-sans text-[#1C1C1C] placeholder-[#A0A0A0] focus:outline-none focus:border-[#1C1C1C] transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#6B6B6B] hover:text-[#1C1C1C]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Custom registration style preferences */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-[#6B6B6B] font-semibold block">Style Curation</label>
                  <select
                    value={prefCategory}
                    onChange={(e) => setPrefCategory(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DADADA] rounded-xl py-3 px-3 text-xs font-sans text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition shadow-sm cursor-pointer"
                  >
                    <option value="Women">Women Collection</option>
                    <option value="Men">Men Collection</option>
                    <option value="Wedding">Bridal & Tuxedo</option>
                    <option value="Jewellery">High Jewellery</option>
                    <option value="Handbags">Luxury Bags</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-[#6B6B6B] font-semibold block">Primary Size</label>
                  <select
                    value={prefSize}
                    onChange={(e) => setPrefSize(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DADADA] rounded-xl py-3 px-3 text-xs font-sans text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition shadow-sm cursor-pointer"
                  >
                    <option value="XS">XS (Extra Small)</option>
                    <option value="S">S (Small)</option>
                    <option value="M">M (Medium)</option>
                    <option value="L">L (Large)</option>
                    <option value="XL">XL (Extra Large)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Remember me (Login mode) */}
            {isLogin && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded border-[#DADADA] text-[#1C1C1C] focus:ring-0 w-3.5 h-3.5" />
                  <span className="text-[11px] text-[#6B6B6B]">Remember session logs</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1C1C1C] text-[#F8F6F2] hover:bg-[#D4AF37] hover:text-[#1C1C1C] rounded-xl py-3.5 font-sans uppercase tracking-widest text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer mt-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing Secure Session...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? "Authenticate Swap ID" : "Register Swap Profile"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Access Demo Personas box */}
          <div className="mt-8 pt-8 border-t border-[#DADADA]">
            <div className="flex items-center gap-1.5 mb-4">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[10px] font-sans uppercase tracking-wider text-[#6B6B6B] font-bold">
                One-Click Demo Portals (Recommended)
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B] leading-relaxed mb-4">
              Switch roles and explore simulated database actions instantly by tapping a profile:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {demoPersonas.map((persona, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleApplyPersona(persona)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                    email === persona.email
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-sm"
                      : "border-[#DADADA] hover:border-[#1C1C1C] bg-[#FFFFFF]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <img src={persona.avatar} alt={persona.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-semibold text-[10px] truncate max-w-[80px]">
                      {persona.name.split(" ")[0]}
                    </span>
                  </div>
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#D4AF37] font-bold">
                    {persona.description.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Environmental Trust Note */}
          <div className="mt-8 flex items-center gap-2.5 justify-center text-[10px] text-[#8E8E8E] bg-[#FFFFFF]/40 py-2.5 px-4 rounded-xl border border-[#DADADA]/50">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>StyleSwap is an eco-verified climate positive enterprise.</span>
          </div>

        </div>
      </div>

    </div>
  );
}

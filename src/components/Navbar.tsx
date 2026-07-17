import React, { useState } from "react";
import { Search, Heart, ShoppingBag, Bell, User, Sparkles, ShieldCheck, ClipboardList, Menu, ChevronDown, Lock } from "lucide-react";
import { UserRole, Notification, UserProfileData } from "../types";

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeView: string;
  onViewChange: (view: string) => void;
  cartCount: number;
  wishlistCount: number;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  userProfile: UserProfileData;
  onSearch: (query: string) => void;
  onLogout?: () => void;
}

export default function Navbar({
  currentRole,
  onRoleChange,
  activeView,
  onViewChange,
  cartCount,
  wishlistCount,
  notifications,
  onMarkNotificationRead,
  userProfile,
  onSearch,
  onLogout,
}: NavbarProps) {
  // The account's true role, from the signed token — not the view being shown.
  const accountRole = userProfile.role;
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const autocompleteSuggestions = [
    { text: "Black Saree", query: "Saree" },
    { text: "Black Suit", query: "Suit" },
    { text: "Black Handbag", query: "Handbag" },
    { text: "Black Heels", query: "Shoes" },
    { text: "Silk Wedding Gown", query: "Wedding" },
    { text: "Bouclé Blazer", query: "Blazer" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      onViewChange("browse");
      setShowSearchSuggestions(false);
    }
  };

  const handleSuggestionClick = (query: string, text: string) => {
    setSearchQuery(text);
    onSearch(query);
    onViewChange("browse");
    setShowSearchSuggestions(false);
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#DADADA]">
      {/* Tiny Administrative Top Banner */}
      <div className="bg-[#1C1C1C] text-[#F8F6F2] py-2 px-6 flex justify-between items-center text-xs tracking-wider">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
          <span>SYSTEM MODE: <strong className="uppercase font-semibold text-[#D4AF37]">{currentRole}</strong></span>
        </div>
        <div className="relative">
          <button
            id="role-dropdown-trigger"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 bg-[#262626] border border-[#3E3E3E] hover:border-[#D4AF37] text-[#F8F6F2] hover:text-[#D4AF37] px-3.5 py-1.5 rounded-full transition font-sans text-[11px] font-semibold tracking-wider"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Switch Portal</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showRoleDropdown ? "rotate-180" : ""}`} />
          </button>
          
          {showRoleDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-[#1C1C1C] border border-[#3E3E3E] rounded-2xl shadow-xl py-2 z-50 text-left animate-slideDown">
                <div className="px-4 py-1.5 text-[9px] text-[#6B6B6B] uppercase font-bold tracking-widest border-b border-[#262626] mb-1">
                  Select Workspace
                </div>
                {/* Only the workspace this account is entitled to is clickable.
                    The role comes from the signed token, so entering another
                    portal would just 403 on every request. */}
                {([
                  { role: "customer" as UserRole, label: "Customer Portal", view: "home", id: "role-cust-btn" },
                  { role: "vendor" as UserRole, label: "Vendor Workspace", view: "vendor-dashboard", id: "role-vend-btn" },
                  { role: "admin" as UserRole, label: "Admin Dashboard", view: "admin-dashboard", id: "role-admin-btn" },
                ]).map((option) => {
                  const permitted = accountRole === option.role;
                  return (
                    <button
                      key={option.role}
                      id={option.id}
                      disabled={!permitted}
                      title={permitted ? undefined : `Your account is a ${accountRole}. Sign in as a ${option.role} to open this.`}
                      onClick={() => {
                        if (!permitted) return;
                        onRoleChange(option.role);
                        onViewChange(option.view);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-xs text-left transition flex items-center justify-between ${
                        !permitted
                          ? "text-[#5A5A5A] cursor-not-allowed"
                          : currentRole === option.role
                          ? "text-[#D4AF37] font-bold hover:bg-[#262626]"
                          : "text-[#F8F6F2] hover:bg-[#262626]"
                      }`}
                    >
                      <span>{option.label}</span>
                      {currentRole === option.role && permitted && (
                        <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span>
                      )}
                      {!permitted && <Lock className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
        {/* Logo & Tagline */}
        <div 
          onClick={() => {
            if (currentRole === "customer") onViewChange("home");
            else if (currentRole === "vendor") onViewChange("vendor-dashboard");
            else onViewChange("admin-dashboard");
          }} 
          className="flex flex-col cursor-pointer select-none"
        >
          <h1 className="font-serif text-2xl lg:text-3xl text-[#1C1C1C] tracking-tight font-medium flex items-center gap-1.5">
            StyleSwap
          </h1>
          <span className="text-[10px] text-[#6B6B6B] tracking-widest font-sans font-light uppercase -mt-1 hidden sm:inline-block">
            Swap Your Style, Not Your Budget.
          </span>
        </div>

        {/* Categories (Only in Customer Mode) */}
        {currentRole === "customer" && (
          <nav className="hidden lg:flex items-center gap-8 text-xs font-sans uppercase tracking-widest font-medium text-[#1C1C1C]">
            <button
              id="nav-home-btn"
              onClick={() => onViewChange("home")}
              className={`hover:text-[#D4AF37] transition cursor-pointer py-1 ${activeView === "home" ? "border-b border-[#1C1C1C]" : ""}`}
            >
              Home
            </button>
            <button
              id="nav-browse-btn"
              onClick={() => { onSearch(""); onViewChange("browse"); }}
              className={`hover:text-[#D4AF37] transition cursor-pointer py-1 ${activeView === "browse" ? "border-b border-[#1C1C1C]" : ""}`}
            >
              Collections
            </button>
            <button
              id="nav-stylist-btn"
              onClick={() => onViewChange("stylist")}
              className={`hover:text-[#D4AF37] text-[#D4AF37] transition cursor-pointer py-1 flex items-center gap-1 ${activeView === "stylist" ? "border-b border-[#D4AF37]" : ""}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Stylist
            </button>
            <button
              id="nav-tryon-btn"
              onClick={() => onViewChange("tryon")}
              className={`hover:text-[#D4AF37] transition cursor-pointer py-1 ${activeView === "tryon" ? "border-b border-[#1C1C1C]" : ""}`}
            >
              Virtual Try-On
            </button>
            <button
              id="nav-studio-btn"
              onClick={() => onViewChange("studio")}
              className={`hover:text-[#D4AF37] transition cursor-pointer py-1 flex items-center gap-1 ${activeView === "studio" ? "border-b border-[#1C1C1C]" : ""}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Studio
            </button>
          </nav>
        )}

        {/* Search Bar */}
        {currentRole === "customer" && (
          <div className="relative flex-1 max-w-xs md:max-w-sm hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  id="nav-search-input"
                  type="text"
                  // Name things the archive actually stocks. The old copy
                  // advertised "sarees", of which there are none, so the first
                  // search a customer tries returns nothing.
                  placeholder="Search gowns, blazers, earrings…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  className="w-full bg-[#FFFFFF] border border-[#DADADA] rounded-full py-2.5 pl-10 pr-4 text-xs font-sans text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#303030] transition shadow-sm"
                />
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#6B6B6B]" />
              </div>
            </form>

            {/* Search autocomplete suggestion list */}
            {showSearchSuggestions && (
              <div className="absolute top-12 left-0 w-full bg-[#FFFFFF] border border-[#DADADA] rounded-2xl shadow-xl p-4 z-50 animate-fadeIn text-xs">
                <p className="text-[#6B6B6B] font-medium tracking-wider mb-2 uppercase text-[10px]">Suggested Queries</p>
                <div className="grid grid-cols-2 gap-2">
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      id={`suggestion-${index}`}
                      onClick={() => handleSuggestionClick(suggestion.query, suggestion.text)}
                      className="text-left px-3 py-2 rounded-lg hover:bg-[#F8F6F2] text-[#1C1C1C] transition font-medium flex items-center gap-1.5"
                    >
                      <Search className="w-3 h-3 text-[#6B6B6B]" />
                      {suggestion.text}
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[#DADADA] flex justify-between items-center text-[11px]">
                  <span className="text-[#6B6B6B]">Try searching 'Wedding' or 'Jewellery'</span>
                  <button 
                    id="close-suggest-btn"
                    onClick={() => setShowSearchSuggestions(false)} 
                    className="text-[#1C1C1C] underline font-medium hover:text-[#D4AF37]"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right side utilities */}
        <div className="flex items-center gap-5">
          {/* Dashboard Quick Access Links based on role */}
          {currentRole === "vendor" && (
            <span className="text-xs font-sans tracking-wider uppercase font-semibold text-[#1C1C1C] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Vendor Portal
            </span>
          )}
          {currentRole === "admin" && (
            <span className="text-xs font-sans tracking-wider uppercase font-semibold text-[#1C1C1C] flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-[#D4AF37]" /> Admin Dashboard
            </span>
          )}

          {currentRole === "customer" && (
            <>
              {/* Wishlist Icon */}
              <button
                id="navbar-wishlist-btn"
                onClick={() => onViewChange("wishlist")}
                className="relative p-2 text-[#1C1C1C] hover:text-[#D4AF37] transition cursor-pointer"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-[#1C1C1C] text-[10px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#F8F6F2]">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Bag Icon */}
              <button
                id="navbar-cart-btn"
                onClick={() => onViewChange("cart")}
                className="relative p-2 text-[#1C1C1C] hover:text-[#D4AF37] transition cursor-pointer"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#303030] text-white text-[10px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#F8F6F2]">
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              id="navbar-bell-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 text-[#1C1C1C] hover:text-[#D4AF37] transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full ring-2 ring-[#F8F6F2]"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-[#FFFFFF] border border-[#DADADA] rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-[#DADADA] bg-[#F8F6F2] flex justify-between items-center">
                  <span className="text-xs font-sans uppercase tracking-widest font-semibold text-[#1C1C1C]">
                    Reminders & AI Alerts
                  </span>
                  {unreadNotifications > 0 && (
                    <span className="text-[10px] font-sans bg-[#D4AF37]/20 text-[#1C1C1C] px-2 py-0.5 rounded-full font-bold">
                      {unreadNotifications} New
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#DADADA]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#6B6B6B]">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className={`p-3.5 hover:bg-[#F8F6F2] transition cursor-pointer text-left ${!notif.read ? "bg-[#D4AF37]/5" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${notif.type === "ai" ? "text-[#D4AF37]" : "text-[#1C1C1C]"}`}>
                            ✦ {notif.type} alert
                          </span>
                          <span className="text-[9px] text-[#6B6B6B]">{notif.date}</span>
                        </div>
                        <h4 className="text-xs font-sans font-semibold text-[#1C1C1C] mb-0.5">{notif.title}</h4>
                        <p className="text-[11px] text-[#6B6B6B] leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-[#DADADA] text-center bg-[#F8F6F2]">
                  <button
                    id="view-all-notifs-btn"
                    onClick={() => {
                      setShowNotifications(false);
                      if (currentRole === "customer") onViewChange("notifications");
                    }}
                    className="text-[10px] font-sans uppercase tracking-widest font-semibold text-[#1C1C1C] hover:text-[#D4AF37] transition"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              id="navbar-profile-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 border border-[#DADADA] rounded-full p-1 pl-1 pr-3 hover:border-[#303030] transition cursor-pointer"
            >
              <img
                src={userProfile.profilePic}
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="text-xs font-sans font-medium text-[#1C1C1C] hidden md:inline-block max-w-[100px] truncate">
                {userProfile.name.split(" ")[0]}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-[#FFFFFF] border border-[#DADADA] rounded-2xl shadow-2xl overflow-hidden z-50 text-xs">
                <div className="p-4 border-b border-[#DADADA] bg-[#F8F6F2]">
                  <p className="font-semibold text-[#1C1C1C]">{userProfile.name}</p>
                  <p className="text-[10px] text-[#6B6B6B] truncate">{userProfile.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[#303030] text-[#FFFFFF] text-[9px] font-sans rounded-full uppercase tracking-widest font-bold">
                      {userProfile.tier} Tier
                    </span>
                    <span className="text-[9px] text-[#6B6B6B] font-semibold font-mono">
                      ⭐ {userProfile.rewardPoints} pts
                    </span>
                  </div>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <button
                    id="profile-menu-profile-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (currentRole === "customer") onViewChange("profile");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F8F6F2] text-[#1C1C1C] transition font-medium flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-[#6B6B6B]" /> My Profile
                  </button>
                  <button
                    id="profile-menu-orders-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (currentRole === "customer") onViewChange("orders");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F8F6F2] text-[#1C1C1C] transition font-medium flex items-center gap-2"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-[#6B6B6B]" /> Order & Return History
                  </button>
                  <button
                    id="profile-menu-settings-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (currentRole === "customer") onViewChange("settings");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F8F6F2] text-[#1C1C1C] transition font-medium flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> App Preferences
                  </button>
                </div>
                <div className="p-2 border-t border-[#DADADA] bg-[#F8F6F2]/50">
                  <button
                    id="profile-menu-logout-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onLogout) {
                        onLogout();
                      } else {
                        onViewChange("login");
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

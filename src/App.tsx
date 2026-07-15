import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import CustomerHome from "./components/CustomerHome";
import BrowseProducts from "./components/BrowseProducts";
import ProductDetails from "./components/ProductDetails";
import CartPage from "./components/CartPage";
import CheckoutPage from "./components/CheckoutPage";
import UserProfile from "./components/UserProfile";
import OrderHistory from "./components/OrderHistory";
import AiStylist from "./components/AiStylist";
import VirtualTryOn from "./components/VirtualTryOn";
import AiStudio from "./components/AiStudio";
import VendorDashboard from "./components/VendorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import WelcomeLogin from "./components/WelcomeLogin";

import { api, ApiError, clearToken, getToken } from "./api/client";
import { Product, CartItem, Order, Coupon, Notification, Address, UserRole, UserProfileData } from "./types";

export default function App() {
  const [booting, setBooting] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("customer");
  const [activeView, setActiveView] = useState<string>("home");

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [banner, setBanner] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setBanner(message);
    window.setTimeout(() => setBanner(null), 5000);
  }, []);

  /** Pull everything this user can see. Called on login and after checkout. */
  const loadUserData = useCallback(async (role: UserRole) => {
    const [productList, orderList] = await Promise.all([
      api.listProducts(),
      api.listOrders().catch(() => [] as Order[]),
    ]);
    setProducts(productList);
    setOrders(orderList);

    // Customers alone have a bag, a wishlist, and a bell.
    if (role === "customer") {
      const [cart, wishlist, notifs] = await Promise.all([
        api.getCart().catch(() => [] as CartItem[]),
        api.getWishlist().catch(() => [] as string[]),
        api.listNotifications().catch(() => [] as Notification[]),
      ]);
      setCartItems(cart);
      setWishlistIds(wishlist);
      setNotifications(notifs);
    }
  }, []);

  // Restore the session on refresh. A stored token that the backend rejects
  // is dropped rather than leaving the app half-authenticated.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!getToken()) {
        setBooting(false);
        return;
      }
      try {
        const profile = await api.getProfile();
        if (cancelled) return;
        setUserProfile(profile);
        setCurrentRole(profile.role);
        setIsLoggedIn(true);
        await loadUserData(profile.role);
      } catch (err) {
        clearToken();
        if (err instanceof ApiError && err.status === 0) {
          notify("Cannot reach the StyleSwap server. Start it with: cd backend && python run_all.py");
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadUserData, notify]);

  const cartCount = useMemo(() => cartItems.length, [cartItems]);
  const wishlistCount = useMemo(() => wishlistIds.length, [wishlistIds]);
  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const handleLogin = async (user: UserProfileData) => {
    setUserProfile(user);
    setCurrentRole(user.role);
    setIsLoggedIn(true);
    setActiveView("home");
    try {
      await loadUserData(user.role);
    } catch {
      notify("Signed in, but some data could not be loaded.");
    }
  };

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setUserProfile(null);
    setProducts([]);
    setCartItems([]);
    setWishlistIds([]);
    setOrders([]);
    setNotifications([]);
    setActiveView("home");
  };

  const handleAddToCart = async (product: Product, size: string, color: string, duration: number) => {
    try {
      // The server prices the line and returns the whole bag, so local state
      // is replaced rather than patched — no chance of drift.
      const cart = await api.addToCart({
        productId: product.id,
        selectedSize: size,
        selectedColor: color,
        rentalDuration: duration,
      });
      setCartItems(cart);
      notify(`${product.name} added to your bag.`);
      setNotifications(await api.listNotifications().catch(() => notifications));
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not add that item to your bag.");
    }
  };

  /** Add an AI-generated look. Only pieces that exist in the catalog can be
   *  rented, so unmatched suggestions are reported rather than invented. */
  const handleAddLookToCart = async (
    lookItems: { name: string; brand: string; price: number; type: string; description: string }[]
  ) => {
    const matched: Product[] = [];
    const missing: string[] = [];

    for (const item of lookItems) {
      const found = products.find(
        (p) =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(p.name.toLowerCase()) ||
          p.brand.toLowerCase() === item.brand.toLowerCase()
      );
      if (found) matched.push(found);
      else missing.push(item.name);
    }

    for (const product of matched) {
      await handleAddToCart(product, product.sizes[0] || "M", product.colors[0]?.name || "Neutral", 4);
    }

    if (matched.length === 0) {
      notify("None of these pieces are in the archive yet — nothing was added.");
      return;
    }
    if (missing.length > 0) {
      notify(`Added ${matched.length} piece(s). Not in the archive: ${missing.join(", ")}.`);
    }
    setActiveView("cart");
  };

  const handleUpdateDuration = async (id: string, days: number) => {
    try {
      setCartItems(await api.updateCartItem(id, days));
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not update the rental length.");
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await api.removeCartItem(id);
      setCartItems(await api.getCart());
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not remove that item.");
    }
  };

  const handleCheckout = (coupon: Coupon | null, discount: number) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
    setActiveView("checkout");
  };

  const handlePlaceOrder = async (address: Address, paymentMethod: string) => {
    try {
      // Only ids go up. The server reads the cart, reprices it, revalidates
      // the coupon, and computes the total itself.
      await api.placeOrder({
        deliveryAddressId: address.id,
        paymentMethod,
        couponCode: appliedCoupon?.code,
      });
      const [freshOrders, freshCart, freshNotifs] = await Promise.all([
        api.listOrders(),
        api.getCart(),
        api.listNotifications().catch(() => notifications),
      ]);
      setOrders(freshOrders);
      setCartItems(freshCart);
      setNotifications(freshNotifs);
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setActiveView("orders");
      notify("Order placed successfully.");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not place your order.");
    }
  };

  const handleToggleWishlist = async (product: Product) => {
    const previous = wishlistIds;
    // Optimistic: the heart should respond instantly. Rolled back on failure.
    setWishlistIds((prev) =>
      prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
    try {
      const { productIds } = await api.toggleWishlist(product.id);
      setWishlistIds(productIds);
    } catch (err) {
      setWishlistIds(previous);
      notify(err instanceof ApiError ? err.message : "Could not update your wishlist.");
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.markNotificationRead(id);
    } catch {
      /* Cosmetic only — a failed read-receipt isn't worth interrupting the user. */
    }
  };

  const handleUpdateProfile = async (updated: Partial<UserProfileData>) => {
    try {
      setUserProfile(
        await api.updateProfile({
          name: updated.name,
          phone: updated.phone,
          profilePic: updated.profilePic,
        })
      );
      notify("Profile updated.");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not update your profile.");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveView("browse");
  };

  const handleTriggerReturnScan = async (orderId: string, _itemId: string, damagePreset: string) => {
    // The fee comes back from the server; the client never proposes one.
    const result = await api.returnScan(orderId, damagePreset);
    setOrders(await api.listOrders());
    setNotifications(await api.listNotifications().catch(() => notifications));
    return result;
  };

  const handleAddListing = async (newProduct: Product) => {
    try {
      await api.createProduct({
        name: newProduct.name,
        category: newProduct.category,
        subCategory: newProduct.subCategory,
        brand: newProduct.brand,
        description: newProduct.description,
        image: newProduct.image,
        gallery: newProduct.gallery,
        sizes: newProduct.sizes,
        colors: newProduct.colors,
        rentalPrice: newProduct.rentalPrice,
        securityDeposit: newProduct.securityDeposit,
        vendorName: newProduct.vendorName,
        badge: newProduct.badge,
      });
      setProducts(await api.listProducts());
      notify(`${newProduct.name} is now listed.`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not create that listing.");
    }
  };

  const handleUpdateProductPrice = async (id: string, newPrice: number) => {
    try {
      await api.updateProduct(id, { rentalPrice: newPrice });
      setProducts(await api.listProducts());
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not update the price.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      setOrders(await api.listOrders());
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Could not update the order status.");
    }
  };

  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product);
    setActiveView("product-details");
    try {
      // Refetch for the full review list, which the list endpoint trims.
      setSelectedProduct(await api.getProduct(product.id));
    } catch {
      /* Keep the list version — it renders fine without the extra reviews. */
    }
  };

  const renderView = () => {
    if (currentRole === "vendor") {
      return (
        <VendorDashboard
          products={products}
          onAddListing={handleAddListing}
          onUpdateProductPrice={handleUpdateProductPrice}
          incomingOrders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          vendorUserId={userProfile?.id}
        />
      );
    }

    if (currentRole === "admin") {
      return (
        <AdminDashboard
          products={products}
          ordersCount={orders.length}
          currentUserId={userProfile?.id ?? ""}
        />
      );
    }

    switch (activeView) {
      case "home":
        return (
          <CustomerHome
            products={products}
            onProductClick={handleProductClick}
            onViewChange={setActiveView}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />
        );
      case "browse":
        return (
          <BrowseProducts
            products={products}
            onProductClick={handleProductClick}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            initialSearchQuery={searchQuery}
          />
        );
      case "product-details":
        if (!selectedProduct) {
          setActiveView("home");
          return null;
        }
        return (
          <ProductDetails
            product={selectedProduct}
            onBack={() => {
              setSelectedProduct(null);
              setActiveView("browse");
            }}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            allProducts={products}
            onProductClick={handleProductClick}
          />
        );
      case "cart":
        return (
          <CartPage
            cartItems={cartItems}
            onUpdateDuration={handleUpdateDuration}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
            onViewChange={setActiveView}
          />
        );
      case "checkout":
        return (
          <CheckoutPage
            cartItems={cartItems}
            userProfile={userProfile}
            appliedCoupon={appliedCoupon}
            discountAmount={discountAmount}
            onPlaceOrder={handlePlaceOrder}
            onCancel={() => setActiveView("cart")}
          />
        );
      case "profile":
        return (
          <UserProfile
            userProfile={userProfile}
            wishlistProducts={wishlistProducts}
            onRemoveWishlist={handleToggleWishlist}
            onProductClick={handleProductClick}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case "orders":
        return (
          <OrderHistory
            orders={orders}
            onTriggerReturnScan={handleTriggerReturnScan}
            onViewChange={setActiveView}
          />
        );
      case "stylist":
        return <AiStylist onAddLookToCart={handleAddLookToCart} onViewChange={setActiveView} />;
      case "tryon":
        return <VirtualTryOn products={products} onViewChange={setActiveView} />;
      case "studio":
        return <AiStudio />;
      default:
        return (
          <CustomerHome
            products={products}
            onProductClick={handleProductClick}
            onViewChange={setActiveView}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />
        );
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#DADADA] border-t-[#1C1C1C] rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg text-[#1C1C1C]">StyleSwap</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !userProfile) {
    return <WelcomeLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1C1C] font-sans antialiased selection:bg-[#FAF9F6]">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeView={activeView}
        onViewChange={setActiveView}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        userProfile={userProfile}
        onSearch={handleSearch}
        onLogout={handleLogout}
      />

      {banner && (
        <div className="fixed top-24 right-6 z-50 max-w-sm bg-[#1C1C1C] text-white text-xs font-sans px-5 py-4 rounded-2xl shadow-lg animate-fadeIn">
          {banner}
        </div>
      )}

      <main className="w-full">{renderView()}</main>
    </div>
  );
}

import React, { useState, useMemo } from "react";
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

import { INITIAL_PRODUCTS, INITIAL_USER, INITIAL_NOTIFICATIONS } from "./data";
import { Product, CartItem, Order, Coupon, Notification, Address, UserRole } from "./types";

const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-829103",
    items: [
      {
        id: "cart-init-1",
        product: INITIAL_PRODUCTS[1], // Textured Bouclé Blazer
        selectedSize: "M",
        selectedColor: "Oatmeal Beige",
        rentalDuration: 4,
        startDate: "2026-07-10",
        securityDeposit: INITIAL_PRODUCTS[1].securityDeposit,
        totalPrice: INITIAL_PRODUCTS[1].rentalPrice * 4
      }
    ],
    totalAmount: (INITIAL_PRODUCTS[1].rentalPrice * 4) + INITIAL_PRODUCTS[1].securityDeposit,
    status: "Currently Rented",
    date: "2026-07-10",
    deliveryAddress: INITIAL_USER.addresses[0],
    paymentMethod: "Razorpay (Online)",
    returnStatus: "Pending"
  }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("customer");
  const [activeView, setActiveView] = useState<string>("home");
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Basket & Lists state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(["prod-1", "prod-4"]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [userProfile, setUserProfile] = useState<any>({
    ...INITIAL_USER,
    avatar: INITIAL_USER.profilePic // Ensure avatar mapping exists
  });

  // Coupon & Search states
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Lists count computed values
  const cartCount = useMemo(() => cartItems.length, [cartItems]);
  const wishlistCount = useMemo(() => wishlistIds.length, [wishlistIds]);

  const wishlistProducts = useMemo(() => {
    return products.filter((p) => wishlistIds.includes(p.id));
  }, [products, wishlistIds]);

  // Handle addition of items into the bag
  const handleAddToCart = (product: Product, size: string, color: string, duration: number) => {
    const isExisting = cartItems.find(
      (item) => item.product.id === product.id && item.selectedSize === size && item.selectedColor === color
    );

    if (isExisting) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === isExisting.id
            ? {
                ...item,
                rentalDuration: item.rentalDuration + duration,
                totalPrice: item.totalPrice + (product.rentalPrice * duration),
              }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: "cart-" + Date.now() + Math.random().toString(36).substring(2, 7),
        product,
        selectedSize: size,
        selectedColor: color,
        rentalDuration: duration,
        startDate: new Date().toISOString().split("T")[0],
        securityDeposit: product.securityDeposit,
        totalPrice: product.rentalPrice * duration,
      };
      setCartItems((prev) => [...prev, newItem]);
    }

    // Spawn high-polish confirmation notice
    const newNotif: Notification = {
      id: "not-" + Date.now(),
      title: "Item Added to Bag",
      message: `${product.name} (Size: ${size}, Color: ${color}) added to your rental workspace.`,
      type: "promo",
      date: "Just now",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Helper routine to bulk add look to cart
  const handleAddLookToCart = (
    lookItems: { name: string; brand: string; price: number; type: string; description: string }[],
    totalPrice: number
  ) => {
    lookItems.forEach((item) => {
      let foundProduct = products.find(
        (p) =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          p.brand.toLowerCase().includes(item.brand.toLowerCase())
      );

      if (!foundProduct) {
        foundProduct = {
          id: "prod-temp-" + Date.now() + Math.floor(Math.random() * 1000),
          name: item.name,
          brand: item.brand,
          category: (item.type === "dress"
            ? "Women"
            : item.type === "shoes"
            ? "Shoes"
            : item.type === "handbag"
            ? "Handbags"
            : "Jewellery") as any,
          subCategory: "AI Stylist Curation",
          description: item.description,
          image:
            item.type === "dress"
              ? "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600"
              : item.type === "shoes"
              ? "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=600"
              : item.type === "handbag"
              ? "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600"
              : "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600",
          gallery: [],
          sizes: ["S", "M", "L", "One Size"],
          colors: [{ name: "Curated Neutral", hex: "#D3C6B8" }],
          rentalPrice: item.price,
          securityDeposit: Math.ceil(item.price * 4),
          vendorName: "Aura Premium Archives",
          vendorVerified: "Verified Vendor",
          rating: 4.9,
          reviewsCount: 1,
          status: "Available",
          deliveryDate: "Tomorrow",
          reviews: [],
        };
      }

      handleAddToCart(
        foundProduct,
        foundProduct.sizes[0] || "M",
        foundProduct.colors[0]?.name || "Curated Neutral",
        4
      );
    });

    setActiveView("cart");
  };

  const handleUpdateDuration = (id: string, days: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rentalDuration: days, totalPrice: item.product.rentalPrice * days } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = (coupon: Coupon | null, discount: number) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
    setActiveView("checkout");
  };

  const handlePlaceOrder = (address: Address, paymentMethod: string) => {
    const rentalTotal = cartItems.reduce((acc, item) => acc + item.product.rentalPrice * item.rentalDuration, 0);
    const securityDepositTotal = cartItems.reduce((acc, item) => acc + item.product.securityDeposit, 0);
    const grandTotal = rentalTotal + securityDepositTotal - discountAmount;

    const newOrder: Order = {
      id: "ord-" + Math.floor(100000 + Math.random() * 900000),
      items: [...cartItems],
      totalAmount: grandTotal,
      status: "Booked",
      date: new Date().toISOString().split("T")[0],
      deliveryAddress: address,
      paymentMethod: paymentMethod as any,
      returnStatus: "Pending",
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);

    const confirmationNotif: Notification = {
      id: "not-" + Date.now(),
      title: "Order Placed Successfully",
      message: `Your rental transaction for ${cartItems.map((i) => i.product.name).join(", ")} has been completed.`,
      type: "delivery",
      date: "Just now",
      read: false,
    };
    setNotifications((prev) => [confirmationNotif, ...prev]);
    setActiveView("orders");
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) =>
      prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleUpdateProfile = (updated: any) => {
    setUserProfile(updated);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Automated return scan trigger calling backend API proxy
  const handleTriggerReturnScan = async (orderId: string, itemId: string, damagePreset: string) => {
    try {
      const res = await fetch("/api/damage-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ damagePreset }),
      });

      if (!res.ok) throw new Error("Damage API error");
      const scanResult = await res.json();

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            status: damagePreset === "perfect" ? "Returned" : "Under Maintenance",
            returnStatus: "Under Inspection",
            damageReport: {
              severity: damagePreset === "perfect" ? "None" : damagePreset === "stain" ? "Minor" : "Major",
              description: scanResult.damageSummary,
              charge: scanResult.feeCharged,
            },
          };
        })
      );

      // Trigger automatic warning notification if damage exists
      if (damagePreset !== "perfect") {
        const warningNotif: Notification = {
          id: "not-warn-" + Date.now(),
          title: "Damage Inspection Flagged",
          message: `Drape integrity scan returned warning: ${scanResult.damageSummary}. A recovery fee of ₹${scanResult.feeCharged} was noted.`,
          type: "return",
          date: "Just now",
          read: false,
        };
        setNotifications((prev) => [warningNotif, ...prev]);
      } else {
        const cleanNotif: Notification = {
          id: "not-clean-" + Date.now(),
          title: "Garment Return Logged",
          message: "Excellent! Your returned item passed integrity clearance logs in perfect condition.",
          type: "return",
          date: "Just now",
          read: false,
        };
        setNotifications((prev) => [cleanNotif, ...prev]);
      }

      return scanResult;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Vendor Portal Handlers
  const handleAddListing = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleUpdateProductPrice = (id: string, newPrice: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, rentalPrice: newPrice } : p)));
  };

  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: status as any } : o)));
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveView("product-details");
  };

  // Rendering Routing Core logic
  const renderView = () => {
    if (currentRole === "vendor") {
      return (
        <VendorDashboard
          products={products}
          onAddListing={handleAddListing}
          onUpdateProductPrice={handleUpdateProductPrice}
          incomingOrders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />
      );
    }

    if (currentRole === "admin") {
      return <AdminDashboard products={products} ordersCount={orders.length} />;
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

  if (!isLoggedIn) {
    return (
      <WelcomeLogin
        onLogin={(user, role) => {
          setUserProfile(user);
          setCurrentRole(role);
          setIsLoggedIn(true);
          if (role === "customer") {
            setActiveView("home");
          } else if (role === "vendor") {
            setActiveView("vendor-dashboard");
          } else {
            setActiveView("admin-dashboard");
          }
        }}
      />
    );
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
        onLogout={() => setIsLoggedIn(false)}
      />
      
      <main className="w-full">
        {renderView()}
      </main>
    </div>
  );
}

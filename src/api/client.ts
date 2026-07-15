/**
 * Single entry point for every backend call.
 *
 * Vite proxies /api and /ai to the gateway on :8000 (see vite.config.ts), so
 * paths stay relative and the browser sees one origin.
 */
import { Address, CartItem, Coupon, Notification, Order, Product, Review, UserProfileData, UserRole } from "../types";

const TOKEN_KEY = "styleswap.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Thrown for any non-2xx. `status` lets callers special-case 401/403/503. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects on network failure — the backend being down.
    throw new ApiError("Cannot reach the StyleSwap server. Is the backend running?", 0);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // A proxy error or HTML page rather than our JSON.
      throw new ApiError(`Unexpected non-JSON response (HTTP ${res.status})`, res.status);
    }
  }

  if (!res.ok) {
    // An expired or invalid token should not leave the app in a half-logged-in
    // state — drop it so the next mount lands on the login screen.
    if (res.status === 401) clearToken();
    throw new ApiError(payload?.error || `Request failed (HTTP ${res.status})`, res.status);
  }

  return payload as T;
}

// ---------------------------------------------------------------- auth
export interface AuthResponse {
  token: string;
  user: UserProfileData;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  register: (name: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
      auth: false,
    }),

  getProfile: () => request<UserProfileData>("/api/user/profile"),

  updateProfile: (patch: Partial<Pick<UserProfileData, "name" | "phone" | "profilePic">>) =>
    request<UserProfileData>("/api/user/profile", { method: "PUT", body: patch }),

  // ------------------------------------------------------------ addresses
  listAddresses: () => request<Address[]>("/api/user/addresses"),

  createAddress: (address: Omit<Address, "id">) =>
    request<Address>("/api/user/addresses", { method: "POST", body: address }),

  updateAddress: (id: string, patch: Partial<Omit<Address, "id">>) =>
    request<Address>(`/api/user/addresses/${id}`, { method: "PUT", body: patch }),

  deleteAddress: (id: string) =>
    request<{ success: boolean }>(`/api/user/addresses/${id}`, { method: "DELETE" }),

  // ------------------------------------------------------------- catalog
  listProducts: (filters?: { category?: string; search?: string; vendorUserId?: string }) => {
    const qs = new URLSearchParams();
    if (filters?.category) qs.set("category", filters.category);
    if (filters?.search) qs.set("search", filters.search);
    if (filters?.vendorUserId) qs.set("vendorUserId", filters.vendorUserId);
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<Product[]>(`/api/products${suffix}`, { auth: false });
  },

  getProduct: (id: string) => request<Product>(`/api/products/${id}`, { auth: false }),

  createProduct: (product: Partial<Product>) =>
    request<Product>("/api/products", { method: "POST", body: product }),

  updateProduct: (id: string, patch: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: "PUT", body: patch }),

  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/api/products/${id}`, { method: "DELETE" }),

  createReview: (productId: string, review: { rating: number; comment: string; variant?: string }) =>
    request<Review>(`/api/products/${productId}/reviews`, { method: "POST", body: review }),

  // ---------------------------------------------------------------- cart
  getCart: () => request<CartItem[]>("/api/cart"),

  addToCart: (item: {
    productId: string;
    selectedSize: string;
    selectedColor: string;
    rentalDuration: number;
  }) => request<CartItem[]>("/api/cart", { method: "POST", body: item }),

  updateCartItem: (cartItemId: string, rentalDuration: number) =>
    request<CartItem[]>(`/api/cart/${cartItemId}`, { method: "PUT", body: { rentalDuration } }),

  removeCartItem: (cartItemId: string) =>
    request<{ success: boolean }>(`/api/cart/${cartItemId}`, { method: "DELETE" }),

  // ------------------------------------------------------------ wishlist
  getWishlist: () => request<string[]>("/api/wishlist"),

  toggleWishlist: (productId: string) =>
    request<{ added: boolean; productIds: string[] }>("/api/wishlist", {
      method: "POST",
      body: { productId },
    }),

  // -------------------------------------------------------------- orders
  listOrders: () => request<Order[]>("/api/orders"),

  placeOrder: (payload: {
    deliveryAddressId: string;
    paymentMethod: string;
    couponCode?: string;
  }) => request<{ success: boolean; order: Order }>("/api/orders", { method: "POST", body: payload }),

  updateOrderStatus: (orderId: string, status: string) =>
    request<Order>(`/api/orders/${orderId}/status`, { method: "PUT", body: { status } }),

  returnScan: (orderId: string, damagePreset: string) =>
    request<{
      condition: string;
      damageSummary: string;
      feeCharged: number;
      resolvable: boolean;
      actionRequired: string;
      order: Order;
    }>(`/api/orders/${orderId}/return-scan`, { method: "POST", body: { damagePreset } }),

  // ------------------------------------------------------------- coupons
  listCoupons: () => request<Coupon[]>("/api/coupons", { auth: false }),

  validateCoupon: (code: string, subtotal: number) =>
    request<{ valid: boolean; coupon: Coupon; discountAmount: number }>("/api/coupons/validate", {
      method: "POST",
      body: { code, subtotal },
    }),

  createCoupon: (coupon: Coupon) =>
    request<Coupon>("/api/coupons", { method: "POST", body: coupon }),

  deactivateCoupon: (code: string) =>
    request<{ success: boolean; code: string }>(`/api/coupons/${code}`, { method: "DELETE" }),

  // ------------------------------------------------------- notifications
  listNotifications: () => request<Notification[]>("/api/notifications"),

  markNotificationRead: (id: string) =>
    request<Notification>(`/api/notifications/${id}/read`, { method: "PUT" }),

  // ------------------------------------------------------------- admin
  listUsers: () => request<UserProfileData[]>("/api/user/admin/users"),

  setUserRole: (userId: string, role: UserRole) =>
    request<UserProfileData>(`/api/user/users/${userId}/role`, {
      method: "PUT",
      body: { role },
    }),

  getAnalytics: () =>
    request<{
      totalRevenue: number;
      activeRentals: number;
      totalUsers: number;
      averageSustainability: number;
      totalProducts: number;
      perfectReturns: number;
      damagedReturns: number;
      returnRatePercentage: number;
      categoryDistribution: { name: string; value: number }[];
      rentTrends: { month: string; rentals: number; revenue: number }[];
    }>("/api/admin/analytics"),

  // ---------------------------------------------------------------- AI
  stylist: (params: {
    occasion: string;
    budget: string | number;
    bodyType: string;
    colors: string;
    style: string;
    weather: string;
  }) => request<any>("/ai/stylist", { method: "POST", body: params }),

  sizeRecommendation: (params: {
    height: string | number;
    weight: string | number;
    preferredFit: string;
    itemBrand: string;
  }) =>
    request<{ recommendedSize: string; confidenceScore: string; reasoning: string }>(
      "/ai/size-recommendation",
      { method: "POST", body: params }
    ),

  aiSearch: (query: string) =>
    request<{ productId: string; relevanceScore: number; relevanceExplanation: string }[]>(
      "/ai/search",
      { method: "POST", body: { query } }
    ),

  tryOn: (params: {
    avatarUrl: string;
    productUrl: string;
    productName: string;
    avatarName: string;
    productBrand: string;
  }) =>
    request<{ imageUrl: string; fitReview: string; toneHarmony: string; styleScore: string }>(
      "/ai/tryon",
      { method: "POST", body: params }
    ),

  generateImage: (prompt: string, aspectRatio = "1:1") =>
    request<{ imageUrl: string; isFallback: boolean }>("/ai/generate-image", {
      method: "POST",
      body: { prompt, aspectRatio },
    }),
};

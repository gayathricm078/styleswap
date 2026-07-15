export type UserRole = "customer" | "vendor" | "admin";

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePic: string;
  sustainabilityScore: number; // e.g. 85 out of 100 based on rentals vs new purchases
  rewardPoints: number;
  tier: "Silver" | "Gold" | "Premium";
  addresses: Address[];
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  variant: string;
}

export interface Product {
  id: string;
  name: string;
  category: "Women" | "Men" | "Kids" | "Wedding" | "Jewellery" | "Shoes" | "Handbags" | "Home Decoration";
  subCategory: string;
  brand: string;
  description: string;
  image: string; // Arch/Ovals styled via Tailwind
  gallery: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  rentalPrice: number; // Per day
  securityDeposit: number;
  vendorName: string;
  vendorUserId?: string | null; // owner; null for seeded archive stock
  vendorVerified: "Verified Vendor" | "Trusted Vendor" | "Standard";
  rating: number;
  reviewsCount: number;
  badge?: "Trending" | "Bestseller" | "Premium" | "New" | "Most Rented" | "Customer Favorite";
  status: "Available" | "Booked" | "Out For Delivery" | "Currently Rented" | "Returned" | "Under Maintenance";
  deliveryDate: string;
  reviews: Review[];
}

export interface CartItem {
  id: string; // unique cart item id
  product: Product;
  selectedSize: string;
  selectedColor: string;
  rentalDuration: number; // default e.g. 4, 7, 14 days
  startDate: string;
  securityDeposit: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: "Booked" | "Out For Delivery" | "Currently Rented" | "Returned" | "Under Maintenance" | "Pending Approval" | "Rejected";
  date: string;
  deliveryAddress: Address;
  paymentMethod: "Razorpay (Online)" | "Cash on Delivery";
  returnStatus?: "Pending" | "Under Inspection" | "Returned In Perfect Condition" | "Damage Detected" | "Resolved";
  damageReport?: {
    severity: "None" | "Minor" | "Major";
    description: string;
    charge: number;
    imageUrl?: string;
  };
}

export interface Coupon {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  description: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "reminder" | "delivery" | "return" | "ai" | "promo";
  date: string;
  read: boolean;
}

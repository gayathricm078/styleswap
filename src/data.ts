import { Product, UserProfileData, Coupon, Notification } from "./types";

export const CATEGORIES = [
  { id: "Wedding", name: "Wedding Collection", count: 142 },
  { id: "Women", name: "Women Collection", count: 489 },
  { id: "Men", name: "Men Collection", count: 324 },
  { id: "Kids", name: "Kids Collection", count: 156 },
  { id: "Jewellery", name: "Jewellery", count: 215 },
  { id: "Shoes", name: "Shoes", count: 184 },
  { id: "Handbags", name: "Handbags", count: 198 },
  { id: "Home Decoration", name: "Home Decoration", count: 125 },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Silk Halter Wedding Gown",
    category: "Wedding",
    subCategory: "Bridal Gowns",
    brand: "L’Aura Bridal",
    description: "An elegant, backless halter-neck gown draped in 100% heavy mulberry silk. Subtle cowl neckline, fluid court train, and seamless tailoring create an ethereal silhouette for the modern bride. Sourced sustainably with clean-washing certificates.",
    image: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Alabaster White", hex: "#FAF9F6" },
      { name: "Champagne Cream", hex: "#F3EED9" }
    ],
    rentalPrice: 75,
    securityDeposit: 350,
    vendorName: "Aura Premium Archives",
    vendorVerified: "Trusted Vendor",
    rating: 4.9,
    reviewsCount: 24,
    badge: "Premium",
    status: "Available",
    deliveryDate: "Tomorrow",
    reviews: [
      {
        id: "rev-1",
        userName: "Eleanor Vance",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
        rating: 5,
        comment: "Wore this for my pre-wedding shoot. Absolute perfection, the drape is incredible and feels incredibly luxurious. Returning it was seamless.",
        date: "2026-06-25",
        variant: "XS / Alabaster White"
      }
    ]
  },
  {
    id: "prod-2",
    name: "Textured Bouclé Blazer",
    category: "Women",
    subCategory: "Blazers & Jackets",
    brand: "COS Premium",
    description: "A tailored oversized blazer woven with a heavy, textured wool-blend bouclé. Features structured shoulders, slim notch lapels, and custom tortoiseshell buttons. Ideal for sophisticated daywear or formal meetings.",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Oatmeal Beige", hex: "#E6DFD3" },
      { name: "Off-White", hex: "#FAF9F6" }
    ],
    rentalPrice: 18,
    securityDeposit: 80,
    vendorName: "Atelier COS Resell",
    vendorVerified: "Verified Vendor",
    rating: 4.7,
    reviewsCount: 18,
    badge: "Trending",
    status: "Available",
    deliveryDate: "In 2 days",
    reviews: [
      {
        id: "rev-2",
        userName: "Sofia Martinez",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
        rating: 5,
        comment: "Excellent quality. Loved the oversized silhouette. Pairs beautifully with wide-leg trousers.",
        date: "2026-07-01",
        variant: "M / Oatmeal Beige"
      }
    ]
  },
  {
    id: "prod-3",
    name: "Linen Double-Breasted Suit",
    category: "Men",
    subCategory: "Suits",
    brand: "Mango Man Tailoring",
    description: "Unstructured double-breasted suit jacket crafted from breathable, luxury Italian flax linen. Features soft shoulders, peak lapels, and dual patch pockets for a relaxed yet highly tailored summer-smart aesthetic.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["46 (S)", "48 (M)", "50 (L)", "52 (XL)"],
    colors: [
      { name: "Desert Sand", hex: "#D2C5B4" },
      { name: "Charcoal Slate", hex: "#3A3A3A" }
    ],
    rentalPrice: 28,
    securityDeposit: 120,
    vendorName: "Tailored Closet Co.",
    vendorVerified: "Verified Vendor",
    rating: 4.8,
    reviewsCount: 15,
    badge: "Bestseller",
    status: "Available",
    deliveryDate: "In 3 days",
    reviews: [
      {
        id: "rev-3",
        userName: "Alistair G.",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
        rating: 5,
        comment: "Fit was exactly as estimated by the AI Size tool. Crisp fabric, perfect for a vineyard wedding.",
        date: "2026-06-18",
        variant: "48 (M) / Desert Sand"
      }
    ]
  },
  {
    id: "prod-4",
    name: "18K Gold Plated Arch Earrings",
    category: "Jewellery",
    subCategory: "Earrings",
    brand: "Savoir Jewelry",
    description: "Brutalist, architectural-inspired drop earrings. Cast in recycled sterling silver and hand-plated in heavy 18-karat yellow gold. Brushed satin finish reflecting subtle light. Ultra-lightweight for comfortable, secure wear.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Brushed Gold", hex: "#D4AF37" }
    ],
    rentalPrice: 12,
    securityDeposit: 50,
    vendorName: "Savoir Archives",
    vendorVerified: "Trusted Vendor",
    rating: 4.9,
    reviewsCount: 31,
    badge: "Customer Favorite",
    status: "Available",
    deliveryDate: "Tomorrow",
    reviews: [
      {
        id: "rev-4",
        userName: "Chloe Bennet",
        userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
        rating: 5,
        comment: "Breathtakingly minimal. Added just the right amount of sophistication to my simple linen dress.",
        date: "2026-07-05",
        variant: "One Size / Brushed Gold"
      }
    ]
  },
  {
    id: "prod-5",
    name: "Structured Minimalist Tote",
    category: "Handbags",
    subCategory: "Totes",
    brand: "Aesop Atelier",
    description: "A seamless, architectural handbag crafted from premium vegetable-tanned Italian calf leather. Unlined raw interior with a magnetic snap clasp and a delicate gold embossed stamp. Large enough for a laptop or portfolio.",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["Medium"],
    colors: [
      { name: "Warm Taupe", hex: "#B8A898" },
      { name: "Noir Black", hex: "#232323" }
    ],
    rentalPrice: 22,
    securityDeposit: 100,
    vendorName: "Aesop Leather Vault",
    vendorVerified: "Trusted Vendor",
    rating: 4.6,
    reviewsCount: 14,
    badge: "New",
    status: "Available",
    deliveryDate: "In 2 days",
    reviews: []
  },
  {
    id: "prod-6",
    name: "Suede Pointed Chelsea Boots",
    category: "Shoes",
    subCategory: "Boots",
    brand: "Saint Laurent Style",
    description: "Pointed-toe Chelsea boots crafted in Italy with premium sand-colored suede leather. Elastic side panels, premium leather soles, and a elegant tapered heel that elevates any tailoring outfit.",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["38", "39", "40", "41", "42"],
    colors: [
      { name: "Sand Suede", hex: "#D3C6B8" }
    ],
    rentalPrice: 25,
    securityDeposit: 150,
    vendorName: "Le Premiere Rent",
    vendorVerified: "Trusted Vendor",
    rating: 4.7,
    reviewsCount: 9,
    badge: "Most Rented",
    status: "Available",
    deliveryDate: "In 3 days",
    reviews: []
  },
  {
    id: "prod-7",
    name: "Sculptural Ceramic Pottery Vase",
    category: "Home Decoration",
    subCategory: "Vases",
    brand: "Studio Minimalist",
    description: "A gorgeous handmade unglazed sandstone vase with a modern sculptural organic arch form. Captures warm shadow play and elevates luxury living spaces.",
    image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["Regular"],
    colors: [
      { name: "Clay Sand", hex: "#EFEBE4" }
    ],
    rentalPrice: 8,
    securityDeposit: 30,
    vendorName: "Clay & Craft Co.",
    vendorVerified: "Verified Vendor",
    rating: 4.8,
    reviewsCount: 11,
    badge: "New",
    status: "Available",
    deliveryDate: "Tomorrow",
    reviews: []
  },
  {
    id: "prod-8",
    name: "Chunky Knit Cashmere Throw",
    category: "Home Decoration",
    subCategory: "Throws",
    brand: "Aesop Home",
    description: "Ultra-heavy knit throw blanket spun from 100% grade-A Mongolian cashmere. Woven in neutral sand and cream hues with a tactile ribbed border. Impeccable weight and softness for luxurious home styling.",
    image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["Queen Size"],
    colors: [
      { name: "Cream Cashmere", hex: "#FAF8F4" }
    ],
    rentalPrice: 15,
    securityDeposit: 90,
    vendorName: "Aesop Home Archives",
    vendorVerified: "Trusted Vendor",
    rating: 4.9,
    reviewsCount: 15,
    badge: "Premium",
    status: "Available",
    deliveryDate: "Tomorrow",
    reviews: []
  },
  {
    id: "prod-9",
    name: "Organic Linen Child Romper",
    category: "Kids",
    subCategory: "Rompers",
    brand: "COS Kids Premium",
    description: "A soft, hypoallergenic romper woven in breathable organic linen. Features wooden buttons down the front, adjustable cross-back shoulder straps, and easy snap closures at the inseam. Beautiful minimalist neutral kidswear.",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eb6?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1519689680058-324335c77eb6?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["6-12M", "12-18M", "2Y", "3Y"],
    colors: [
      { name: "Oat Oatmeal", hex: "#E9E3D8" }
    ],
    rentalPrice: 9,
    securityDeposit: 35,
    vendorName: "COS Kids Resell",
    vendorVerified: "Standard",
    rating: 4.5,
    reviewsCount: 6,
    badge: "New",
    status: "Available",
    deliveryDate: "In 2 days",
    reviews: []
  },
  {
    id: "prod-10",
    name: "Classic Structured Trench Coat",
    category: "Men",
    subCategory: "Coats & Jackets",
    brand: "COS Tailored",
    description: "A timeless, double-breasted trench coat tailored in high-density water-resistant organic cotton gabardine. Features a removable waist belt, horn-style buttons, deep epaulets, and a rear ventilation storm flap. Perfect layering piece.",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600",
    gallery: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["48 (M)", "50 (L)", "52 (XL)"],
    colors: [
      { name: "Classic Caramel", hex: "#C2A782" },
      { name: "Slate Shadow", hex: "#4E4E4E" }
    ],
    rentalPrice: 24,
    securityDeposit: 110,
    vendorName: "Atelier COS Resell",
    vendorVerified: "Verified Vendor",
    rating: 4.8,
    reviewsCount: 11,
    badge: "Trending",
    status: "Available",
    deliveryDate: "In 2 days",
    reviews: []
  }
];

export const INITIAL_USER: UserProfileData = {
  id: "user-default",
  name: "Victoria Fontaine",
  email: "cmgayathricmgayathri@gmail.com",
  phone: "+1 (555) 019-2834",
  role: "customer",
  profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  sustainabilityScore: 89, // Out of 100. High score reflects eco-conscious fashion renting
  rewardPoints: 1250,
  tier: "Gold",
  addresses: [
    {
      id: "addr-1",
      label: "Townhouse Residence (Default)",
      street: "742 Fifth Avenue, Apt 4B",
      city: "New York",
      state: "NY",
      zip: "10019",
      isDefault: true,
    },
    {
      id: "addr-2",
      label: "Summer Cottage",
      street: "18 Dune Road",
      city: "East Hampton",
      state: "NY",
      zip: "11937",
      isDefault: false,
    }
  ]
};

export const COUPONS: Coupon[] = [
  { code: "STYLE20", discountType: "percentage", value: 20, description: "20% off your entire rental order" },
  { code: "ECOLUXE", discountType: "fixed", value: 15, description: "₹15 off for high sustainability rating" },
  { code: "FIRSTSWAP", discountType: "fixed", value: 10, description: "₹10 discount on your first rental" }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "not-1",
    title: "Upcoming Return Reminder",
    message: "Your rental 'Textured Bouclé Blazer' is due back in 2 days. Secure return pickup is scheduled for Wednesday.",
    type: "return",
    date: "1 hour ago",
    read: false
  },
  {
    id: "not-2",
    title: "AI Stylist Recommendation",
    message: "Based on your interest in beige blazers, our AI Stylist generated a custom look for your upcoming 'Gallery Opening' event.",
    type: "ai",
    date: "4 hours ago",
    read: false
  },
  {
    id: "not-3",
    title: "Delivery Successfully Dispatched",
    message: "Your '18K Gold Plated Arch Earrings' have left the Savior Jewelry archive. Tracking details inside.",
    type: "delivery",
    date: "Yesterday",
    read: true
  },
  {
    id: "not-4",
    title: "Ecoluxe Sustainability Milestone",
    message: "Congratulations! You saved 4.2kg of textile waste and 14,000 liters of water this month by opting to swap instead of buy.",
    type: "promo",
    date: "3 days ago",
    read: true
  }
];

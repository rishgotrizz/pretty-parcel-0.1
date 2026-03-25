export type ProductCategory =
  | "Bouquets"
  | "Portraits"
  | "Keychains"
  | "Gift Hampers"
  | "Scrapbooks"
  | "Custom Frames";

export type UserRole = "user" | "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "paid"
  | "processing"
  | "out_for_delivery";

export type CouponType = "percentage" | "fixed";

export interface ProductReview {
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProductType {
  _id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: ProductCategory;
  tags: string[];
  stock: number;
  views?: number;
  popularity: number;
  isFeatured: boolean;
  isSpecial?: boolean;
  isActive: boolean;
  isDeleted?: boolean;
  images: string[];
  specifications: string[];
  customisationNotes?: string;
  reviews: ProductReview[];
  seo?: {
    title?: string;
    description?: string;
  };
  flashSale?: {
    isActive: boolean;
    price: number;
    endsAt: string;
  };
}

export interface CartLine {
  product: ProductType;
  quantity: number;
  unitPrice: number;
}

export interface CouponSummary {
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderValue?: number;
  autoApply: boolean;
}

export interface StoreReview {
  _id: string;
  name: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

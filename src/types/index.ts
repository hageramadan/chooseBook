// types/index.ts
export interface ProductData {
  id: number;
  type: string;
  is_active: boolean;
  is_most_selling:boolean;
  name: string;
  description: string;
  category: {
    id: number;
    name: string;
    subcategories: any[];
    image: string;
  };
  subcategory: any;
  brand: any;
  has_production_date: boolean;
  pricing: {
    price: number;
    has_discount: boolean;
    discount_type: string | null;
    discount_value: number | null;
    price_after_discount: number | null;
    final_price: number;
  };
  has_variants: boolean;
  variants: any;
  quantity: number;
  images: string[];
}

export interface Filters {
  minPrice: number | null;
  maxPrice: number | null;
  categories: number[];
  colors: string[];
  sizes: string[];
  brands: string[];
}

export interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  next_page: string | null;
  previous_page: string | null;
}
// src/services/cart.ts

import { getHeaders } from "./api";

export interface ProductPricing {
  price: number;
  has_discount: boolean;
  discount_type: string | null;
  discount_value: number | null;
  price_after_discount: number | null;
  final_price: number;
}

export interface ProductImage {
  id?: number;
  image_url?: string;
  image_path?: string;
}

export interface CartProduct {
  id: number;
  type: string;
  is_active: boolean;
  name: string;
  avg_rating: number;
  total_reviews: number;
  description: string;
  brand: string | null;
  has_production_date: boolean;
  pricing: ProductPricing;
  has_variants: boolean;
  variants: any | null;
  quantity: number;
  images: string[];
}

export interface CartItem {
  id: number;
  product: CartProduct;
  variant: any | null;
  quantity: number;
  price: number;
  discount_amount: number;
  final_price: number;
  total_price: number;
}

export interface CartData {
  id: number;
  guest_token: string | null;
  user?: {
    id: number;
    name: string;
    locale: string;
    email: string;
    verified: boolean;
    created_at: string;
    image: string;
  };
  items: CartItem[];
  total_quantity: number;
  coupon_discount: number;
  discount_amount: number;
  delivery_fee: number;
  tax_fee: number;
  subtotal: number;
  subtotal_after_discount: number;
  subtotal_after_coupon_discounts: number;
  total_amount: number;
  applied_coupon_code: string | null;
}

export interface CartResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    cart: CartData;
  };
}

export interface ClearCartResponse {
  result: boolean;
  errNum: number;
  message: string;
  data?: any;
}

export interface AddToCartPayload {
  product_id: number;
  quantity: number;
  product_variant_id?: number | null;
}

export interface UpdateQuantityPayload {
  quantity: number;
}

const API_URL = 'https://alfareed.admin.t-carts.com/api';

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

//  دالة للحصول على guest_token من localStorage
export const getGuestToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('guest_cart_token');
  }
  return null;
};

//  دالة لحفظ guest_token في localStorage
export const setGuestToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('guest_cart_token', token);
  }
};

//  دالة لمسح guest_token
export const clearGuestToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guest_cart_token');
  }
};



// 1. إضافة منتج إلى السلة (مع دعم guest_token في الـ Headers)
export const addToCart = async (payload: AddToCartPayload): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_URL}/cart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    //  إذا كان الـ response يحتوي على guest_token، نقوم بحفظه
    if (data.result && data.data?.cart?.guest_token) {
      setGuestToken(data.data.cart.guest_token);
    }
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج إلى السلة:', error);
    throw error;
  }
};

// 2. عرض السلة (مع دعم guest_token في الـ Headers)
export const getCart = async (): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_URL}/cart/preview`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    //  إذا كان الـ response يحتوي على guest_token، نقوم بحفظه
    if (data.result && data.data?.cart?.guest_token) {
      setGuestToken(data.data.cart.guest_token);
    }
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في جلب السلة:', error);
    throw error;
  }
};

// 3. تحديث كمية منتج في السلة (مع دعم guest_token في الـ Headers)
export const updateCartItemQuantity = async (cartItemId: number, quantity: number): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_URL}/cart/cart-items/${cartItemId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ quantity }),
    });
    
    const data = await response.json();
    
    //  إذا كان الـ response يحتوي على guest_token، نقوم بحفظه
    if (data.result && data.data?.cart?.guest_token) {
      setGuestToken(data.data.cart.guest_token);
    }
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في تحديث كمية المنتج:', error);
    throw error;
  }
};

// 4. حذف منتج معين من السلة (مع دعم guest_token في الـ Headers)
export const removeFromCart = async (cartItemId: number): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_URL}/cart/cart-items/${cartItemId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    //  إذا كان الـ response يحتوي على guest_token، نقوم بحفظه
    if (data.result && data.data?.cart?.guest_token) {
      setGuestToken(data.data.cart.guest_token);
    }
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في حذف المنتج من السلة:', error);
    throw error;
  }
};

// 5. حذف كل المنتجات من السلة (تفريغ السلة) (مع دعم guest_token في الـ Headers)
export const clearCart = async (): Promise<ClearCartResponse> => {
  try {
    const response = await fetch(`${API_URL}/cart/clear`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    //  إذا كان الـ response يحتوي على guest_token، نقوم بحفظه
    if (data.result && data.data?.cart?.guest_token) {
      setGuestToken(data.data.cart.guest_token);
    }
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في حذف جميع منتجات السلة:', error);
    throw error;
  }
};

// Helper function: تحويل بيانات السلة إلى صيغة مناسبة للعرض في UI
export const transformCartItemToDisplay = (item: CartItem | null | undefined) => {
  if (!item || !item.id) {
    return {
      id: '0',
      name: 'منتج غير معروف',
      price: 0,
      originalPrice: undefined,
      discount: undefined,
      image: '/images/placeholder.png',
      quantity: 0,
      totalPrice: 0,
      href: '/',
    };
  }

  return {
    id: item.id.toString(),
    productId: item.product.id.toString(),
    name: item.product.name || 'منتج بدون اسم',
    price: item.final_price || item.price || 0,
    originalPrice: item.product.pricing?.has_discount ? item.product.pricing.price : undefined,
    discount: item.discount_amount || undefined,
    image: (item.product.images && item.product.images[0]) ? item.product.images[0] : '/images/placeholder.png',
    quantity: item.quantity,
    totalPrice: item.total_price,
    href: `/product/${item.product.id}`,
    hasVariants: item.product.has_variants,
    variant: item.variant,
  };
};

// Helper function: حساب ملخص السلة
export const getCartSummary = (cart: CartData | null | undefined) => {
  if (!cart) {
    return {
      subtotal: 0,
      discount: 0,
      deliveryFee: 0,
      taxFee: 0,
      total: 0,
      itemCount: 0,
      couponDiscount: 0,
    };
  }

  return {
    subtotal: cart.subtotal || 0,
    discount: cart.discount_amount || 0,
    deliveryFee: cart.delivery_fee || 0,
    taxFee: cart.tax_fee || 0,
    total: cart.total_amount || 0,
    itemCount: cart.total_quantity || 0,
    couponDiscount: cart.coupon_discount || 0,
  };
};
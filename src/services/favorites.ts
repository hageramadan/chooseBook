// src/services/favorites.ts

import { getHeaders } from "./api";

export interface FavoriteProduct {
  id: number;
  type: string;
  is_active: boolean;
  name: string;
  avg_rating: number;
  total_reviews: number;
  description: string;
  category: {
    id: number;
    name: string;
    image: string;
  };
  subcategory?: {
    id: number;
    name: string;
  } | null;
  brand: {
    id: number;
    name: string;
  } | null;
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
  variants: any[] | null;
  quantity: number | null;
  images: string[];
}

//  واجهات الـ variants
interface VariantAttribute {
  id: number;
  attribute_type: {
    id: number;
    name: string;
  };
  value: string;
  meta: {
    color?: string;
  } | null;
}

interface ProductVariant {
  id: number;
  sku: string | null;
  price: number;
  has_discount: boolean;
  discount_type: string | null;
  discount_value: number | null;
  price_after_discount: number;
  quantity: number | null;
  is_active: boolean;
  variant_image: string | null;
  attributes: VariantAttribute[];
}

//  دالة استخراج الألوان من جميع الـ variants
const extractColorsFromVariants = (variants: ProductVariant[]): Array<{ color: string; name: string }> => {
  const colorMap = new Map<string, string>();
  
  if (!variants || variants.length === 0) return [];
  
  variants.forEach((variant) => {
    if (variant.attributes && Array.isArray(variant.attributes)) {
      variant.attributes.forEach((attr: VariantAttribute) => {
        // إذا كان الـ attribute من نوع "اللون"
        if (attr.attribute_type?.name === "اللون" && attr.value && attr.meta?.color) {
          if (!colorMap.has(attr.value)) {
            colorMap.set(attr.value, attr.meta.color);
          }
        }
      });
    }
  });
  
  
  return Array.from(colorMap.entries()).map(([name, color]) => ({
    name: name,
    color: color
  }));
};

//  دالة تنظيف رابط الصورة
const cleanImageUrl = (url: string): string => {
  if (!url) return '/images/placeholder.jpg';
  if (url.startsWith('/storage')) {
    return `https://alfareed.admin.t-carts.com${url}`;
  }
  return url;
};

//  دالة تحويل المنتج من المفضلة إلى شكل ProductCard
export const transformFavoriteToProductCard = (favorite: FavoriteProduct | null | undefined) => {
  // التحقق من وجود favorite و id
  if (!favorite || !favorite.id) {
    console.warn('⚠️ تحويل منتج غير صالح:', favorite);
    return {
      id: '0',
      name: 'منتج غير معروف',
      price: 0,
      originalPrice: undefined,
      discount: undefined,
      image: '/images/placeholder.jpg',
      hoverImage: '/images/placeholder.jpg',
      href: '/',
      rating: 0,
      reviewsCount: 0,
      isBestSeller: false,
      colors: [],
      addedDate: new Date().toISOString(),
    };
  }



  //  استخراج الألوان من الـ variants
  let colors: Array<{ color: string; name: string }> = [];
  
  if (favorite.has_variants && favorite.variants && Array.isArray(favorite.variants) && favorite.variants.length > 0) {
    colors = extractColorsFromVariants(favorite.variants as ProductVariant[]);
  } else {
  }

  // معالجة الصور
  const mainImage = favorite.images && favorite.images.length > 0 
    ? cleanImageUrl(favorite.images[0])
    : '/images/placeholder.jpg';
    
  const hoverImage = favorite.images && favorite.images.length > 1 
    ? cleanImageUrl(favorite.images[1])
    : mainImage;

  // حساب الخصم
  let discount: number | undefined;
  let originalPrice: number | undefined;
  
  if (favorite.pricing?.has_discount && favorite.pricing?.price_after_discount) {
    const original = favorite.pricing.price;
    const afterDiscount = favorite.pricing.price_after_discount;
    discount = Math.round(((original - afterDiscount) / original) * 100);
    originalPrice = original;
  }

  const result = {
    id: favorite.id.toString(),
    name: favorite.name,
    price: favorite.pricing?.final_price || favorite.pricing?.price || 0,
    originalPrice: originalPrice,
    discount: discount,
    image: mainImage,
    hoverImage: hoverImage,
    href: `/product/${favorite.id}`,
    rating: favorite.avg_rating || 0,
    reviewsCount: favorite.total_reviews || 0,
    isBestSeller: favorite.is_active,
    colors: colors,
    addedDate: new Date().toISOString(),
  };
  
  
  return result;
};

// باقي الكود كما هو...
const API_URL = 'https://alfareed.admin.t-carts.com/api';

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};



export const fetchFavorites = async (
  page: number = 1,
  perPage: number = 10
): Promise<any> => {
  const token = getToken();

  //  لو مفيش توكن متعمليش API Call
  if (!token) {
    return {
      result: false,
      data: {
        favorites: [],
        pagination: null,
      },
    };
  }

  try {
    const response = await fetch(
      `${API_URL}/user-favorites?page=${page}&per_page=${perPage}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ خطأ في جلب المفضلة:", error);
    throw error;
  }
};

export const addToFavorites = async (
  productId: string | number
): Promise<any> => {
  const token = getToken();

  if (!token) {
    throw new Error("User is not authenticated");
  }

  try {
    const response = await fetch(`${API_URL}/user-favorites`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ product_id: productId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ خطأ في إضافة المنتج إلى المفضلة:", error);
    throw error;
  }
};

export const removeFromFavorites = async (
  productId: string | number
): Promise<any> => {
  const token = getToken();

  if (!token) {
    throw new Error("User is not authenticated");
  }

  try {
    const response = await fetch(
      `${API_URL}/user-favorites/${productId}/delete`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ خطأ في حذف المنتج من المفضلة:", error);
    throw error;
  }
};

export const clearAllFavorites = async (): Promise<boolean> => {
  try {
    let allFavorites: FavoriteProduct[] = [];
    let currentPage = 1;
    let lastPage = 1;
    
    do {
      const response = await fetchFavorites(currentPage, 50);
      if (response.result && response.data && response.data.favorites) {
        const validFavorites = response.data.favorites.filter((item: FavoriteProduct) => item && item.id);
        allFavorites = [...allFavorites, ...validFavorites];
        lastPage = response.data.pagination?.last_page || 1;
        currentPage++;
      } else {
        break;
      }
    } while (currentPage <= lastPage);
    
    const deletePromises = allFavorites.map(item => removeFromFavorites(item.id));
    const results = await Promise.all(deletePromises);
    
    return results.every(result => result.result === true);
  } catch (error) {
    console.error('❌ خطأ في حذف جميع المفضلة:', error);
    return false;
  }
};
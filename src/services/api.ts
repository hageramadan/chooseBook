import { Currency } from "@/types/product";

// services/api.ts
const API_URL = "https://admin.ekhtarktabak.com/api";
const API_BASE_URL_Img="https://admin.ekhtarktabak.com";
// ========== دوال مساعدة للمصادقة (يجب تعريفها أولاً) ==========
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}
export function getGuestToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('guest_cart_token');
  }
  return null;
}
export function saveGuestToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('guest_cart_token', token);
  }
}

export function removeGuestToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guest_cart_token');
  }
}
export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
}

export function saveUserData(user: any): void {
  if (typeof window !== 'undefined' && user) {
    localStorage.setItem('user_data', JSON.stringify(user));
  }
}

export function getFullImageUrl(imagePath: string): string {
  if (!imagePath) return '/images/placeholder.jpg';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL_Img}${imagePath}`;
}
export function getUserData(): any | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      return JSON.parse(userData);
    }
  }
  return null;
}

// ========== دوال اللغة ==========
//  دالة مساعدة للحصول على Accept-Language header
export const getAcceptLanguageHeader = (lang?: string): string => {
  // إذا تم تمرير اللغة، استخدمها
  if (lang && (lang === 'ar' || lang === 'en')) {
    return lang;
  }
  
  // وإلا اقرأ من localStorage (للعميل فقط)
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('user_language');
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      return savedLang;
    }
    return 'ar';
  }
  return 'ar';
};

//  دالة مساعدة لإضافة الهيدرات تلقائياً
export const getHeaders = (includeAuth: boolean = true, lang?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'content-type': 'application/json',
    'Accept-Language': getAcceptLanguageHeader(lang),
    // 'Cache-Control': 'no-cache',
    // 'Pragma': 'no-cache',
  };
  
  if (includeAuth) {
    const token = getToken();
    const guestToken = getGuestToken(); //  جلب Guest Token
    
    //  أولوية: Token العادي أولاً
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } 
    //  إذا لم يوجد Token، استخدم Guest Token
    else if (guestToken) {
      headers['X-Guest-Token'] = guestToken;
    }
  }
  
  return headers;
};

// ========== دوال مساعدة للـ Cache ==========
const isBuildTime = typeof process !== 'undefined' && 
  process.env && 
  process.env.NEXT_RUNTIME === undefined;

const getCacheStrategy = () => {
  if (isBuildTime) {
    return 'force-cache';
  }
  return 'no-store';
};

// ========== واجهات (Interfaces) السلايدر ==========
interface SliderResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    sliders: SlideData[];
  };
}

interface SlideData {
  id: number;
  sub_title: string | null;
  name: string;
  description: string;
  link: string | null;
  image: string;
  is_active: number;
}

export async function getSliders(lang?: string): Promise<SlideData[]> {
  try {
    const response = await fetch(`${API_URL}/sliders`, {
      method: 'GET',
      headers: getHeaders(false, lang),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SliderResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return result.data.sliders.filter(slider => slider.is_active === 1);
    } else {
      throw new Error(result.message || 'Failed to fetch sliders');
    }
  } catch (error) {
    console.error('Error fetching sliders:', error);
    return [];
  }
}

// ========== واجهات (Interfaces) الكاتجوريز ==========
interface CategoryResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    categories: CategoryData[];
  };
}
export interface SubCategory {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface CategoryData {
  id: number;
  name: string;
  subcategories: SubCategory[];
  image: string;
  brands: Brand[]; 
   products?: any[];
  sliders?: any[];
}

export async function getCategories(lang?: string): Promise<CategoryData[]> {
  try {
    const acceptLanguage = getAcceptLanguageHeader(lang);
    
    const response = await fetch(`${API_URL}/categories`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: 'no-store',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CategoryResponse = await response.json();
    
    if (result.result && result.errNum === 200 && result.data?.categories) {
      return Array.isArray(result.data.categories) ? result.data.categories : [];
    } else {
      throw new Error(result.message || 'Failed to fetch categories');
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// ========== واجهات (Interfaces) المنتجات ==========
interface ProductResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    products: ProductData[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
      next_page: string | null;
      previous_page: string | null;
    };
  };
}

export interface ProductData {
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
  video?: string; 
  currency:Currency
}

export interface SectionWithProducts {
  id: number;
  name: string;
  is_active: boolean;
  products: ProductData[];
}

// ========== واجهات (Interfaces) الأقسام ==========
interface SectionResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    sections: SectionData[];
  };
}

interface SectionData {
  id: number;
  name: string;
  is_active: boolean;
  products: ProductData[];
}

export async function getNewProducts(page: number = 1, perPage: number = 20): Promise<ProductData[]> {
  try {
    const response = await fetch(`${API_URL}/products/new-products?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProductResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return result.data.products;
    } else {
      throw new Error(result.message || 'Failed to fetch new products');
    }
  } catch (error) {
    console.error('Error fetching new products:', error);
    return [];
  }
}

export async function getLeastPriceProducts(page: number = 1, perPage: number = 20): Promise<ProductData[]> {
  try {
    const response = await fetch(`${API_URL}/products/least-priced-products?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProductResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return result.data.products;
    } else {
      throw new Error(result.message || 'Failed to fetch new products');
    }
  } catch (error) {
    console.error('Error fetching new products:', error);
    return [];
  }
}
export async function getOffersSection(): Promise<SectionWithProducts | null> {
  try {
    const response = await fetch(`${API_URL}/sections`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SectionResponse = await response.json();
    
    if (result.result && result.errNum === 200 && result.data?.sections) {
      const discountsSection = result.data.sections.find(
        (section: SectionData) => section.name === "اقوى الخصومات" || section.name === "أقوي الخصومات"
      );
      
      const targetSection = discountsSection || result.data.sections[0];
      
      if (targetSection) {
        return {
          id: targetSection.id,
          name: targetSection.name,
          is_active: targetSection.is_active,
          products: targetSection.products || []
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching offers section:', error);
    return null;
  }
}

export async function getOffersProducts(page: number = 1, perPage: number = 20): Promise<ProductData[]> {
  const section = await getOffersSection();
  return section?.products || [];
}

// ========== واجهات (Interfaces) الإعلانات ==========
interface AdResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    ad_pop_up: AdData[];
  };
}

export interface AdData {
  id: number;
  sub_title: string | null;
  name: string;
  description: string;
  link: string | null;
  image: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export async function getAds(): Promise<AdData[]> {
  try {
    const response = await fetch(`https://admin.ekhtarktabak.com/api/ads`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AdResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return result.data.ad_pop_up.filter(ad => ad.is_active === 1);
    } else {
      throw new Error(result.message || 'Failed to fetch ads');
    }
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

export async function getMostSellingProducts(page: number = 1, perPage: number = 20): Promise<ProductData[]> {
  try {
    const response = await fetch(`${API_URL}/products/most-selling-products?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProductResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return result.data.products;
    } else {
      throw new Error(result.message || 'Failed to fetch most selling products');
    }
  } catch (error) {
    console.error('Error fetching most selling products:', error);
    return [];
  }
}

// ========== واجهات الفلاتر والمنتجات ==========
export interface ProductFilters {
  price_range?: [number, number];
  brands?: number[];
  sizes?: string[];
  attribute_values?: number[]; 
  colors?: string[];
  categories?: number[];
  page?: number;
  per_page?: number;
}

interface ProductsListResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    products: ProductData[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
      next_page: string | null;
      previous_page: string | null;
    };
  };
}

function buildFiltersQueryString(filters: ProductFilters): string {
  const queryParts: string[] = [];
  
  if (filters.page && filters.page > 0) {
    queryParts.push(`page=${filters.page}`);
  }
  
  const perPage = filters.per_page || 20;
  queryParts.push(`per_page=${perPage}`);
  
  if (filters.price_range && filters.price_range.length === 2) {
    queryParts.push(`price_range=[${filters.price_range[0]},${filters.price_range[1]}]`);
  }
  
  if (filters.brands && filters.brands.length > 0) {
    queryParts.push(`brands=[${filters.brands.join(',')}]`);
  }
  
  if (filters.attribute_values && filters.attribute_values.length > 0) {
    queryParts.push(`attribute_values=[${filters.attribute_values.join(',')}]`);
  }
  
  if (filters.colors && filters.colors.length > 0) {
    const formattedColors = filters.colors
      .map(c => `"${encodeURIComponent(c)}"`)
      .join(',');
    queryParts.push(`colors=[${formattedColors}]`);
  }
  
  if (filters.categories && filters.categories.length > 0) {
    queryParts.push(`categories=[${filters.categories.join(',')}]`);
  }
  
  return queryParts.join('&');
}

export async function getAllProducts(
  filters: ProductFilters = {}
): Promise<{ products: ProductData[]; pagination: ProductsListResponse['data']['pagination'] | null }> {
  try {
    if (!filters.page || filters.page < 1) {
      filters.page = 1;
    }
    
    const queryString = buildFiltersQueryString(filters);
    const url = `${API_URL}/products?${queryString}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProductsListResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return {
        products: result.data.products,
        pagination: result.data.pagination
      };
    } else {
      throw new Error(result.message || 'Failed to fetch products');
    }
  } catch (error) {
    console.error('Error fetching all products:', error);
    return { products: [], pagination: null };
  }
}

export async function searchProducts(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<{ products: ProductData[]; pagination: any }> {
  try {
    const url = `${API_URL}/products/search?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProductsListResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return {
        products: result.data.products,
        pagination: result.data.pagination
      };
    } else {
      throw new Error(result.message || 'Failed to search products');
    }
  } catch (error) {
    console.error('Error searching products:', error);
    return { products: [], pagination: null };
  }
}

export async function getProductsByIds(productIds: number[]): Promise<ProductData[]> {
  try {
    const url = `${API_URL}/products?ids=${productIds.join(',')}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProductsListResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return result.data.products;
    } else {
      throw new Error(result.message || 'Failed to fetch products by ids');
    }
  } catch (error) {
    console.error('Error fetching products by ids:', error);
    return [];
  }
}

// ========== واجهات (Interfaces) خاصة بـ Attributes ==========
interface AttributeValue {
  id: number;
  value: string;
  meta: {
    color?: string;
  } | null;
}

interface Attribute {
  id: number;
  name: string;
  slug: string;
  values: AttributeValue[];
}

interface AttributesResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    attributes: Attribute[];
  };
}

export async function getAttributes(): Promise<Attribute[]> {
  try {
    const response = await fetch(`${API_URL}/products/attributes`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AttributesResponse = await response.json();
    
    if (result.result && result.errNum === 200 && result.data?.attributes) {
      return Array.isArray(result.data.attributes) ? result.data.attributes : [];
    } else {
      throw new Error(result.message || 'Failed to fetch attributes');
    }
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return [];
  }
}

export async function getColors(): Promise<{ id: number; name: string; code: string }[]> {
  try {
    const attributes = await getAttributes();
    const colorAttribute = attributes.find(attr => attr.slug === 'color');
    
    if (colorAttribute && colorAttribute.values && Array.isArray(colorAttribute.values)) {
      return colorAttribute.values.map(value => ({
        id: value.id,
        name: value.value === "-" ? `لون ${value.id}` : value.value,
        code: value.meta?.color || '#000000'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in getColors:', error);
    return [];
  }
}

export async function getRam(): Promise<{ id: number; value: string }[]> {
  try {
    const attributes = await getAttributes();
    const ramAttribute = attributes.find(attr => attr.slug === 'ram');
    
    if (ramAttribute && ramAttribute.values && Array.isArray(ramAttribute.values)) {
      return ramAttribute.values.map(value => ({
        id: value.id,
        value: value.value
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in getRam:', error);
    return [];
  }
}

export async function getHardDisk(): Promise<{ id: number; value: string }[]> {
  try {
    const attributes = await getAttributes();
    const hardDiskAttribute = attributes.find(attr => attr.slug === 'hard-disk');
    
    if (hardDiskAttribute && hardDiskAttribute.values && Array.isArray(hardDiskAttribute.values)) {
      return hardDiskAttribute.values.map(value => ({
        id: value.id,
        value: value.value
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in getHardDisk:', error);
    return [];
  }
}

export async function getSizes(): Promise<{ id: number; value: string; type: 'ram' | 'hard-disk' }[]> {
  try {
    const [ram, hardDisk] = await Promise.all([getRam(), getHardDisk()]);
    
    const sizes: { id: number; value: string; type: 'ram' | 'hard-disk' }[] = [];
    
    ram.forEach(item => {
      sizes.push({ 
        id: item.id,
        value: item.value, 
        type: 'ram' 
      });
    });
    
    hardDisk.forEach(item => {
      sizes.push({ 
        id: item.id,
        value: item.value, 
        type: 'hard-disk' 
      });
    });
    
    return sizes;
  } catch (error) {
    console.error('Error in getSizes:', error);
    return [];
  }
}

export function encodeColor(colorCode: string): string {
  return encodeURIComponent(colorCode);
}

export function decodeColor(encodedColor: string): string {
  return decodeURIComponent(encodedColor);
}

export async function getBrands(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/brands`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: any = await response.json();
    
    if (result.result && result.errNum === 200) {
      const brands = result.data?.brands || [];
      return Array.isArray(brands) ? brands : [];
    } else {
      throw new Error(result.message || 'Failed to fetch brands');
    }
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

// ========== دوال المنتج الفردي ==========
interface SingleProductResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    product: ProductData;
  };
}

export async function getProductById(productId: string | number): Promise<ProductData | null> {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SingleProductResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return result.data.product;
    } else {
      throw new Error(result.message || 'Failed to fetch product');
    }
  } catch (error) {
    console.error('Error fetching product by id:', error);
    return null;
  }
}

export function extractColorsFromProduct(product: ProductData): { name: string; code: string }[] {
  const colors: { name: string; code: string }[] = [];
  
  if (product.has_variants && product.variants?.length > 0) {
    product.variants.forEach((variant: any) => {
      if (variant.attributes) {
        variant.attributes.forEach((attr: any) => {
          if (attr.attribute_type?.name === 'اللون' && attr.meta?.color) {
            const exists = colors.some(c => c.name === attr.value);
            if (!exists) {
              colors.push({
                name: attr.value,
                code: attr.meta.color
              });
            }
          }
        });
      }
    });
  }
  
  return colors;
}

export function extractSizesFromProduct(product: ProductData): string[] {
  const sizes: string[] = [];
  
  if (product.has_variants && product.variants?.length > 0) {
    product.variants.forEach((variant: any) => {
      if (variant.attributes) {
        variant.attributes.forEach((attr: any) => {
          if (attr.attribute_type?.name === 'الذاكرة' || attr.attribute_type?.name === 'هارد ديسك') {
            const exists = sizes.includes(attr.value);
            if (!exists) {
              sizes.push(attr.value);
            }
          }
        });
      }
    });
  }
  
  return sizes;
}

export function getFinalPrice(product: ProductData): number {
  if (product.has_variants && product.variants?.[0]?.price_after_discount) {
    return product.variants[0].price_after_discount;
  }
  return product.pricing?.final_price || product.pricing?.price || 0;
}

export function getOriginalPrice(product: ProductData): number | null {
  if (product.pricing?.has_discount && product.pricing?.price) {
    return product.pricing.price;
  }
  return null;
}

export function getDiscountPercentage(product: ProductData): number | null {
  if (product.pricing?.has_discount && product.pricing?.price && product.pricing?.final_price) {
    return Math.round(((product.pricing.price - product.pricing.final_price) / product.pricing.price) * 100);
  }
  return null;
}

// ========== واجهات (Interfaces) خاصة بالتقييمات ==========
interface ReviewsResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    average_rating: number;
    total_reviews: number;
    reviews: ReviewData[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
      next_page: string | null;
      previous_page: string | null;
    };
  };
}

export interface ReviewData {
  id: number;
  rating: number;
  comment: string;
  user: {
    id: number;
    name: string;
    locale: string;
    email: string;
    verified: boolean;
    created_at: string;
    image: string;
  };
  created_at: string;
  updated_at: string;
}

export async function getProductReviews(
  productId: number,
  page: number = 1,
  perPage: number = 10,
  sort?: string
): Promise<{
  reviews: ReviewData[];
  averageRating: number;
  totalReviews: number;
  pagination: any;
}> {
  try {
    let url = `${API_URL}/reviews/${productId}/show?page=${page}&per_page=${perPage}`;
    
    if (sort) {
      let sortParam = '';
      switch (sort) {
        case 'الأحدث':
          sortParam = '&sort=created_at&order=desc';
          break;
        case 'الأقدم':
          sortParam = '&sort=created_at&order=asc';
          break;
        case 'أعلى تقييم':
          sortParam = '&sort=rating&order=desc';
          break;
        case 'أقل تقييم':
          sortParam = '&sort=rating&order=asc';
          break;
        default:
          sortParam = '&sort=created_at&order=desc';
      }
      url += sortParam;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(false),
      cache: getCacheStrategy(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ReviewsResponse = await response.json();
    
    if (result.result && result.errNum === 200) {
      return {
        reviews: result.data.reviews,
        averageRating: result.data.average_rating,
        totalReviews: result.data.total_reviews,
        pagination: result.data.pagination
      };
    } else {
      throw new Error(result.message || 'Failed to fetch reviews');
    }
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return {
      reviews: [],
      averageRating: 0,
      totalReviews: 0,
      pagination: null
    };
  }
}

export async function getAllFiltersData() {
  const [colors, sizes, brands, categories] = await Promise.all([
    getColors(),
    getSizes(),
    getBrands(),
    getCategories()
  ]);

  return {
    colors,
    sizes,
    brands,
    categories
  };
}

// ========== واجهات (Interfaces) الخاصة بالتسجيل وتسجيل الدخول ==========

interface RegisterWithEmailRequest {
  name: string;
  email: string;
  password: string;
}

interface RegisterWithPhoneRequest {
  name: string;
  phone: string;
  password: string;
  country_code: string;
}

interface LoginWithEmailRequest {
  email: string;
  password: string;
}

interface LoginWithPhoneRequest {
  phone: string;
  password: string;
  country_code: string;
}

interface AuthResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    token?: string;
    user?: {
      id: number;
      name: string;
      email?: string;
      phone?: string;
    };
  } | null;
}

interface LogoutResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: null;
}

export async function registerWithEmail(data: RegisterWithEmailRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
       headers: getHeaders(false),
      body: JSON.stringify(data),
    });

     const results: AuthResponse = await response.json();

    if (!response.ok) {
      return {
        result: results.result || false,
        errNum: results.errNum || response.status,
        message: results.message || `  (${response.status})`,
        data: results.data || null,
      };
    }

    
    return results;
  } catch (error) {
    console.error('Error in registerWithEmail:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في التسجيل',
      data: null,
    };
  }
}

export async function registerWithPhone(data: RegisterWithPhoneRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
       headers: getHeaders(false),
      body: JSON.stringify(data),
    });

    const results: AuthResponse = await response.json();

    if (!response.ok) {
      return {
        result: results.result || false,
        errNum: results.errNum || response.status,
        message: results.message || `فشل في تسجيل الدخول (${response.status})`,
        data: results.data || null,
      };
    }

    return results;
  } catch (error) {
    console.error('Error in registerWithPhone:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في التسجيل',
      data: null,
    };
  }
}

export async function loginWithEmail(data: LoginWithEmailRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

     const results: AuthResponse = await response.json();

    if (!response.ok) {
      return {
        result: results.result || false,
        errNum: results.errNum || response.status,
        message: results.message || ` (${response.status})`,
        data: results.data || null,
      };
    }
 if (results.result && results.errNum === 200 && results.data) {
      const token = results.data.token;
      const user = results.data.user;
      
      if (token) {
        // استخدام saveToken بدلاً من التخزين المباشر
        saveToken(token);
        console.log('✅ Token stored successfully:', token);
      }
      
      if (user) {
        // استخدام saveUserData للتخزين بشكل صحيح
        saveUserData({ user: user });
        console.log('✅ User data stored successfully:', user);
      }
    }

    // const result: AuthResponse = await response.json();
    return results;
  } catch (error) {
    console.error('Error in loginWithEmail:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في تسجيل الدخول',
      data: null,
    };
  }
}

export async function loginWithPhone(data: LoginWithPhoneRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });
    
    // محاولة قراءة الرد
    let results: AuthResponse;
    try {
      results = await response.json();
    } catch (parseError) {
      return {
        result: false,
        errNum: response.status,
        message: `خطأ في استجابة الخادم (${response.status})`,
        data: null,
      };
    }

    if (!response.ok) {
      return {
        result: results.result || false,
        errNum: results.errNum || response.status,
        message: results.message || `فشل في تسجيل الدخول (${response.status})`,
        data: results.data || null,
      };
    }

    // ✅ التعديل: تخزين التوكن وبيانات المستخدم عند نجاح تسجيل الدخول
    if (results.result && results.errNum === 200 && results.data) {
      const token = results.data.token;
      const user = results.data.user;
      
      if (token) {
        saveToken(token);
        console.log('✅ Token stored successfully:', token);
      }
      
      if (user) {
        saveUserData({ user: user });
        console.log('✅ User data stored successfully:', user);
      }
    }

    return results;
  } catch (error) {
    console.error('Error in loginWithPhone:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في تسجيل الدخول',
      data: null,
    };
  }
}

// ========== دالة تسجيل الخروج ==========
export async function logout(token?: string): Promise<LogoutResponse> {
  try {
    const authToken = token || getToken();
    
    const headers: HeadersInit = {
       'Content-Type': 'application/json',
       'Accept':'appkication/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
       headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: LogoutResponse = await response.json();
    
    if (result.result) {
      removeToken();
    }
    
    return result;
  } catch (error) {
    console.error('Error in logout:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في تسجيل الخروج',
      data: null,
    };
  }
}

export async function logoutAndCleanup(redirectTo?: string): Promise<boolean> {
  try {
    const result = await logout();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
    
    return result.result;
  } catch (error) {
    console.error('Error in logoutAndCleanup:', error);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
    
    return false;
  }
}

// ========== واجهات (Interfaces) خاصة بنسيت كلمة المرور ==========

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: any[] | null;
}

interface VerifyForgotPasswordRequest {
  otp: string;
  email: string;
}

interface VerifyForgotPasswordResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    reset_token?: string;
  } | null;
}

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface ChangePasswordResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: null;
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
       headers: getHeaders(false),
      body: JSON.stringify(data),
    });

    const result: ForgotPasswordResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في إرسال رمز التحقق',
      data: null,
    };
  }
}

export async function verifyForgotPassword(data: VerifyForgotPasswordRequest): Promise<VerifyForgotPasswordResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/verify-forgot-password`, {
      method: 'POST',
      headers:getHeaders(false),
      body: JSON.stringify(data),
    });

    const result: VerifyForgotPasswordResponse = await response.json();
    
    // ✅ تخزين reset_token و reset_email في localStorage عند نجاح التحقق
    if (result.result && result.data?.reset_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('reset_token', result.data.reset_token);
        localStorage.setItem('reset_email', data.email);
        console.log('✅ Reset token saved:', result.data.reset_token); // للتأكد
        console.log('✅ Reset email saved:', data.email); // للتأكد
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in verifyForgotPassword:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في التحقق من الرمز',
      data: null,
    };
  }
}

export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
       headers: getHeaders(),
      body: JSON.stringify(data),
    });

    const result: ChangePasswordResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error in changePassword:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في تغيير كلمة المرور',
      data: null,
    };
  }
}

export async function resetPassword(data: {
  email: string;
  new_password: string;
  new_password_confirmation: string;
}): Promise<ChangePasswordResponse> {
  try {
    // ✅ جلب reset_token من localStorage
    let resetToken = null;
    if (typeof window !== 'undefined') {
      resetToken = localStorage.getItem('reset_token');
      console.log('🔑 Reset token from localStorage:', resetToken);
    }
    
    // ✅ بناء جسم الطلب مع إضافة reset_token إذا كان موجوداً
    const requestBody: any = {
      email: data.email,
      new_password: data.new_password,
      new_password_confirmation: data.new_password_confirmation,
    };
    
    // ✅ إضافة reset_token إذا كان موجوداً
    if (resetToken) {
      requestBody.reset_token = resetToken;
    }
    
    console.log('📤 Sending request body:', requestBody);

    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers:getHeaders(false),
      body: JSON.stringify(requestBody), // ✅ استخدام requestBody المعدل
    });

    const result: ChangePasswordResponse = await response.json();
    
    // ✅ مسح reset_token و reset_email بعد النجاح
    if (result.result && typeof window !== 'undefined') {
      localStorage.removeItem('reset_token');
      localStorage.removeItem('reset_email');
      console.log('✅ Reset token and email cleared from localStorage');
    }
    
    return result;
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في إعادة تعيين كلمة المرور',
      data: null,
    };
  }
}

export async function resendOTP(email: string): Promise<ForgotPasswordResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email }),
    });

    const result: ForgotPasswordResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error in resendOTP:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في إعادة إرسال الرمز',
      data: null,
    };
  }
}

// ========== واجهات (Interfaces) خاصة بتحديث الملف الشخصي ==========

interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  locale?: string;
  image?: File | string;
}

export interface UpdateProfileResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    user?: {
      id: number;
      name: string;
      email?: string;
      phone?: string;
      image?: string;
    };
  } | null;
}

interface GetProfileResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email?: string;
      phone?: string;
      image?: string;
      [key: string]: any;
    };
  } | null;
}

export async function getUserProfile(): Promise<GetProfileResponse> {
  try {
    const token = getToken();
    
    if (!token) {
      return {
        result: false,
        errNum: 401,
        message: 'غير مصرح به. الرجاء تسجيل الدخول',
        data: null,
      };
    }
    
    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GetProfileResponse = await response.json();
    
    if (result.result && result.errNum === 200 && result.data?.user) {
      const currentUserData = getUserData();
      if (currentUserData) {
        const updatedUserData = {
          ...currentUserData,
          user: result.data.user
        };
        saveUserData(updatedUserData);
      } else {
        saveUserData({ user: result.data.user });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في جلب بيانات الملف الشخصي',
      data: null,
    };
  }
}

export async function updateUserProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  try {
    const token = getToken();
    
    if (!token) {
      return {
        result: false,
        errNum: 401,
        message: 'غير مصرح به. الرجاء تسجيل الدخول',
        data: null,
      };
    }
    
    const hasFile = data.image instanceof File;
    
    let response: Response;
    
    if (hasFile) {
      const formData = new FormData();
      
      if (data.name) formData.append('name', data.name);
      if (data.locale) formData.append('locale', data.locale);
      if (data.email) formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);
      if (data.image) formData.append('image', data.image);
      
      formData.append('_method', 'PUT');
      
      const headers: HeadersInit = {
        'Accept-Language': getAcceptLanguageHeader(),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      response = await fetch(`${API_URL}/user/profile`, {
        method: 'POST',
        headers:{   'Accept': 'application/json',
    'Accept-Language': getAcceptLanguageHeader(),
    'Authorization': `Bearer ${token}`,
   
  },
        body: formData,
      });
    } else {
      const headers = getHeaders(true);
      
      const bodyData = {
        ...data,
        _method: 'PUT'
      };
      
      if (bodyData.image && typeof bodyData.image === 'string') {
        delete bodyData.image;
      }
      
      response = await fetch(`${API_URL}/user/profile`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyData),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: UpdateProfileResponse = await response.json();
    
    if (result.result && result.errNum === 200 && result.data?.user) {
      const currentUserData = getUserData();
      if (currentUserData) {
        const updatedUserData = {
          ...currentUserData,
          user: {
            ...currentUserData.user,
            ...result.data.user
          }
        };
        saveUserData(updatedUserData);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return {
      result: false,
      errNum: 500,
      message: error instanceof Error ? error.message : 'فشل في تحديث الملف الشخصي',
      data: null,
    };
  }
}

//  دالة تحديث اللغة فقط
export async function updateUserLocale(locale: string): Promise<UpdateProfileResponse> {
  return updateUserProfile({ locale });
}

export async function updateProfileImage(imageFile: File): Promise<UpdateProfileResponse> {
  return updateUserProfile({ image: imageFile });
}
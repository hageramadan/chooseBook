// src/types/product.ts

//  واجهة العملة
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

//  واجهة Attribute
export interface VariantAttribute {
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

//  واجهة Product Variant
export interface ProductVariant {
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

//  واجهة Color
export interface ColorOption {
  color: string;
  name: string;
}

//  واجهة Product الرئيسية
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  href: string;
  originalPrice?: number;
  discount?: number;
  colors?: ColorOption[];
  rating?: number;
  reviewsCount?: number;
  isBestSeller?: boolean;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  variantId?: number | null;
  currency?: Currency;
  quantity?:number | null;
}

//  دالة استخراج الألوان من جميع الـ variants
export const extractColorsFromVariants = (
  variants: ProductVariant[],
): ColorOption[] => {
  const colorMap = new Map<string, string>();

  if (!variants || variants.length === 0) return [];

  variants.forEach((variant) => {
    if (variant.attributes && Array.isArray(variant.attributes)) {
      variant.attributes.forEach((attr: VariantAttribute) => {
        if (
          attr.attribute_type?.name === "اللون" &&
          attr.value &&
          attr.meta?.color
        ) {
          if (!colorMap.has(attr.value)) {
            colorMap.set(attr.value, attr.meta.color);
          }
        }
      });
    }
  });

  return Array.from(colorMap.entries()).map(([name, color]) => ({
    name: name,
    color: color,
  }));
};

//  دالة تنظيف رابط الصورة
export const cleanImageUrl = (url: string): string => {
  if (!url) return "/images/placeholder.jpg";
  if (url.startsWith("/storage")) {
    return `https://alfareed.admin.t-carts.com${url}`;
  }
  return `https://alfareed.admin.t-carts.com${url}`;
};

//  دالة تحويل البيانات من API
export const transformProduct = (product: any): Product => {
  const mainImage =
    product.images && product.images.length > 0
      ? cleanImageUrl(product.images[0])
      : "/images/placeholder.jpg";

  const hoverImage =
    product.images && product.images.length > 1
      ? cleanImageUrl(product.images[1])
      : mainImage;

  let discount: number | undefined;
  let originalPrice: number | undefined;

  if (product.pricing.has_discount && product.pricing.price_after_discount) {
    discount = Math.round(
      ((product.pricing.price - product.pricing.price_after_discount) /
        product.pricing.price) *
        100,
    );
    originalPrice = product.pricing.price;
  }

  let colors: ColorOption[] = [];
  let hasVariants = false;
  let variants: ProductVariant[] = [];
  let variantId: number | null = null;

  if (product.has_variants && product.variants && product.variants.length > 0) {
    hasVariants = true;
    variants = product.variants as ProductVariant[];
    variantId = product.variants[0].id;
    colors = extractColorsFromVariants(product.variants as ProductVariant[]);
  }

  return {
    id: product.id.toString(),
    name: product.name,
    price: product.pricing.final_price,
    image: mainImage,
    hoverImage: hoverImage,
    href: `/product/${product.id}`,
    originalPrice: originalPrice,
    discount: discount,
    colors: colors,
    rating: product.avg_rating || 0,
    reviewsCount: product.total_reviews || 0,
    isBestSeller: product.is_active,
    hasVariants: hasVariants,
    variants: variants,
    variantId: variantId,
    currency: product.currency || {
      code: "EGP",
      symbol: "$",
      name: "Egyptian Pound",
      rate: 1,
    },
  };
};
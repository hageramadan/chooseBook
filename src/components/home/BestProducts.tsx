// components/BestProducts.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ProductCard } from "../products/ProductCard";
import { Button } from "../ui/button";
import { getMostSellingProducts, ProductData } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

//  تعريف واجهات الفاريانتات
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

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  href: string;
  originalPrice?: number;
  discount?: number;
  colors?: Array<{ color: string; name: string }>;
  rating?: number;
  reviewsCount?: number;
  isBestSeller?: boolean;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  variantId?: number | null;
  currency?: {
    code: string;
    symbol: string;
    name: string;
    rate: number;
  };
    quantity?: number | null;
}

interface BestProductsProps {
  onLoad?: () => void;
}

//  دالة للحصول على الترجمات حسب اللغة
const getTranslations = (lang: string) => {
  if (lang === 'en') {
    return {
      bestSelling: "Best Selling",
      viewMore: "View More",
      loading: "Loading products...",
      error: "Failed to load products",
      noProducts: "No products available",
      retry: "Retry",
      loadingMore: "Loading more...",
      loadMore: "Load More",
    };
  }
  // Arabic (default)
  return {
    bestSelling: "الاكثر طلبا",
    viewMore: "عرض المزيد",
    loading: "جاري تحميل المنتجات...",
    error: "فشل في تحميل المنتجات",
    noProducts: "لا توجد منتجات متاحة",
    retry: "إعادة المحاولة",
    loadingMore: "جاري تحميل المزيد...",
    loadMore: "تحميل المزيد",
  };
};

//  دالة استخراج الألوان من جميع الـ variants
const extractColorsFromVariants = (
  variants: ProductVariant[],
): Array<{ color: string; name: string }> => {
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

// دالة تنظيف رابط الصورة
const cleanImageUrl = (url: string) => {
  if (!url) return "/images/placeholder.jpg";
  if (url.startsWith('/storage')) {
    return `https://admin.ekhtarktabak.com${url}`;
  }
  return `https://admin.ekhtarktabak.com${url}`;
};

// تحويل البيانات من API إلى شكل المنتج المطلوب - ديناميكي بالكامل
const transformProduct = (product: ProductData): Product => {
  const mainImage = product.images && product.images.length > 0 
    ? cleanImageUrl(product.images[0])
    : "/images/placeholder.jpg";
    
  const hoverImage = product.images && product.images.length > 1 
    ? cleanImageUrl(product.images[1])
    : mainImage;

  let discount: number | undefined;
  let originalPrice: number | undefined;
  
  if (product.pricing.has_discount && product.pricing.price_after_discount) {
    discount = Math.round(((product.pricing.price - product.pricing.price_after_discount) / product.pricing.price) * 100);
    originalPrice = product.pricing.price;
  }

  let colors: Array<{ color: string; name: string }> = [];
  let hasVariants = false;
  let variants: ProductVariant[] = [];
  let variantId: number | null = null;
  
  if (product.has_variants && product.variants && product.variants.length > 0) {
    hasVariants = true;
    variants = product.variants as ProductVariant[];
    variantId = product.variants[0].id;
    colors = extractColorsFromVariants(product.variants as ProductVariant[]);
  }
  let quantity: number | null = null;
if (product.has_variants && product.variants && product.variants.length > 0) {
  // إذا كان المنتج له متغيرات، نأخذ الكمية من أول متغير
  quantity = (product.variants[0] as ProductVariant)?.quantity ?? null;
} else {
  // إذا لم يكن له متغيرات، نأخذ الكمية من المنتج نفسه
  quantity = product.quantity ?? null;
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
    isBestSeller: product.is_most_selling,
    hasVariants: hasVariants,
    variants: variants,
    variantId: variantId,
    currency: product.currency || {
      code: "EGP",
      symbol: "$",
      name: "Egyptian Pound",
      rate: 1,
    },
     quantity: quantity,
  };
};

export function BestProducts({ onLoad }: BestProductsProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  //  إضافة state لمنع Hydration Error
  const [isClient, setIsClient] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const isMounted = useRef(true);
  const fetchingRef = useRef(false);

  // ✅ استدعاء onLoad بعد تحميل البيانات
  useEffect(() => {
    if (!isInitialLoading && !isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
  }, [isInitialLoading, isDataLoaded, onLoad]);

  //  تعيين isClient بعد تحميل العميل
  useEffect(() => {
    setIsClient(true);
  }, []);

  // جلب المنتجات من API
  const fetchProducts = useCallback(async (page: number, append: boolean = false) => {
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      
      if (page === 1) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const productsData = await getMostSellingProducts(page, 12);
      
      if (!isMounted.current) return;
      
      if (productsData.length === 0) {
        setHasMore(false);
      }
      
      const transformedProducts = productsData.map(transformProduct);
      
      if (append) {
        setProducts(prev => [...prev, ...transformedProducts]);
      } else {
        setProducts(transformedProducts);
      }
      
      setTotalProducts(productsData.length);
      setHasMore(productsData.length === 12);
      
    } catch (err) {
      console.error('Error fetching most selling products:', err);
      if (!isMounted.current) return;
      setError(t.error);
      setProducts([]);
    } finally {
      if (!isMounted.current) return;
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [t.error]);

  useEffect(() => {
    isMounted.current = true;
    
    const timeoutId = setTimeout(() => {
      fetchProducts(1, false);
    }, 0);
    
    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
    };
  }, [fetchProducts]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !fetchingRef.current) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchProducts(nextPage, true);
    }
  }, [hasMore, isLoadingMore, currentPage, fetchProducts]);

  const visibleProducts = products.slice(0, displayCount);
  const showLoadMoreButton = hasMore && products.length >= displayCount && products.length < totalProducts;

  //  عرض نسخة ثابتة أثناء Hydration
  if (!isClient) {
    return (
      <section className="py-6 md:py-12 bg-white">
        <div className="container-custom">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // عرض السبينر الرئيسي أثناء التحميل الأولي -  استخدام الترجمة
  if (isInitialLoading) {
    return (
      <section className="py-6 md:py-12 bg-white">
        <div className="container-custom">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 text-sm animate-pulse">
                {t.loading}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // عرض رسالة خطأ -  استخدام الترجمة
  if (error && products.length === 0) {
    if (!isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
    return (
      <section className="py-6 md:py-12 bg-white">
        <div className="container-custom">
          <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
            <p className="text-red-500 text-center">{t.error}</p>
            <button 
              onClick={() => fetchProducts(1, false)}
              className="px-6 py-2 bg-main text-white rounded-lg hover:bg-main-dark transition-colors"
            >
              {t.retry}
            </button>
          </div>
        </div>
      </section>
    );
  }

  //  عرض رسالة عدم وجود منتجات
  if (products.length === 0 && !isInitialLoading) {
    if (!isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
    return null;
  }

  return (
    <section className="py-6 md:py-12 bg-white">
      <div className="container-custom">
        {/* Header -  استخدام الترجمة */}
        <div className="mb-2 md:mb-5 flex justify-between items-center">
          <h2 className="text-base md:text-xl font-bold" style={{ color: '#112B40' }}>
            {t.bestSelling}
          </h2>
          <Link 
            href="/products" 
            className="text-primary text-xs lg:text-sm font-bold hover:underline transition-all duration-300"
          >
            {t.viewMore}
          </Link>
        </div>

        {/*  مؤشر تحميل عند تحميل المزيد -  استخدام الترجمة */}
        {isLoadingMore && (
          <div className="flex justify-center py-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
              <span className="text-gray-500 text-sm">{t.loadingMore}</span>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6 mb-2 md:mb-5">
          {visibleProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-in fade-in zoom-in duration-500 flex justify-center w-full"
              style={{ 
                animationFillMode: 'both',
                animationDelay: `${index * 100}ms`
              }}
            >
              <ProductCard 
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                hoverImage={product.hoverImage}
                href={product.href}
                originalPrice={product.originalPrice}
                discount={product.discount}
                colors={product.colors}
                rating={product.rating}
                reviewsCount={product.reviewsCount}
                isBestSeller={product.isBestSeller}
                hasVariants={product.hasVariants || false}
                variants={product.variants || []}
                variantId={product.variantId || null}
                  quantity={product.quantity} 
              />
            </div>
          ))}
        </div>

        {/* Load More Button -  استخدام الترجمة */}
        {showLoadMoreButton && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-8 py-3 bg-main text-white rounded-lg hover:bg-main-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t.loadingMore}
                </>
              ) : (
                t.loadMore
              )}
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
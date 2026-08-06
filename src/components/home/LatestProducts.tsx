// components/LatestProducts.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ProductCard } from "../products/ProductCard";
import { getNewProducts, ProductData } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product, ProductVariant, VariantAttribute } from "@/types/product";

interface LatestProductsProps {
  onLoad?: () => void;
}

//  دالة للحصول على الترجمات حسب اللغة
const getTranslations = (lang: string) => {
  if (lang === "en") {
    return {
      latestProducts: "Latest Products",
      viewMore: "View More",
      loading: "Loading products...",
      error: "Failed to load products",
      noProducts: "No products available",
      retry: "Retry",
    };
  }
  // Arabic (default)
  return {
    latestProducts: "أحدث المنتجات",
    viewMore: "عرض المزيد",
    loading: "جاري تحميل المنتجات...",
    error: "فشل في تحميل المنتجات",
    noProducts: "لا توجد منتجات متاحة",
    retry: "إعادة المحاولة",
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

// تحويل البيانات من API إلى شكل المنتج المطلوب - ديناميكي بالكامل
const transformProduct = (product: ProductData): Product => {
  // معالجة الصور بشكل صحيح
  const cleanImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.startsWith("/storage")) {
      return `https://ekhtarktabak.t-carts.com${url}`;
    }
    return `https://ekhtarktabak.t-carts.com${url}`;
  };

  const mainImage =
    product.images && product.images.length > 0
      ? cleanImageUrl(product.images[0])
      : "/images/placeholder.jpg";

  const hoverImage =
    product.images && product.images.length > 1
      ? cleanImageUrl(product.images[1])
      : mainImage;

  // حساب الخصم بشكل ديناميكي
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

  //  استخراج الألوان من جميع الـ variants ديناميكياً
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
    // ✅ إضافة الكمية من البيانات المسترجعة
    quantity: product.quantity ?? null,
  };
};

export function LatestProducts({ onLoad }: LatestProductsProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);

  //  إضافة state لمنع Hydration Error
  const [isClient, setIsClient] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  //  تغيير الاسم من isMounted إلى isMountedRef لتجنب التعارض
  const isMountedRef = useRef(true);
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
  const fetchProducts = useCallback(
    async (page: number, append: boolean = false) => {
      if (fetchingRef.current) return;

      try {
        fetchingRef.current = true;

        if (page === 1) {
          setIsInitialLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const productsData = await getNewProducts(page, 12);

        if (!isMountedRef.current) return;

        if (productsData.length === 0) {
          setHasMore(false);
        }

        const transformedProducts = productsData.map(transformProduct);

        if (append) {
          setProducts((prev) => [...prev, ...transformedProducts]);
        } else {
          setProducts(transformedProducts);
        }

        setTotalProducts(productsData.length);
        setHasMore(productsData.length === 12);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (!isMountedRef.current) return;
        setError(t.error);
        setProducts([]);
      } finally {
        if (!isMountedRef.current) return;
        setIsInitialLoading(false);
        setIsLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [t.error],
  );

  useEffect(() => {
    isMountedRef.current = true;

    const timeoutId = setTimeout(() => {
      fetchProducts(1, false);
    }, 0);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, [fetchProducts]);

  const visibleProducts = products.slice(0, displayCount);

  //  عرض نسخة ثابتة أثناء Hydration (بدون نصوص مترجمة)
  if (!isClient) {
    return (
      <section className="py-2 md:py-12 bg-white">
        <div className="container-custom">
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#23A6F0]"></div>
          </div>
        </div>
      </section>
    );
  }

  // عرض السبينر الرئيسي أثناء التحميل الأولي -  استخدام الترجمة
  if (isInitialLoading) {
    return (
      <section className="py-2 md:py-12 bg-white">
        <div className="container-custom">
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#23A6F0]"></div>
          </div>
        </div>
      </section>
    );
  }

  //  عرض رسالة خطأ مترجمة
  if (error && products.length === 0) {
    if (!isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
    return <></>;
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
    <section className="py-2 md:py-12 bg-white">
      <div className="container-custom">
        {/* Header -  استخدام الترجمة */}
        <div className="mb-2 md:mb-5 flex justify-between items-center">
          <h2
            className="text-base md:text-2xl font-bold"
            style={{ color: "#112B40" }}
          >
            {t.latestProducts}
          </h2>
          <Link
            href="/products"
            className="text-[#23A6F0] text-xs lg:text-sm font-semibold hover:underline"
          >
            {t.viewMore}
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center mb-10">
          {visibleProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-in fade-in zoom-in duration-500 flex justify-center w-full"
              style={{
                animationFillMode: "both",
                animationDelay: `${index * 100}ms`,
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
                quantity={product.quantity} // ✅ تمرير الكمية إلى ProductCard
              />
            </div>
          ))}
        </div>

        {/* Loading State for Load More -  استخدام الترجمة */}
        {isLoadingMore && (
          <div className="flex flex-col justify-center items-center py-8 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#23A6F0]"></div>
            <p className="text-gray-500 text-sm">{t.loading}</p>
          </div>
        )}
      </div>
    </section>
  );
}
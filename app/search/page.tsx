// app/search/page.tsx
"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/products/Pagination";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { getHeaders } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = "https://admin.ekhtarktabak.com/api";

// تعريف واجهات
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

interface TransformedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage: string;
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
  quantity?: number | null;
}

// دالة جلب التوكن
const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

// دالة استخراج الألوان من جميع الـ variants
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

// دالة جلب نتائج البحث المعدلة
const searchProducts = async (
  query: string,
  page: number = 1,
  perPage: number = 10,
) => {
  try {
    const token = getToken();

    const response = await fetch(
      `${API_URL}/products?page=${page}&per_page=${perPage}&search=${encodeURIComponent(query)}`,
      {
        headers: getHeaders()
      },
    );

    const data = await response.json();

    if (data.result === true && data.data) {
      return {
        result: true,
        data: {
          products: data.data.products || [],
          pagination: {
            current_page: data.data.pagination?.current_page || page,
            last_page: data.data.pagination?.last_page || 1,
            per_page: data.data.pagination?.per_page || perPage,
            total: data.data.pagination?.total || 0,
            from: data.data.pagination?.from || 0,
            to: data.data.pagination?.to || 0,
            next_page: data.data.pagination?.next_page || null,
            previous_page: data.data.pagination?.previous_page || null,
          },
        },
      };
    }

    return data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// دالة تحويل المنتج لنفس صيغة ProductCard مع دعم الفاريانتات
const transformProductForCard = (product: any): TransformedProduct => {
  let colors: Array<{ color: string; name: string }> = [];
  let hasVariants = false;
  let variants: ProductVariant[] = [];
  let variantId: number | null = null;

  if (product.has_variants && product.variants && product.variants.length > 0) {
    hasVariants = true;
    variants = product.variants;
    variantId = product.variants[0].id;
    colors = extractColorsFromVariants(product.variants);
  }

  const cleanImageUrl = (url: string) => {
    if (!url) return "/images/placeholder-product.jpg";
    if (url.startsWith("/storage")) {
      return `https://admin.ekhtarktabak.com${url}`;
    }
    return url;
  };

  const finalPrice =
    product.pricing?.final_price || product.pricing?.price || 0;
  const originalPrice = product.pricing?.price;
  const hasDiscount = product.pricing?.has_discount || false;

  let discount = undefined;
  if (hasDiscount && originalPrice && originalPrice > finalPrice) {
    discount = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  }

  let quantity: number | null = null;
  if (product.has_variants && product.variants && product.variants.length > 0) {
    quantity = (product.variants[0] as ProductVariant)?.quantity ?? null;
  } else {
    quantity = product.quantity ?? null;
  }

  return {
    id: product.id.toString(),
    name: product.name,
    price: finalPrice,
    image: cleanImageUrl(product.images?.[0]),
    hoverImage: product.images?.[1]
      ? cleanImageUrl(product.images[1])
      : cleanImageUrl(product.images?.[0]),
    href: `/product/${product.id}`,
    originalPrice: hasDiscount ? originalPrice : undefined,
    discount: discount,
    colors: colors,
    rating: product.avg_rating || 0,
    reviewsCount: product.total_reviews || 0,
    isBestSeller: product.is_active,
    hasVariants: hasVariants,
    variants: variants,
    variantId: variantId,
    quantity: quantity,
  };
};

// مكون البحث الرئيسي
function SearchContent() {
  const { t } = useTranslation();
  const { language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchInput, setSearchInput] = useState(query);
  const [sortBy, setSortBy] = useState("");

  const perPage = 10;
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSearchingRef = useRef(false);

  // خيارات الترتيب باستخدام useTranslation
  const sortOptions = [
    { value: "newest", label: t('search.sortNewest') },
    { value: "popular", label: t('search.sortPopular') },
    { value: "price_asc", label: t('search.sortPriceAsc') },
    { value: "price_desc", label: t('search.sortPriceDesc') },
  ];

  // دالة جلب النتائج
  const fetchSearchResults = useCallback(async (searchQuery: string, page: number) => {
    // إذا لم يكن هناك استعلام، امسح النتائج
    if (!searchQuery) {
      setProducts([]);
      setTotalProducts(0);
      setLastPage(1);
      setIsLoading(false);
      setIsFirstLoad(false);
      isSearchingRef.current = false;
      return;
    }

    // إلغاء الطلب السابق إذا كان موجوداً
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const result = await searchProducts(searchQuery, page, perPage);

      if (!abortControllerRef.current?.signal.aborted) {
        if (result.result === true && result.data) {
          const productsData = result.data.products || [];
          const paginationData = result.data.pagination;

          setProducts(productsData);
          setLastPage(paginationData?.last_page || 1);
          setTotalProducts(paginationData?.total || productsData.length);
        } else {
          setProducts([]);
          setTotalProducts(0);
          setLastPage(1);
        }
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.error("Error fetching search results:", error);
        toast.error(t('search.error'));
        setProducts([]);
        setTotalProducts(0);
        setLastPage(1);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
        setIsFirstLoad(false);
        isSearchingRef.current = false;
      }
    }
  }, [perPage, t]);

  // تحميل النتائج عند تغيير الاستعلام أو الصفحة
  useEffect(() => {
    if (query) {
      fetchSearchResults(query, currentPage);
    } else {
      setProducts([]);
      setTotalProducts(0);
      setLastPage(1);
      setIsLoading(false);
      setIsFirstLoad(false);
      isSearchingRef.current = false;
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, currentPage, fetchSearchResults]);

  // تحديث حقل البحث عند تغيير الاستعلام من الـ URL
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // تطبيق الترتيب
  useEffect(() => {
    if (products.length > 0 && sortBy) {
      const sortedProducts = [...products];
      switch (sortBy) {
        case "price_asc":
          sortedProducts.sort(
            (a, b) =>
              (a.pricing?.final_price || a.pricing?.price || 0) -
              (b.pricing?.final_price || b.pricing?.price || 0),
          );
          break;
        case "price_desc":
          sortedProducts.sort(
            (a, b) =>
              (b.pricing?.final_price || b.pricing?.price || 0) -
              (a.pricing?.final_price || a.pricing?.price || 0),
          );
          break;
        case "newest":
          sortedProducts.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          break;
        case "popular":
          sortedProducts.sort(
            (a, b) => (b.sales_count || 0) - (a.sales_count || 0),
          );
          break;
        default:
          break;
      }
      setProducts(sortedProducts);
    }
  }, [sortBy, products.length]);

  // معالج البحث
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = searchInput.trim();
    if (!trimmedQuery) return;
    
    // منع التكرار
    if (isSearchingRef.current) return;
    if (trimmedQuery === query) return;
    
    isSearchingRef.current = true;
    
    // إعادة تعيين الصفحة إلى 1
    setCurrentPage(1);
    // تنظيف النتائج السابقة
    setProducts([]);
    setTotalProducts(0);
    setLastPage(1);
    setIsFirstLoad(true);
    
    // التوجيه إلى الرابط الجديد باستخدام replace
    router.replace(`/search?q=${encodeURIComponent(trimmedQuery)}`, { scroll: false });
  };

  const handleSortChange = (value: string | null) => {
    setSortBy(value || "newest");
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= lastPage && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPaginationInfo = () => {
    if (totalProducts === 0) return "";
    const from = (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, totalProducts);
    return t('search.showingResults', { from, to, total: totalProducts });
  };

  // عرض التحميل الأولي
  if (isFirstLoad && query) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('search.loading')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-with-padding">
      <div className="container mx-auto px-4 pb-16 lg:px-9">
        {/* عنوان الصفحة وشريط البحث */}
        <div className="mb-3 md:mb-8">
          <h1 className="text-xl md:text-xl font-bold text-gray-800 mb-4">
            {t('search.title')}
          </h1>

          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full px-6 py-3 ps-4 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-[#23A6F0] focus:border-[#23A6F0]"
            />
            <button
              type="submit"
              className={`absolute ${language === 'en' ? 'end-3' : 'end-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#23A6F0] transition`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#23A6F0] rounded-full animate-spin"></div>
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>

        {/* عدد النتائج وشريط الترتيب */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <p className="text-gray-600">
            {!isLoading && query && (
              totalProducts > 0 ? (
                t('search.foundResults', { count: totalProducts, query })
              ) : (
                t('search.noResults', { query })
              )
            )}
          </p>
          
          {products.length > 0 && !isLoading && (
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="h-12 bg-[#F0F0F0] rounded-full focus:ring-[#23A6F0] focus:ring-offset-0 w-[180px]">
                <SelectValue placeholder={t('search.sortBy')} />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-[8px] shadow-lg border-gray-100">
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer hover:bg-blue-50 hover:text-[#23A6F0] focus:bg-blue-50 focus:text-[#23A6F0]"
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* مؤشر التحميل الإضافي */}
        {isLoading && products.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-[#23A6F0] rounded-full animate-spin"></div>
              <span className="text-gray-500">{t('search.loadingMore')}</span>
            </div>
          </div>
        )}

        {/* قائمة المنتجات */}
        {!isLoading && products.length > 0 && (
          <>
            <div className="text-sm text-gray-500 mb-3">
              {getPaginationInfo()}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6 mb-4">
              {products.map((product) => {
                const cardData = transformProductForCard(product);
                return (
                  <div key={cardData.id} className="flex justify-center w-full">
                    <ProductCard
                      id={cardData.id}
                      name={cardData.name}
                      price={cardData.price}
                      image={cardData.image}
                      hoverImage={cardData.hoverImage}
                      href={cardData.href}
                      originalPrice={cardData.originalPrice}
                      discount={cardData.discount}
                      colors={cardData.colors}
                      rating={cardData.rating}
                      reviewsCount={cardData.reviewsCount}
                      isBestSeller={cardData.isBestSeller}
                      hasVariants={cardData.hasVariants || false}
                      variants={cardData.variants || []}
                      variantId={cardData.variantId || null}
                      quantity={cardData.quantity}
                    />
                  </div>
                );
              })}
            </div>

            {/* الباجينشن */}
            {lastPage > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  lastPage={lastPage}
                  onPageChange={handlePageChange}
                  total={totalProducts}
                />
              </div>
            )}
          </>
        )}

        {/* رسالة عدم وجود نتائج */}
        {!isLoading && !isFirstLoad && products.length === 0 && query && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {t('search.noResultsTitle')}
            </h3>
            <p className="text-gray-500 mb-3">
              {t('search.noResultsMessage', { query })}
            </p>
            <button
              onClick={() => router.replace("/")}
              className="inline-block bg-[#23A6F0] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#39abee] transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {t('search.backToHome')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { t } = useTranslation();
  
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text={t('search.loadingPage')} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
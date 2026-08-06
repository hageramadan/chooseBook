// app/account/wishlist/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, Trash2, X, ChevronRight } from "lucide-react";
import Pagination from "@/components/products/Pagination";
import { ProductCard } from "@/components/products/ProductCard";
import {
  useFavorites,
  transformFavoriteToProductCard,
} from "@/hooks/useFavorites";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";

// ========== مكون عنوان الصفحة ==========
const PageHeader = ({ title }: { title: string }) => {
  const { t } = useTranslation();

  return (
    <div className="page-with-padding">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#23A6F0] transition">
          {t("common.home")}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/account" className="hover:text-[#23A6F0] transition">
          {t("common.myAccount")}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#23A6F0]">{title}</span>
      </div>
    </div>
  );
};

// ========== مكون المفضلة فارغة ==========
const WishlistEmpty = () => {
  const { t } = useTranslation();

  return (
    <div className="container h-[80vh]">
      <PageHeader title={t("wishlist.title")} />

      <div className="text-center rounded-2xl mt-5">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t("wishlist.emptyTitle")}
        </h2>
        <p className="text-gray-500 mb-6">{t("wishlist.emptyMessage")}</p>
        <Link
          href="/products"
          className="inline-block bg-[#23A6F0] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#39abee] transition-all duration-300 shadow-md hover:shadow-lg"
        >
          {t("wishlist.exploreProducts")}
        </Link>
      </div>
    </div>
  );
};

// تعريف نوع المنتج المحول
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
  variants?: Array<{ id: number }>;
  variantId?: number | null;
  currency?: {
    code: string;
    symbol: string;
    name: string;
    rate: number;
  };
  quantity?: number | null; // ✅ إضافة الكمية
}

//  إضافة واجهة Pagination
interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  next_page: number | null;
  previous_page: number | null;
}

export default function WishlistPage() {
  const { t } = useTranslation();
  const {
    favorites,
    isLoading,
    isMutating,
    total,
    clearAllFavorites,
    refetch,
  } = useFavorites();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<TransformedProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 8,
    total: 0,
    from: 0,
    to: 0,
    next_page: null,
    previous_page: null,
  });

  const itemsPerPage = 8;

  //  تحويل البيانات من useFavorites إلى المنتجات المحولة
  const transformFavorites = useCallback((favoritesData: any[]) => {
    if (!favoritesData || favoritesData.length === 0) {
      return [];
    }

    const transformedItems: TransformedProduct[] = [];
    favoritesData.forEach((favorite: any) => {
      try {
        //  استخراج المنتج من الـ favorite
        const product = favorite.product || favorite;

        //  تحويل المنتج إلى ProductCard
        const transformed = transformFavoriteToProductCard(favorite);

        if (transformed && transformed.id && transformed.id !== "0") {
          transformedItems.push({
            ...transformed,
            hasVariants: product.has_variants || false,
            variants: product.variants || [],
            variantId:
              product.has_variants && product.variants?.length > 0
                ? product.variants[0].id
                : null,
            currency: product.currency || {
              code: "EGP",
              symbol: "$",
              name: "Egyptian Pound",
              rate: 1,
            },
            // ✅ إضافة الكمية من بيانات المنتج
            quantity: product.quantity ?? null,
          });
        }
      } catch (error) {
        console.error("❌ Error transforming favorite:", error);
      }
    });

    // إزالة التكرارات
    return Array.from(
      new Map(transformedItems.map((item) => [item.id, item])).values(),
    );
  }, []);

  //  تحديث العناصر عند تغيير favorites
  useEffect(() => {
    if (favorites) {
      const transformed = transformFavorites(favorites);
      setItems(transformed);

      // تحديث pagination
      const totalItems = transformed.length;
      const lastPage = Math.ceil(totalItems / itemsPerPage) || 1;

      setPagination({
        current_page: currentPage,
        last_page: lastPage,
        per_page: itemsPerPage,
        total: totalItems,
        from: (currentPage - 1) * itemsPerPage + 1,
        to: Math.min(currentPage * itemsPerPage, totalItems),
        next_page: currentPage < lastPage ? currentPage + 1 : null,
        previous_page: currentPage > 1 ? currentPage - 1 : null,
      });
    }
  }, [favorites, currentPage, transformFavorites]);

  //  تحديث الصفحة عند تغيير الـ Page
  const handlePageChange = useCallback(
    (page: number) => {
      const lastPage = Math.ceil(items.length / itemsPerPage) || 1;
      if (page >= 1 && page <= lastPage) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [items.length],
  );

  //  عرض العناصر حسب الصفحة الحالية
  const getCurrentPageItems = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  //  تحديث القائمة بعد الحذف
  const handleClearAll = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const confirmClearAll = useCallback(async () => {
    try {
      await clearAllFavorites();
      setShowClearConfirm(false);
      //  إعادة تحميل البيانات من خلال refetch
      await refetch();
      // toast.success(t("wishlist.clearSuccess"));
    } catch (error) {
      console.error("❌ Error clearing favorites:", error);
      toast.error(t("wishlist.clearError"));
    }
  }, [clearAllFavorites, refetch, t]);

  const cancelClearAll = useCallback(() => {
    setShowClearConfirm(false);
  }, []);

  const cleanImageUrl = useCallback((url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/storage")) {
      return `https://ekhtarktabak.t-carts.com${url}`;
    }
    return url;
  }, []);

  //  الحصول على عناصر الصفحة الحالية
  const currentItems = getCurrentPageItems();

  // ========== عرض حالة التحميل ==========
  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] ">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 ">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-gray-300 border-t-[#23A6F0] rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== عرض حالة فارغة ==========
  if (!isLoading && items.length === 0) {
    return <WishlistEmpty />;
  }

  // ========== عرض المنتجات ==========
  return (
    <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] ">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4">
        {/*  استخدام PageHeader */}
        <PageHeader title={t("wishlist.title")} />

        {/*  شريط التحكم */}
        <div className="flex flex-wrap justify-between items-center gap-4 mt-6 mb-3 md:mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 bg-red-700" />
            <span className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">
                {items.length > 2
                  ? t("wishlist.itemsCount", { count: items.length })
                  : t("wishlist.itemCount", { count: items.length })}
              </span>
            </span>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isMutating}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition disabled:opacity-50 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t("wishlist.clearAll")}</span>
            </button>
          )}
        </div>

        {/*  شبكة المنتجات */}
        <div className="wishlist-grid">
          {currentItems.map((item) => (
            <div key={item.id} className="flex justify-center w-full">
              <ProductCard
                id={item.id}
                name={item.name}
                price={item.price}
                image={cleanImageUrl(item.image)}
                hoverImage={cleanImageUrl(item.hoverImage)}
                href={item.href}
                originalPrice={item.originalPrice}
                discount={item.discount}
                colors={item.colors}
                rating={item.rating}
                reviewsCount={item.reviewsCount}
                isBestSeller={item.isBestSeller}
                hasVariants={item.hasVariants || false}
                variants={item.variants || []}
                variantId={item.variantId || null}
                // currency={item.currency}
                quantity={item.quantity} // ✅ تمرير الكمية إلى ProductCard
              />
            </div>
          ))}
        </div>

        {/*  Pagination */}
        {pagination.last_page > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              onPageChange={handlePageChange}
              total={pagination.total}
            />
          </div>
        )}
      </div>

      {/*  نافذة تأكيد الحذف */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* رأس النافذة */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                {t("wishlist.confirmTitle")}
              </h3>
              <button
                onClick={cancelClearAll}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* محتوى النافذة */}
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-700 text-lg font-medium mb-2">
                  {t("wishlist.confirmMessage")}
                </p>
                <p className="text-gray-500 text-sm">
                  {t("wishlist.confirmWarning")}{" "}
                  <span className="font-bold text-[#EC221F]">
                    {/* {items.length} */}
                  </span>{" "}
                  {items.length > 0
                    ? t("wishlist.itemsCount", { count: items.length })
                    : t("wishlist.itemCount", { count: items.length })}{" "}
                  {t("wishlist.fromWishlist")}
                </p>
              </div>
            </div>

            {/* أزرار النافذة */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={cancelClearAll}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-[8px] hover:bg-gray-50 transition font-medium"
              >
                {t("wishlist.cancel")}
              </button>
              <button
                onClick={confirmClearAll}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-[8px] hover:bg-red-700 transition font-medium"
              >
                {t("wishlist.clearAll")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
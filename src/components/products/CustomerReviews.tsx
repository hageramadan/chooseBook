// components/home/CustomerReviews.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Star,
  StarHalf,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AiFillLike } from "react-icons/ai";
import { AiOutlineDislike } from "react-icons/ai";
import { FaCircleCheck } from "react-icons/fa6";
import { BsThreeDots } from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProductReviews, ReviewData } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation"; // إضافة useTranslation

interface CustomerReviewsProps {
  productId: number;
}

// مكون عرض التقييم بالنجوم
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className="w-5 h-5 fill-[#FFCC00] text-[#FFCC00]"
        />
      ))}
      {hasHalfStar && (
        <StarHalf className="w-5 h-5 fill-[#FFCC00] text-[#FFCC00]" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
      ))}
    </div>
  );
};

// مكون البطاقة الواحدة
const ReviewCard = ({ review, language, t }: { review: ReviewData; language: string; t: any }) => {
  // تنسيق التاريخ حسب اللغة
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-[8px] p-3 lg:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      {/* معلومات المستخدم والتقييم */}
      <div className="flex items-center justify-between mb-2">
        <div className="gap-3">
          <div>
            <StarRating rating={review.rating} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            <h4 className="text-[#000000ce] text-[16px]">{review.user.name}</h4>
            {review.user.verified && (
              <FaCircleCheck className="text-[#01AB31] w-4 h-4" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <BsThreeDots className="w-5 h-5" />
        </div>
      </div>

      {/* التعليق */}
      <p className="text-[#00000099] text-[14px] leading-relaxed">
        {review.comment}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-base text-gray-500">
          <span>{formatDate(review.created_at)}</span>
        </div>

        {/* عدد الإعجابات */}
        <div className="flex items-center gap-2">
          <div className="border rounded-[8px] border-[#E4E9EE] p-1">
            <AiOutlineDislike className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 border rounded-[8px] border-[#E4E9EE] p-1">
            <span>0</span>
            <AiFillLike className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export function CustomerReviews({ productId }: CustomerReviewsProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(); // استخدام useTranslation بدلاً من الترجمة المخصصة
  const isRTL = language === 'ar';
  
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [sortBy, setSortBy] = useState<"الأحدث" | "الأقدم" | "أعلى تقييم" | "أقل تقييم">();
  const reviewsPerPage = 5;

  // خيارات الترتيب باستخدام useTranslation
  const sortOptions = [
    { value: t('reviews.newest'), label: t('reviews.newest') },
    { value:t('reviews.oldest') , label: t('reviews.oldest') },
    { value: t('reviews.highest'), label: t('reviews.highest') },
    { value: t('reviews.lowest'), label: t('reviews.lowest') },
  ];

  // جلب التقييمات من الـ API
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const result = await getProductReviews(productId, currentPage, reviewsPerPage, sortBy);
      setReviews(result.reviews);
      setTotalReviews(result.totalReviews);
      setAverageRating(result.averageRating);
      if (result.pagination) {
        setTotalPages(result.pagination.last_page);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // جلب البيانات عند تغيير الصفحة أو الترتيب أو المنتج
  useEffect(() => {
    fetchReviews();
  }, [productId, currentPage, sortBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (value: string | null) => {
    setSortBy(value as typeof sortBy);
    setCurrentPage(1);
  };

  // حساب إحصائيات التقييمات من البيانات المستلمة
  const getRatingPercentage = (ratingValue: number) => {
    if (totalReviews === 0) return 0;
    const count = reviews.filter(r => Math.floor(r.rating) === ratingValue).length;
    return (count / totalReviews) * 100;
  };

  if (isLoading && reviews.length === 0) {
    return (
      <section className="py-6 md:py-12 bg-white">
        <div className="container-custom">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#23A6F0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              {/* <p className="text-gray-500">{t('reviews.loadingReviews')}</p> */}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-12 bg-white">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div className="flex gap-1 items-center">
            <h1 className="text-base lg:text-xl font-bold text-[#181818]">
              {t('reviews.productReviews')}
            </h1>
            {totalReviews > 0 &&(
<div className="text-sm font-bold text-[#3A4980]">
              ({totalReviews} {t('reviews.reviews')})
            </div>
            )}
            
          </div>
          
          {/* <div className="grid grid-cols-2 gap-3 items-center">
         
            {totalReviews > 0 && (
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="h-12 bg-[#F0F0F0] rounded-full focus:ring-[#23A6F0] focus:ring-offset-0">
                  <SelectValue placeholder={t('reviews.sortBy')} />
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

            <button className="bg-[#23A6F0] text-white rounded-full px-1 lg:px-3 py-2.5 text-sm font-bold hover:bg-[#23A6F0] transition-all duration-300">
              {t('reviews.addReview')}
            </button>
          </div> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* قائمة التقييمات */}
          <div className="lg:col-span-2">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-[8px]">
                <p className="text-gray-500 text-sm">{t('reviews.noReviews')}</p>
                {/* <button className="mt-4 bg-[#23A6F0] text-white px-6 py-2 rounded-full text-sm">
                  {t('reviews.beFirst')}
                </button> */}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard 
                      key={review.id} 
                      review={review} 
                      language={language}
                      t={t}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-[8px] border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      {isRTL ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : (
                        <ChevronLeft className="w-5 h-5" />
                      )}
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-8 h-8 rounded-[8px] transition ${
                          currentPage === i + 1
                            ? "bg-black text-white"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-[8px] border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      {isRTL ? (
                        <ChevronLeft className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
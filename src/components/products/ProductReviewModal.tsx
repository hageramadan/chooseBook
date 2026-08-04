// components/ProductReviewModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { submitReview } from '@/services/reviews';
import toast from 'react-hot-toast';

interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  onReviewSubmitted: (productId: number) => void;
}

export function ProductReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  onReviewSubmitted,
}: ProductReviewModalProps) {
  const { t, language } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ ترجمات المودال
  const translations = {
    ar: {
      title: 'تقييم المنتج',
      productLabel: 'قيم تجربتك مع المنتج:',
      selectRating: 'اختر تقييمك للمنتج',
      yourRating: 'تقييمك:',
      of: 'من',
      placeholder: 'اكتب تجربتك مع المنتج...',
      cancel: 'إلغاء',
      submit: 'إرسال التقييم',
      submitting: 'جاري الإرسال...',
      ratingRequired: 'يرجى اختيار تقييم للمنتج',
      commentRequired: 'يرجى كتابة تعليق لا يقل عن 3 أحرف',
      success: 'تم إضافة تقييمك للمنتج بنجاح!',
      error: 'حدث خطأ في إضافة التقييم',
      unauthorized: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى',
      serverError: 'حدث خطأ في الاتصال بالخادم',
      ratingSaved: 'تم حفظ تقييمك للمنتج!',
    },
    en: {
      title: 'Product Review',
      productLabel: 'Rate your experience with this product:',
      selectRating: 'Select your rating for this product',
      yourRating: 'Your rating:',
      of: 'of',
      placeholder: 'Write your experience with the product...',
      cancel: 'Cancel',
      submit: 'Submit Review',
      submitting: 'Submitting...',
      ratingRequired: 'Please select a rating for the product',
      commentRequired: 'Please write a comment (at least 3 characters)',
      success: 'Your product review has been submitted successfully!',
      error: 'An error occurred while submitting the review',
      unauthorized: 'Invalid session, please login again',
      serverError: 'An error occurred while connecting to the server',
      ratingSaved: 'Your product rating has been saved!',
    },
  };

  // ✅ الحصول على الترجمات حسب اللغة
  const lang = language === 'en' ? 'en' : 'ar';
  const text = translations[lang];

  // إعادة تعيين الحالة عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
    }
  }, [isOpen]);

  // ✅ دالة الحصول على نص التقييم حسب اللغة
  const getRatingText = (ratingValue: number) => {
    const ratingTexts = {
      ar: ['', 'ضعيف جداً', 'ضعيف', 'جيد', 'جيد جداً', 'ممتاز'],
      en: ['', 'Very Poor', 'Poor', 'Good', 'Very Good', 'Excellent'],
    };
    return ratingTexts[lang][ratingValue] || '';
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(text.ratingRequired, {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    if (comment.trim().length < 3) {
      toast.error(text.commentRequired, {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        rating,
        comment: comment.trim(),
        product_id: productId,
      };

      const response = await submitReview(reviewData);

      if (response.result) {
        // toast.success(text.success, {
        //   duration: 4000,
        //   position: 'top-center',
        // });
        onReviewSubmitted(productId);
        onClose();
      } else {
        toast.error(response.message || text.error, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        toast.error(text.unauthorized, {
          duration: 3000,
          position: 'top-center',
        });
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1500);
      } else {
        toast.error(text.serverError, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{text.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-2xl"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {text.productLabel}{' '}
          <span className="font-bold text-[#23A6F0]">{productName}</span>
        </p>

        {/* ✅ تقييم النجوم مع تأثير التلوين باللون الأصفر */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-10 h-10 transition-all duration-200 ${
                    (hoverRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400 drop-shadow-md'
                      : 'fill-gray-200 text-gray-200 hover:fill-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-500 font-medium">
            {rating === 0
              ? text.selectRating
              : `${text.yourRating} ${rating} ${text.of} 5 - ${getRatingText(rating)}`}
          </p>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={text.placeholder}
          className="w-full p-3 border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#23A6F0] focus:ring-2 focus:ring-[#23A6F0]/20 resize-none bg-gray-50 min-h-[100px] transition"
          dir={language === 'en' ? 'ltr' : 'rtl'}
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[8px] border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            {text.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 py-2.5 rounded-[8px] bg-[#23A6F0] text-white font-medium hover:bg-[#23A6F0] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {text.submitting}
              </>
            ) : (
              text.submit
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
// components/cart/PromoCodeInput.tsx
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { getHeaders } from "@/services/api";

interface PromoCodeInputProps {
  onApply: (code: string, discount: number) => void;
  onRemove: () => void;
  appliedCode: string;
}

const API_URL = 'https://admin.ekhtarktabak.com/api';

//  دالة جلب التوكن
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

//  دالة جلب الـ Guest Token (مضافة)
const getGuestToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('guest_cart_token');
  }
  return null;
};

//  دالة جلب الهيدرز مع دعم Guest Token (محدثة)


// دالة تطبيق كود الخصم
const applyCouponAPI = async (code: string): Promise<{ success: boolean; discount: number; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/coupons/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code: code }),
    });
    
    const data = await response.json();
    
    if (data.result === true && data.data) {
      const discount = data.data?.coupon?.discount_percentage || 
                       data.data?.discount_percentage || 
                       data.data?.discount || 
                       0;
      return {
        success: true,
        discount: parseFloat(discount),
        message: data.message || "تم تطبيق كود الخصم بنجاح"
      };
    } else {
      return {
        success: false,
        discount: 0,
        message: data.message || "كود الخصم غير صحيح"
      };
    }
  } catch (error) {
    console.error("❌ Error applying coupon:", error);
    return {
      success: false,
      discount: 0,
      message: "حدث خطأ في الاتصال بالخادم"
    };
  }
};

// دالة إلغاء كود الخصم
const removeCouponAPI = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/coupons/remove`, {
      method: 'POST',
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    if (data.result === true) {
      return {
        success: true,
        message: data.message || "تم إلغاء كود الخصم"
      };
    } else {
      return {
        success: false,
        message: data.message || "حدث خطأ في إلغاء الكود"
      };
    }
  } catch (error) {
    console.error("❌ Error removing coupon:", error);
    return {
      success: false,
      message: "حدث خطأ في الاتصال بالخادم"
    };
  }
};

export function PromoCodeInput({ onApply, onRemove, appliedCode }: PromoCodeInputProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      setError(t('promoCode.enterCode'));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await applyCouponAPI(code);
      
      if (result.success) {
        toast.success(result.message);
        onApply(code.toUpperCase(), result.discount);
        setCode("");
        setError("");
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      setError(t('promoCode.unexpectedError'));
      toast.error(t('promoCode.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    
    try {
      const result = await removeCouponAPI();
      
      if (result.success) {
        toast.success(result.message);
        onRemove();
        setCode("");
        setError("");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(t('promoCode.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  //  حالة عرض الكود المطبق مع زر الإلغاء (مفعل)
  if (appliedCode) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between bg-main-light rounded-[8px] p-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm">{t('promoCode.applied')}</span>
            <span className="text-green-800 font-semibold text-sm">{appliedCode}</span>
          </div>
          {/*  زر إلغاء الكود - ظاهر ومفعل */}
          {/* <button
            onClick={handleRemove}
            disabled={isLoading}
            className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
            title={t('promoCode.remove') || "إلغاء الكود"}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </button> */}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && code.trim() && !isLoading) {
              handleApply();
            }
          }}
          placeholder={t('promoCode.placeholder')}
          disabled={isLoading}
          className={`px-2 md:px-4 py-2.5 w-[90%] lg:w-full border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm disabled:bg-gray-100 ${
            error ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        <button
          onClick={handleApply}
          disabled={!code.trim() || isLoading}
          className="px-3 md:px-5 w-fit md:py-2.5 bg-main text-white rounded-[8px] text-sm font-semibold hover:bg-main-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isLoading ? t('promoCode.applying') : t('promoCode.apply')}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
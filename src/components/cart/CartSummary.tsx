// components/cart/CartSummary.tsx
"use client";

import Link from "next/link";
import { PromoCodeInput } from "./PromoCodeInput";
import { FaArrowAltCircleLeft, FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency"; // ✅ إضافة استيراد useCurrency

interface CartSummaryProps {
  subtotal: number;
  totalDiscount: number;
  promoDiscount: number;
  promoCode: string;
  deliveryFee: number;
  total: number;
  onApplyPromoCode: (code: string, discount: number) => void;
  onRemovePromoCode: () => void;
  isApplying?: boolean;
}

export function CartSummary({
  subtotal,
  totalDiscount,
  promoDiscount,
  promoCode,
  deliveryFee,
  total,
  onApplyPromoCode,
  onRemovePromoCode,
  isApplying = false,
}: CartSummaryProps) {
  const { t } = useTranslation();
  const { currency, isLoading: currencyLoading } = useCurrency(); // ✅ استخدام الـ Hook
  
  // ✅ الحصول على رمز العملة
  const currencySymbol = currencyLoading ? '...' : (currency || 'EGP');
  
  const isDeliveryFree = deliveryFee === 0;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 mb-5">
      <h1 className="text-lg lg:text-xl font-bold text-[#180100] pb-2">
        {t('cartSummary.title')}
      </h1>

      <div className="space-y-4 py-4">
        <SummaryRow 
          label={t('cartSummary.subtotal')} 
          value={subtotal} 
          currencySymbol={currencySymbol} // ✅ تمرير رمز العملة
          t={t} 
        />
        
        {totalDiscount > 0 && (
          <SummaryRow 
            label={t('cartSummary.discount')} 
            value={-totalDiscount} 
            isDiscount 
            currencySymbol={currencySymbol} // ✅ تمرير رمز العملة
            t={t} 
          />
        )}
        
        {promoDiscount > 0 && (
          <SummaryRow 
            label={t('cartSummary.promoDiscount')} 
            value={-promoDiscount} 
            isDiscount 
            currencySymbol={currencySymbol} // ✅ تمرير رمز العملة
            t={t} 
          />
        )}
        
        <SummaryRow 
          label={t('cartSummary.deliveryFee')} 
          value={isDeliveryFree ? t('cartSummary.free') : deliveryFee} 
          currencySymbol={currencySymbol} // ✅ تمرير رمز العملة
          t={t}
        />

        <div className="border-t border-gray-200 my-2" />

        <SummaryRow 
          label={t('cartSummary.total')} 
          value={total} 
          isTotal 
          currencySymbol={currencySymbol} // ✅ تمرير رمز العملة
          t={t}
        />
      </div>

      <PromoCodeInput
        onApply={onApplyPromoCode}
        onRemove={onRemovePromoCode}
        appliedCode={promoCode}
      />

      <CheckoutButton t={t} />
    </div>
  );
}

const SummaryRow = ({ 
  label, 
  value, 
  isDiscount = false, 
  isTotal = false,
  currencySymbol, // ✅ استقبال رمز العملة
  t,
}: { 
  label: string; 
  value: number | string; 
  isDiscount?: boolean; 
  isTotal?: boolean;
  currencySymbol: string; // ✅ إضافة النوع
  t: any;
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val;
    if (isDiscount) return `-${currencySymbol} ${Math.abs(val).toLocaleString()}`; // ✅ استخدام رمز العملة
    return `${currencySymbol} ${val.toLocaleString()}`; // ✅ استخدام رمز العملة
  };

  const getValueClassName = () => {
    if (isDiscount) return "text-primary font-bold";
    if (isTotal) return "text-[20px] font-bold";
    return "font-semibold text-gray-800";
  };

  const getLabelClassName = () => {
    if (isTotal) return "text-lg font-bold text-gray-800";
    return "text-gray-600";
  };

  return (
    <div className="flex justify-between items-center">
      <span className={getLabelClassName()}>{label}</span>
      <span className={getValueClassName()}>{formatValue(value)}</span>
    </div>
  );
};

const CheckoutButton = ({ t }: { t: any }) => (
  <Link href="/checkout" className="flex items-center justify-center gap-2 mt-4 w-full bg-main text-white py-2 rounded-[8px] font-bold text-lg transition-all duration-300 shadow-md hover:shadow-lg hover:bg-main-dark">
    <button className="">
      {t('cartSummary.checkout')}
    </button>
    {/* <FaArrowLeft className="w-4 h-4"/> */}
  </Link>
);
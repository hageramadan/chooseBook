// app/account/orders/checkout/failed/CheckoutFailedContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, AlertCircle, CreditCard, ArrowRight, Home } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation"; // ✅ استيراد hook الترجمة

export default function CheckoutFailedContent() {
  const { t } = useTranslation(); // ✅ استخدام hook الترجمة
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const orderNum = searchParams.get('order_number');
    const reasonParam = searchParams.get('reason');
    
    setOrderNumber(orderNum);
    setReason(reasonParam);

    console.log('❌ Payment failed:', {
      orderNumber: orderNum,
      reason: reasonParam,
    });

    if (reasonParam === 'payment_declined') {
      toast.error(t('checkout.failed.paymentDeclined'), {
        duration: 4000,
        position: 'top-center',
      });
    } else {
      toast.error(t('checkout.failed.paymentFailed'), {
        duration: 4000,
        position: 'top-center',
      });
    }
  }, [searchParams, t]);

  const getErrorMessage = (reason: string | null): string => {
    const messages: Record<string, string> = {
      'payment_declined': t('checkout.failed.errors.paymentDeclined'),
      'insufficient_funds': t('checkout.failed.errors.insufficientFunds'),
      'card_expired': t('checkout.failed.errors.cardExpired'),
      'invalid_card': t('checkout.failed.errors.invalidCard'),
      'technical_error': t('checkout.failed.errors.technicalError'),
      'timeout': t('checkout.failed.errors.timeout'),
      'cancelled_by_user': t('checkout.failed.errors.cancelledByUser'),
      'fraud_suspected': t('checkout.failed.errors.fraudSuspected'),
      'authentication_failed': t('checkout.failed.errors.authenticationFailed'),
    };

    if (reason && messages[reason]) {
      return messages[reason];
    }
    return t('checkout.failed.errors.default');
  };

  const getIcon = (reason: string | null) => {
    if (reason === 'cancelled_by_user') {
      return <AlertCircle className="w-14 h-14 text-yellow-500" />;
    }
    if (reason === 'insufficient_funds') {
      return <CreditCard className="w-14 h-14 text-red-500" />;
    }
    return <XCircle className="w-14 h-14 text-red-500" />;
  };

  const getBgColor = (reason: string | null) => {
    if (reason === 'cancelled_by_user') {
      return 'bg-yellow-100';
    }
    return 'bg-red-100';
  };

  const getSuggestions = (reason: string | null): string[] => {
    const suggestions: Record<string, string[]> = {
      'payment_declined': [
        t('checkout.failed.suggestions.paymentDeclined.0'),
        t('checkout.failed.suggestions.paymentDeclined.1'),
        t('checkout.failed.suggestions.paymentDeclined.2')
      ],
      'insufficient_funds': [
        t('checkout.failed.suggestions.insufficientFunds.0'),
        t('checkout.failed.suggestions.insufficientFunds.1'),
        t('checkout.failed.suggestions.insufficientFunds.2')
      ],
      'card_expired': [
        t('checkout.failed.suggestions.cardExpired.0'),
        t('checkout.failed.suggestions.cardExpired.1')
      ],
      'invalid_card': [
        t('checkout.failed.suggestions.invalidCard.0'),
        t('checkout.failed.suggestions.invalidCard.1')
      ],
      'timeout': [
        t('checkout.failed.suggestions.timeout.0'),
        t('checkout.failed.suggestions.timeout.1')
      ],
      'cancelled_by_user': [
        t('checkout.failed.suggestions.cancelledByUser.0'),
        t('checkout.failed.suggestions.cancelledByUser.1')
      ],
    };

    if (reason && suggestions[reason]) {
      return suggestions[reason];
    }
    return [
      t('checkout.failed.suggestions.default.0'),
      t('checkout.failed.suggestions.default.1'),
      t('checkout.failed.suggestions.default.2')
    ];
  };

  const suggestions = getSuggestions(reason);

  // ✅ دالة إعادة المحاولة
  const handleRetry = () => {
    router.back();
  };

  // ✅ دالة عرض الطلب
  const handleViewOrder = () => {
    if (orderNumber) {
      router.push(`/account/orders?order=${orderNumber}`);
    } else {
      router.push('/account/orders');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center px-4 py-8">
      <div className="container-custom bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* الأيقونة */}
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 ${getBgColor(reason)} rounded-full flex items-center justify-center`}>
            {getIcon(reason)}
          </div>
        </div>

        {/* العنوان */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {reason === 'cancelled_by_user' 
            ? t('checkout.failed.titleCancelled') 
            : t('checkout.failed.titleFailed')}
        </h1>

        {/* رقم الطلب */}
        {orderNumber && (
          <p className="text-center text-gray-500 mb-2">
            {t('checkout.failed.orderNumber')}: <span className="font-bold text-[#23A6F0]">{orderNumber}</span>
          </p>
        )}

        {/* رسالة الخطأ */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm text-center">
            {getErrorMessage(reason)}
          </p>
        </div>

        {/* الاقتراحات */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            {t('checkout.failed.suggestionsTitle')}:
          </h3>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-[#23A6F0] font-bold text-lg leading-none mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* الأزرار */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            className="w-full bg-[#23A6F0] text-white py-3 rounded-xl font-medium hover:bg-[#23A6F0] transition flex items-center justify-center gap-2"
          >
            {/* <ArrowRight className="w-5 h-5" /> */}
            {t('checkout.failed.retryButton')}
          </button>

          <button
            onClick={handleViewOrder}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            {t('checkout.failed.viewOrdersButton')}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('checkout.failed.homeButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
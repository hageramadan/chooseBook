"use client";

import { CheckCircle, X, Package, Calendar, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderDetails?: {
    itemsCount: number;
    total: number;
    deliveryDate?: string;
    address?: string;
  };
}

export default function SuccessPopup({ 
  isOpen, 
  onClose, 
  orderNumber,
  orderDetails 
}: SuccessPopupProps) {
  const router = useRouter();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      {/* الخلفية المعتمة */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* البوب اب */}
        <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-300">
          {/* رأس البوب اب */}
          <div className="relative p-6 text-center border-b border-gray-100">
            <button
              onClick={onClose}
              className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-3">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800">{t('checkout.orderSuccess')}</h3>
            <p className="text-gray-500 text-sm mt-2">
              {t('checkout.thankYou')} <span className="font-semibold text-[#23A6F0]">{t('checkout.storeName')}</span>، 
              {t('checkout.orderPreparing')}
            </p>
          </div>

          {/* محتوى البوب اب */}
          <div className="p-6 space-y-4">
            {/* رقم الطلب */}
            <div className="bg-gray-50 rounded-[8px] p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{t('checkout.orderNumber')}</p>
              <p className="text-xl font-bold text-gray-800">{orderNumber}</p>
            </div>

            {/* تفاصيل إضافية - اختياري */}
            {orderDetails && (
              <div className="grid grid-cols-2 gap-3">
                {orderDetails.itemsCount && (
                  <div className="bg-gray-50 rounded-[8px] p-3 text-center">
                    <Package className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">{t('checkout.items')}</p>
                    <p className="text-sm font-semibold text-gray-800">{orderDetails.itemsCount}</p>
                  </div>
                )}
                {orderDetails.total && (
                  <div className="bg-gray-50 rounded-[8px] p-3 text-center">
                    <div className="w-4 h-4 text-gray-400 mx-auto mb-1">EGP</div>
                    <p className="text-xs text-gray-500">{t('checkout.total')}</p>
                    <p className="text-sm font-semibold text-gray-800">EGP{orderDetails.total.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* أزرار */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={() => {
                onClose();
                router.push("/");
              }}
              className="flex-1 bg-[#23A6F0] text-white py-3 rounded-[8px] font-medium hover:bg-[#23A6F0] transition shadow-sm"
            >
              {t('checkout.backToHome')}
            </button>
            <button
              onClick={() => {
                onClose();
                router.push("/account/orders");
              }}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-[8px] font-medium hover:bg-gray-50 transition"
            >
              {t('checkout.myOrders')}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-in {
          animation: fade-in 0.2s ease-out, zoom-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
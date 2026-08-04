// app/account/orders/checkout/success/CheckoutSuccessContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getHeaders } from "@/services/api";
import { useTranslation } from "@/hooks/useTranslation"; // ✅ استيراد hook الترجمة

const API_URL = 'https://alfareed.admin.t-carts.com/api';

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

export default function CheckoutSuccessContent() {
  
const { t, isClient } = useTranslation();
  // ✅ استخدام hook الترجمة
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
      if (!isClient) return;
    const handleSuccess = async () => {
      const orderNum = searchParams.get('order_number');
      
      if (!orderNum) {
        setError(t('checkout.success.errors.orderNumberMissing'));
        setLoading(false);
        return;
      }

      setOrderNumber(orderNum);

      try {
        // ✅ محاولة 1: جلب الطلب بواسطة رقم الطلب (إذا كان الـ API يدعم)
        let foundOrder = null;
        
        try {
          const response = await fetch(`${API_URL}/orders/${orderNum}`, {
            method: 'GET',
            headers: getHeaders(),
          });

          if (response.ok) {
            const data = await response.json();
            // ✅ التحقق من هيكل البيانات
            if (data.result === true && data.data) {
              // إذا كان data.data.order موجود
              if (data.data.order) {
                foundOrder = data.data.order;
              } 
              // إذا كان data.data هو الطلب نفسه
              else if (data.data.id) {
                foundOrder = data.data;
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Endpoint /orders/by-number not found, trying alternative...');
        }

        // ✅ محاولة 2: جلب الطلب باستخدام الـ API الرئيسي للطلبات
        if (!foundOrder) {
          try {
            const response = await fetch(`${API_URL}/orders`, {
              method: 'GET',
              headers: getHeaders(),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.result === true && data.data) {
                // ✅ التحقق من هيكل البيانات
                let orders = [];
                
                // إذا كان data.data مصفوفة
                if (Array.isArray(data.data)) {
                  orders = data.data;
                } 
                // إذا كان data.data.data مصفوفة (تقسيم الصفحات)
                else if (Array.isArray(data.data.data)) {
                  orders = data.data.data;
                }
                // إذا كان data.data.orders مصفوفة
                else if (Array.isArray(data.data.orders)) {
                  orders = data.data.orders;
                }
                // إذا كان data.data.order كائن واحد
                else if (data.data.order) {
                  orders = [data.data.order];
                }

                // البحث عن الطلب
                if (orders.length > 0) {
                  foundOrder = orders.find((order: any) => order.order_number === orderNum);
                }
              }
            }
          } catch (error) {
            console.error('❌ Error fetching orders list:', error);
          }
        }

        // ✅ إذا تم العثور على الطلب
        if (foundOrder) {
          setOrderId(foundOrder.id);
          
          toast.success(t('checkout.success.paymentSuccess'), {
            duration: 3000,
            position: 'top-center',
          });

          setTimeout(() => {
            router.push(`/account/orders/${foundOrder.id}`);
          }, 2000);
        } else {
          // ✅ إذا لم نجد الطلب، نذهب إلى قائمة الطلبات
          // toast.success(t('checkout.success.redirectingToOrders'), {
          //   duration: 3000,
          //   position: 'top-center',
          // });
          
          setTimeout(() => {
            router.push('/account/orders');
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Error processing payment:', error);
        setError(t('checkout.success.errors.processingError'));
        setLoading(false);
      }
    };

    handleSuccess();
  },[isClient, searchParams, router]);

  // ✅ عرض رسالة نجاح مع التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#2D93CA] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('checkout.success.confirmingPayment')}</h2>
          <p className="text-gray-500">{t('checkout.success.pleaseWait')}</p>
          {orderNumber && (
            <p className="text-gray-400 text-sm mt-4">
              {t('checkout.success.orderNumber')}: <span className="font-medium">{orderNumber}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ✅ حالة النجاح (عندما يتم العثور على الطلب)
  if (orderId && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('checkout.success.paymentSuccessTitle')}</h2>
          <p className="text-gray-500 mb-2">
            {t('checkout.success.orderNumber')}: <span className="font-bold text-[#2D93CA]">{orderNumber}</span>
          </p>
          <p className="text-gray-400 text-sm mb-6">{t('checkout.success.redirectingToOrderDetails')}</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-[#2D93CA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ حالة الخطأ أو عدم العثور على الطلب
  return (
    <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {error || t('checkout.success.errors.orderNotFound')}
        </h2>
        {orderNumber && (
          <p className="text-gray-500 mb-2">
            {t('checkout.success.orderNumber')}: <span className="font-medium">{orderNumber}</span>
          </p>
        )}
        <p className="text-gray-400 text-sm mb-6">
          {t('checkout.success.redirectingToOrdersList')}
        </p>
        <button
          onClick={() => router.push('/account/orders')}
          className="bg-[#2D93CA] text-white px-6 py-2 rounded-lg hover:bg-[#349ad1] transition"
        >
          {t('checkout.success.viewOrdersButton')}
        </button>
      </div>
    </div>
  );
}
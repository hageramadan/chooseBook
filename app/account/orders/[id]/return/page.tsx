// app/account/orders/[id]/return/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Package, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IoCopyOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { getHeaders } from "@/services/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";

// ========== إعدادات API ==========
const API_URL = 'https://admin.ekhtarktabak.com/api';

// ========== أنواع البيانات ==========
interface OrderItem {
  id: number;
  title: string;
  name?: string;
  brand?: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  price?: number;
  total_price: number;
  originalPrice?: number;
  images: string[];
  image?: string;
  variant?: {
    id: number;
    sku: string | null;
    price: number;
    has_discount: boolean;
    discount_type: string | null;
    discount_value: string | null;
    price_after_discount: number;
    quantity: number;
    is_active: boolean;
    is_most_selling:boolean;
    variant_image: string;
    attributes: Array<{
      id: number;
      attribute_type: {
        id: number;
        name: string;
      };
      value: string;
      meta: {
        color?: string;
      } | null;
    }>;
  };
}

interface OrderDetails {
  id: number;
  order_number: string;
  orderNumber?: string;
  date: string;
  created_at?: string;
  status: string;
  status_label?: string;
  total_amount: number;
  items: OrderItem[];
}

// ========== خيارات طريقة استرداد المبلغ ==========
const getRefundMethods = (t: any) => [
  { 
    id: "wallet", 
    name: t('returns.refundWallet'), 
    description: t('returns.refundWalletDesc')
  },
];

// ========== دوال استخراج الخصائص ==========

// جلب الذاكرة (RAM)
const getMemory = (item: OrderItem): string | null => {
  if (!item.variant?.attributes) return null;
  const memoryAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "الذاكرة"
  );
  return memoryAttr?.value || null;
};

// جلب الهارد ديسك (Storage)
const getStorage = (item: OrderItem): string | null => {
  if (!item.variant?.attributes) return null;
  const storageAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "هارد ديسك"
  );
  return storageAttr?.value || null;
};

// جلب اللون
const getColor = (item: OrderItem): { name: string; hex: string | null } | null => {
  if (!item.variant?.attributes) return null;
  const colorAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "اللون" || attr.attribute_type.name === "لون"
  );
  if (!colorAttr) return null;
  
  return {
    name: colorAttr.value,
    hex: colorAttr.meta?.color || null,
  };
};

// ========== دالة جلب تفاصيل الطلب ==========
const fetchOrderDetails = async (orderId: string, locale: string = "ar-EG"): Promise<OrderDetails | null> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    
    if (data.result === true || data.data || data.data.order) {
      const order = data.data.order;
      return {
        id: order.id,
        order_number: order.order_number,
        orderNumber: order.order_number,
        date: new Date(order.created_at).toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        created_at: order.created_at,
        status: order.status_label,
        total_amount: order.total_amount,
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          name: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          price: item.unit_price,
          total_price: item.total_price,
          images: item.images || [],
          image: item.images && item.images[0] ? cleanImageUrl(item.images[0]) : "/images/placeholder-product.png",
          variant: item.variant || null,
        })),
      };
    }
    return null;
  } catch (error) {
    console.error("❌ Error fetching order details:", error);
    toast.error("حدث خطأ في جلب تفاصيل الطلب");
    return null;
  }
};

// ========== دالة تقديم طلب إرجاع ==========
const submitReturnRequest = async (
  orderId: number,
  refundMethod: string,
  notes: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const response = await fetch(`${API_URL}/returns`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        refund_method: refundMethod,
        notes: notes || null,
      }),
    });
    
    const data = await response.json();
   
    
    if (data.result === true && data.errNum === 200) {
      return { 
        success: true, 
        message: data.message || "تم تقديم طلب الإرجاع بنجاح",
        data: data.data
      };
    } else {
      return { 
        success: false, 
        message: data.message || "حدث خطأ أثناء تقديم طلب الإرجاع" 
      };
    }
  } catch (error) {
    console.error("❌ Error submitting return request:", error);
    return { 
      success: false, 
      message: "حدث خطأ في الاتصال بالخادم" 
    };
  }
};

// ========== تنظيف رابط الصورة ==========
const cleanImageUrl = (url: string): string => {
  if (!url) return "/images/placeholder-product.png";
  if (url.startsWith("/storage")) {
    return `https://admin.ekhtarktabak.com${url}`;
  }
  return url;
};

// ========== تنسيق التاريخ ==========
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // استخراج السنة والشهر واليوم فقط
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
};

export default function ReturnRequestPage() {
  const { t } = useTranslation();
   const { currency, isLoading: currencyLoading } = useCurrency(); 
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
const currencySymbol = currencyLoading ? '...' : (currency || 'EGP');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  //  الحصول على خيارات استرداد المبلغ مع الترجمة
  const refundMethods = getRefundMethods(t);

  // جلب تفاصيل الطلب عند تحميل الصفحة
  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      const locale = t('locale') || 'ar-EG';
      const orderData = await fetchOrderDetails(orderId, locale);
      setOrder(orderData);
      setLoading(false);
    };
    
    if (orderId) {
      loadOrder();
    }
  }, [orderId, t]);

  // دالة تقديم طلب الإرجاع
  const handleSubmit = async () => {
    // التحقق من اختيار طريقة استرداد المبلغ
    if (!refundMethod) {
      toast.error(t('returns.selectRefundMethod'), {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    if (!order) return;

    setIsSubmitting(true);
    
    const result = await submitReturnRequest(order.id, refundMethod, notes);
    
    if (result.success) {
      setShowSuccess(true);
      
      // toast.success(result.message, {
      //   duration: 4000,
      //   position: "top-center",
      //   icon: "",
      // });
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
    }
    
    setIsSubmitting(false);
  };

  // إغلاق رسالة النجاح والعودة للطلبات
  const handleCloseSuccess = () => {
    setShowSuccess(false);
    router.push("/account/orders");
  };

  // نسخ رقم الطلب
  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.order_number);
      toast.success(t('orders.copySuccess'), {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-4">{t('returns.loadingOrder')}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto px-4 py-8 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {t('orders.orderNotFound')}
          </h2>
          <p className="text-gray-500 mb-4">{t('orders.orderNotFoundDesc')}</p>
          <Link
            href="/account/orders"
            className="inline-block bg-main hover:bg-main-dark text-white px-6 py-2 rounded-lg"
          >
            {t('orders.backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
      <div className="container mx-auto mb-3 px-4 md:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/account" className="hover:text-primary transition">{t('account.myAccount')}</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/account/orders" className="hover:text-primary transition">{t('orders.title')}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary font-medium">{t('returns.returnRequest')}</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-right">
            {t('returns.returnRequest')}
          </h1>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            {/* رقم الطلب والتاريخ */}
            <div>
              <div className="flex items-center gap-3 text-xl text-[#180100] font-bold">
                <p>{t('orders.orderNumber')}</p>
                <div className="flex items-center gap-1">
                  <p>{order.order_number}</p>
                  <IoCopyOutline 
                    className="cursor-pointer hover:text-primary transition"
                    onClick={copyOrderNumber}
                  />
                </div>
              </div>
              <div>
                <p className="text-[#333333] text-lg my-3">{order.date}</p>
              </div>
            </div>

            {/* المنتجات مع عرض اللون والذاكرة والهارد ديسك */}
            <div>
              <p className="text-gray-600 mb-3">
                {t('orders.products')} ({order.items.length})
              </p>
              {order.items.map((item, idx) => {
                const productImage = item.image || (item.images && item.images[0] ? cleanImageUrl(item.images[0]) : "/images/placeholder-product.png");
                
                const memory = getMemory(item);
                const storage = getStorage(item);
                const color = getColor(item);
                
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 border border-gray-200 rounded-xl p-3 mb-3"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={productImage}
                        alt={item.title || item.name || "منتج"}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/placeholder-product.png";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">{item.title || item.name}</p>
                          
                          {/* عرض الخصائص */}
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {memory && (
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                <span className="font-medium">{t('orders.memory')}:</span>
                                <span>{memory}</span>
                              </span>
                            )}
                            
                            {storage && (
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                <span className="font-medium">{t('orders.storage')}:</span>
                                <span>{storage}</span>
                              </span>
                            )}
                            
                            {color && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                <span className="font-medium">{t('orders.color')}:</span>
                                <span>{color.name}</span>
                                {color.hex && (
                                  <span 
                                    className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                )}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600 mt-1">
                            {t('orders.quantity')}: x{item.quantity}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 md:text-base text-xs flex gap-1">
                            {(item.unit_price || item.price || 0).toFixed(2)} {currencySymbol}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ملاحظات */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6 space-y-6 my-4">
            <label className="block text-[#252525] text-lg md:text-2xl font-bold mb-2">
              {t('orders.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('checkout.notesPlaceholder')}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary resize-none"
              rows={3}
            />
          </div>

          {/* طريقة استرداد المبلغ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6 space-y-6 my-4">
            <label className="block text-[#252525] text-lg md:text-2xl font-bold mb-2 lg:mb-4">
              {t('returns.refundMethod')}
            </label>
            <div className="space-y-3">
              {refundMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                    refundMethod === method.id
                      ? "border-primary bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="refundMethod"
                    value={method.id}
                    checked={refundMethod === method.id}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* زر تأكيد الطلب */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !refundMethod}
            className={`w-full py-3 rounded-xl font-medium transition mt-4 ${
              isSubmitting || !refundMethod
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-main text-white hover:bg-main-dark"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('returns.submitting')}
              </div>
            ) : (
              t('returns.confirmReturn')
            )}
          </button>
        </div>
      </div>

      {/* نافذة النجاح */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('returns.returnSubmitted')}</h3>
            <p className="text-gray-500 mb-6">
              {t('returns.orderNumberLabel')}: <span className="font-bold text-primary">{order.order_number}</span>
              <br />
              {t('returns.returnProcessing')}
            </p>
            <button
              onClick={handleCloseSuccess}
              className="w-full bg-main text-white py-3 rounded-xl font-medium hover:bg-main-dark transition"
            >
              {t('orders.backToOrders')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
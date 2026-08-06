// app/account/returns/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  PackageCheck,
  XCircle,
  ChevronRight,
  DollarSign,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { GrMoney } from "react-icons/gr";
import Image from "next/image";
import Link from "next/link";
import { IoCopyOutline } from "react-icons/io5";
import { FaLocationDot } from "react-icons/fa6";
import toast from "react-hot-toast";
import { getHeaders } from "@/services/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter as useNextRouter } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";
// ========== تعريف الأنواع ==========
interface ReturnProductItem {
  id: number;
  product: {
    id: number;
    name: string;
    images: string[];
    pricing?: {
      final_price: number;
    };
  };
  title: string;
  variant_id: number | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  images: string[];
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

interface AdditionalData {
  name?: string;
  phone?: string;
  email?: string;
}

interface ReturnOrder {
  id: number;
  order_number: string;
  status: string;
  status_label: string;
  payment_method: string;
  payment_status: string;
  delivery_method: string;
  subtotal: number;
  coupon_discount_amount: number;
  total_discount_amount: number;
  subtotal_after_discount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  additional_data?: AdditionalData | null;
  items: ReturnProductItem[];
  created_at: string;
}

interface ReturnDetails {
  id: number;
  returnNumber: string;
  status: "pending" | "approved" | "picked_up" | "inspected" | "refunded" | "rejected" | "cancelled";
  status_label: string;
  refund_method: string;
  notes: string | null;
  order: ReturnOrder;
  created_at: string;
}

// ========== إعدادات API ==========
const API_URL = 'https://ekhtarktabak.t-carts.com/api';

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// صورة ثابتة للمنتجات التي لا تحتوي على صورة
const PLACEHOLDER_IMAGE = "/images/placeholder-product.png";

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

// ========== دالة جلب تفاصيل المرتجع ==========
const fetchReturnDetails = async (returnId: string, locale: string = "ar-EG"): Promise<ReturnDetails | null> => {
  try {
    const response = await fetch(`${API_URL}/returns/${returnId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
      throw new Error('UNAUTHORIZED');
    }
    
    const data = await response.json();
    
    if (data.result === true && data.data) {
      return transformReturnDetails(data.data, locale);
    }
    return null;
  } catch (error) {
    console.error("❌ Error fetching return details:", error);
    
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      toast.error("جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى", {
        duration: 3000,
        position: "top-center",
      });
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return null;
    }
    
    toast.error("حدث خطأ في جلب تفاصيل المرتجع");
    return null;
  }
};

// ========== تحويل بيانات المرتجع ==========
const transformReturnDetails = (apiReturn: any, locale: string = "ar-EG"): ReturnDetails => {
  return {
    id: apiReturn.id,
    returnNumber: `#R${String(apiReturn.id).padStart(5, '0')}`,
    status: apiReturn.status,
    status_label: apiReturn.status_label,
    refund_method: apiReturn.refund_method,
    notes: apiReturn.notes,
    order: {
      id: apiReturn.order.id,
      order_number: apiReturn.order.order_number,
      status: apiReturn.order.status,
      status_label: apiReturn.order.status_label,
      payment_method: apiReturn.order.payment_method,
      payment_status: apiReturn.order.payment_status,
      delivery_method: apiReturn.order.delivery_method,
      subtotal: apiReturn.order.subtotal,
      coupon_discount_amount: apiReturn.order.coupon_discount_amount,
      total_discount_amount: apiReturn.order.total_discount_amount,
      subtotal_after_discount: apiReturn.order.subtotal_after_discount,
      shipping_amount: apiReturn.order.shipping_amount,
      tax_amount: apiReturn.order.tax_amount,
      total_amount: apiReturn.order.total_amount,
      notes: apiReturn.order.notes,
      additional_data: apiReturn.order.additional_data,
      items: apiReturn.order.items || [],
      created_at: apiReturn.order.created_at,
    },
    created_at: apiReturn.created_at,
  };
};

// ========== تنظيف رابط الصورة ==========
const cleanImageUrl = (url: string): string => {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("/storage")) {
    return `https://ekhtarktabak.t-carts.com${url}`;
  }
  return url;
};

// ========== ترجمة طريقة استرداد المبلغ ==========
const translateRefundMethod = (method: string, t: any): string => {
  const methodMap: Record<string, string> = {
    "wallet": t('returns.wallet'),
    "bank": t('returns.bank'),
    "card": t('returns.card'),
  };
  return methodMap[method] || method;
};

// ========== الحصول على اسم المستخدم ==========
const getUserName = (order: ReturnOrder): string => {
  if (order.additional_data?.name) {
    return order.additional_data.name;
  }
  return " نفذ من المخزون";
};

// ========== دوال استخراج الخصائص ==========

// جلب الذاكرة
const getMemory = (item: ReturnProductItem): string | null => {
  if (!item.variant?.attributes) return null;
  const memoryAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "الذاكرة"
  );
  return memoryAttr?.value || null;
};

// جلب الهارد ديسك
const getStorage = (item: ReturnProductItem): string | null => {
  if (!item.variant?.attributes) return null;
  const storageAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "هارد ديسك"
  );
  return storageAttr?.value || null;
};

// جلب اللون
const getColor = (item: ReturnProductItem): { name: string; hex: string | null } | null => {
  if (!item.variant?.attributes) return null;
  const colorAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "لون"
  );
  if (!colorAttr) return null;
  
  return {
    name: colorAttr.value,
    hex: colorAttr.meta?.color || null,
  };
};

// ========== حالة المرتجع مع التنسيق ==========
const getReturnStatusConfig = (t: any) => ({
  pending: { label: t('returns.statusPending'), color: "status-return-pending", icon: Clock },
  approved: { label: t('returns.statusApproved'), color: "status-return-approved", icon: CheckCircle },
  picked_up: { label: t('returns.statusPickedUp'), color: "status-return-picked", icon: Truck },
  inspected: { label: t('returns.statusInspected'), color: "status-return-inspected", icon: PackageCheck },
  refunded: { label: t('returns.statusRefunded'), color: "status-return-refunded", icon: DollarSign },
  rejected: { label: t('returns.statusRejected'), color: "status-return-rejected", icon: XCircle },
  cancelled: { label: t('returns.statusCancelled'), color: "status-return-cancelled", icon: AlertCircle }
});

export default function ReturnDetailsPage() {
  const { t } = useTranslation();
   const { currency, isLoading: currencyLoading } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;
  const currencySymbol = currencyLoading ? '...' : (currency || 'EGP');
  const [returnData, setReturnData] = useState<ReturnDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnNotes, setReturnNotes] = useState("");
  const [copied, setCopied] = useState(false);

  // ========== تكوين الحالات مع الترجمة ==========
  const returnStatusConfig = getReturnStatusConfig(t);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error(t('orders.pleaseLogin'), {
        duration: 3000,
        position: "top-center",
      });
      router.push('/auth/login');
      return;
    }
    
    const loadReturnDetails = async () => {
      setLoading(true);
      // ✅ الحصول على اللغة الحالية
      const currentLocale = t('locale') || 'ar-EG';
      const data = await fetchReturnDetails(returnId, currentLocale);
      setReturnData(data);
      if (data?.notes) {
        setReturnNotes(data.notes);
      }
      setLoading(false);
    };
    
    if (returnId) {
      loadReturnDetails();
    }
  }, [returnId, router, t]);

  const copyReturnNumber = () => {
    if (returnData) {
      navigator.clipboard.writeText(returnData.returnNumber);
      setCopied(true);
      toast.success(t('returns.copied', { label: t('returns.returnNumber') }), {
        duration: 2000,
        position: "top-center",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyOrderNumber = () => {
    if (returnData) {
      navigator.clipboard.writeText(returnData.order.order_number);
      toast.success(t('returns.copied', { label: t('returns.orderNumber') }), {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#23A6F0] mx-auto"></div>
          <p className="text-gray-500 mt-4">{t('returns.loading')}</p>
        </div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto px-4 py-8 text-center">
          <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('orders.orderNotFound')}</h2>
          <p className="text-gray-500 mb-4">{t('orders.orderNotFoundDesc')}</p>
          <Link href="/account/returns" className="inline-block bg-[#23A6F0] text-white px-6 py-2 rounded-[8px] hover:bg-[#23A6F0] transition">
            {t('orders.backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  const status = returnStatusConfig[returnData.status] || returnStatusConfig.pending;
  const StatusIcon = status.icon;
  const totalRefund = returnData.order?.total_amount || 0;
  const itemsCount = returnData.order?.items?.length || 0;
  const userName = getUserName(returnData.order);

  // ✅ تنسيق التاريخ باللغة الحالية
  const formattedDate = formatDate(returnData.created_at);

  return (
    <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
      <div className="container mx-auto mb-3 px-4 md:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/account" className="hover:text-[#23A6F0] transition">{t('account.myAccount')}</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/account/returns" className="hover:text-[#23A6F0] transition">{t('returns.title')}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#23A6F0] font-medium">{t('orders.orderDetails')}</span>
        </div>
        
        <h1 className="text-[20px] font-bold mb-2 md:text-xl text-[#180100] md:mb-4">{t('orders.orderDetails')}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* العمود الأيمن */}
          <div className="lg:col-span-2 space-y-6">
            {/* معلومات المرتجع الأساسية */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex gap-2 sm:gap-4 items-center text-base sm:text-[20px] font-bold text-[#180100]">
                      <h1 className="text-sm sm:text-base">{t('returns.returnNumber')}</h1>
                      <div className="flex gap-1 sm:gap-2 items-center">
                        <p className="font-bold text-gray-800 text-sm sm:text-base">
                          {returnData.returnNumber}
                        </p>
                        <IoCopyOutline 
                          className={`w-4 h-4 sm:w-5 sm:h-5 cursor-pointer transition ${copied ? 'text-green-500' : 'hover:text-[#23A6F0]'}`}
                          onClick={copyReturnNumber}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-4 items-center text-sm sm:text-base text-gray-500">
                      <span className="hidden sm:inline">|</span>
                      <h1 className="text-xs sm:text-sm">{t('returns.order')}</h1>
                      <div className="flex gap-1 sm:gap-2 items-center">
                        <p className="text-gray-600 text-xs sm:text-sm">{returnData.order.order_number}</p>
                        <IoCopyOutline 
                          className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer hover:text-[#23A6F0] transition"
                          onClick={copyOrderNumber}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 sm:px-3 py-1 rounded-full sm:text-sm text-[10px] font-medium flex items-center gap-1 sm:gap-1.5 ${status.color}`}>
                    <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {status.label}
                  </div>
                </div>
                {/* ✅ التاريخ باللغة الحالية */}
                <p className="text-sm sm:text-[18px] text-[#333333]">{formattedDate}</p>
              </div>
            </div>
            
            <br />
            
            {/* المنتجات مع المقاس واللون */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t('returns.products')} ({itemsCount})</h2>
              <div className="space-y-4">
                {returnData.order.items.map((item, idx) => {
                  const variantImage = item.variant?.variant_image 
                    ? cleanImageUrl(item.variant.variant_image) 
                    : null;
                  
                  const productImage = item.images && item.images.length > 0 
                    ? cleanImageUrl(item.images[0]) 
                    : PLACEHOLDER_IMAGE;

                  const displayImage = variantImage || productImage;
                  
                  const memory = getMemory(item);
                  const storage = getStorage(item);
                  const color = getColor(item);
                  
                  return (
                    <div key={idx} className="flex flex-col md:flex-row items-center gap-4 border border-gray-200 rounded-[8px] p-3">
                      <div className="w-20 h-20 bg-gray-100 rounded-[8px] overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={displayImage}
                          alt={item.title}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      </div>
                      <div className="flex-1 md:text-right text-center">
                        <div className="flex flex-col md:flex-row gap-3 md:justify-between items-center md:items-start">
                          <div>
                            <p className="font-bold text-gray-800">{item.title}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {memory && (
                                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                  <span className="font-medium">{t('returns.memory')}:</span>
                                  <span>{memory}</span>
                                </span>
                              )}
                              
                              {storage && (
                                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                  <span className="font-medium">{t('returns.storage')}:</span>
                                  <span>{storage}</span>
                                </span>
                              )}
                              
                              {color && (
                                <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                  <span className="font-medium">{t('returns.color')}:</span>
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
                            
                            <div className="flex gap-1 md:gap-3 mt-2 text-xs text-black font-bold">
                              <span>{t('returns.quantity')}: <span className="text-gray-500">x{item.quantity}</span></span>
                              <span>{t('returns.price')}: <span className="text-gray-500">{currencySymbol} {item.unit_price.toFixed(2)}</span></span>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-[#23A6F0]">{currencySymbol} {item.total_price.toFixed(2)}</p>
                            {item.discount_amount > 0 && (
                              <p className="text-xs text-gray-400">{t('orders.discount')}: {item.discount_amount.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <br />
            
            {/* ملخص المرتجع */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t('orders.orderSummary')}</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('orders.subtotal')}</span>
                  <span className="font-bold text-gray-800">{currencySymbol} {returnData.order.subtotal.toFixed(2)}</span>
                </div>
                {returnData.order.coupon_discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('orders.couponDiscount')}</span>
                    <span className="font-bold text-[#23A6F0]">-{currencySymbol} {returnData.order.coupon_discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {returnData.order.total_discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('orders.totalDiscount')}</span>
                    <span className="font-bold text-[#23A6F0]">-{currencySymbol} {returnData.order.total_discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('orders.deliveryFee')}</span>
                  <span className="font-bold text-gray-800">{currencySymbol} {returnData.order.shipping_amount.toFixed(2)}</span>
                </div>
                {returnData.order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('orders.tax')}</span>
                    <span className="font-bold text-gray-800">{currencySymbol} {returnData.order.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t border-gray-200 mt-2">
                  <span className="text-lg font-bold text-gray-800">{t('returns.totalRefund')}</span>
                  <span className="text-xl font-bold text-[#23A6F0]">{currencySymbol} {totalRefund.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الأيسر */}
          <div className="space-y-6">
            {/* معلومات الاتصال */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">{t('orders.contactInfo')}</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold">{t('orders.fullName')}</span>
                  <span className="font-medium text-gray-600">{userName}</span>
                </div>
                {returnData.order.additional_data?.phone && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold">{t('orders.phone')}</span>
                    <span className="font-medium text-gray-600" dir="ltr">{returnData.order.additional_data.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <br />
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold mb-4">{t('orders.deliveryMethod')}</h2>
              <span className="font-medium text-gray-800">
                {returnData.order.delivery_method === "pickup" ? t('checkout.pickup') : t('checkout.delivery')}
              </span>
            </div>
            
            <br />
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold mb-4">{t('orders.paymentMethod')}</h2>
              <div className="flex items-center gap-3 p-2 border border-gray-300 rounded-[8px]">
                <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center shadow-sm">
                  <GrMoney />
                </div>
                <div>
                  <p className="text-gray-500">{returnData.order.payment_method}</p>
                  <p className="text-xs text-gray-400">{returnData.order.payment_status}</p>
                </div>
              </div>
            </div>
            
            <br />
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">{t('orders.notes')}</h2>
              <textarea
                value={returnNotes || t('orders.noNotes')}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-[8px] focus:outline-none focus:border-[#23A6F0] resize-none bg-gray-50"
                rows={3}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .status-return-pending {
          background-color: #A0AEC03D;
          color: #A0AEC0;
        }
        .status-return-approved {
          background-color: #48BB783D;
          color: #48BB78;
        }
        .status-return-picked {
          background-color: #4299E13D;
          color: #4299E1;
        }
        .status-return-inspected {
          background-color: #A0AEC03D;
          color: #A0AEC0;
        }
        .status-return-refunded {
          background-color: #48BB783D;
          color: #48BB78;
        }
        .status-return-rejected {
          background-color: #F565653D;
          color: #F56565;
        }
        .status-return-cancelled {
          background-color: #A0AEC03D;
          color: #A0AEC0;
        }
      `}</style>
    </div>
  );
}
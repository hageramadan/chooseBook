// app/account/returns/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Package, ChevronDown, ChevronUp, Truck, CheckCircle, Clock, PackageCheck, XCircle, RefreshCw, AlertCircle, DollarSign } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IoCopyOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import Pagination from '@/components/products/Pagination';
import { getHeaders } from "@/services/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";
// ========== إعدادات API ==========
const API_URL = 'https://alfareed.admin.t-carts.com/api';

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

//  متغيرات لمنع التكرار على مستوى الدالة
let isFetching = false;
let lastFetchTime = 0;

// ========== تعريف أنواع البيانات ==========

// منتج داخل المرتجع
interface ReturnProductItem {
  id: number;
  product_id?: number;
  name?: string;
  title?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  images?: string[];
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

// بيانات الطلب داخل المرتجع
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
  items: ReturnProductItem[];
  created_at: string;
}

// بيانات المرتجع الرئيسية
interface Return {
  id: number;
  returnNumber?: string;
  status: "pending" | "approved" | "picked_up" | "inspected" | "refunded" | "rejected" | "cancelled";
  status_label: string;
  refund_method: string;
  notes: string | null;
  order: ReturnOrder;
  created_at: string;
}

// الاستجابة من API مع Pagination
interface ReturnsResponse {
  result: boolean;
  errNum: number;
  message: string;
  data: {
    returns: Return[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
      next_page: string | null;
      previous_page: string | null;
    };
  };
}

// حالة المرتجع مع التنسيق العربي
const getReturnStatusConfig = (t: any) => ({
  pending: { label: t('returns.statusPending'), color: "status-return-pending", icon: Clock },
  refunded: { label: t('returns.statusRefunded'), color: "status-return-refunded", icon: DollarSign },
  rejected: { label: t('returns.statusRejected'), color: "status-return-rejected", icon: XCircle },
});

type FilterStatus = "all" | "pending" | "refunded" | "rejected";

// ========== دالة جلب المرتجعات من API مع Pagination ==========
const fetchReturns = async (page: number = 1, perPage: number = 10): Promise<{ returns: Return[], pagination: any }> => {
  //  منع التكرار في نفس الثانية
  const now = Date.now();
  if (isFetching || (now - lastFetchTime < 300)) {
   
    return {
      returns: [],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
        next_page: null,
        previous_page: null
      }
    };
  }
  
  isFetching = true;
  lastFetchTime = now;
  
  try {
  
    const response = await fetch(`${API_URL}/returns?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    const data: ReturnsResponse = await response.json();
   
    
    if (data.result === true && data.errNum === 200 && data.data.returns) {
      const returns = data.data.returns.map((returnItem) => ({
        ...returnItem,
        returnNumber: `#R${String(returnItem.id).padStart(5, '0')}`,
      }));
      
      
      
      return {
        returns: returns,
        pagination: data.data.pagination
      };
    }
    
    return {
      returns: [],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
        next_page: null,
        previous_page: null
      }
    };
  } catch (error) {
    console.error("❌ Error fetching returns:", error);
    toast.error("حدث خطأ في جلب بيانات المرتجعات");
    return {
      returns: [],
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
        next_page: null,
        previous_page: null
      }
    };
  } finally {
    isFetching = false;
  }
};

// ========== تنظيف رابط الصورة ==========
const cleanImageUrl = (url: string): string => {
  if (!url) return "/images/placeholder-product.png";
  if (url.startsWith("/storage")) {
    return `https://alfareed.admin.t-carts.com${url}`;
  }
  return url;
};

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

// ========== ترجمة حالة المرتجع من الإنجليزية إلى العربية ==========
const mapStatusToKey = (statusLabel: string): "pending" | "refunded" | "rejected" => {
   const normalizedLabel = statusLabel.toLowerCase();
  const statusMap: Record<string, "pending" | "refunded" | "rejected"> = {
    "pending": "pending",
    "refunded": "refunded",
    "rejected": "rejected",
    
    "قيد الانتظار": "pending",
    "تم رد المبلغ": "refunded",
    "مرفوض": "rejected",
  };
   if (statusMap[statusLabel]) {
    return statusMap[statusLabel];
  }
  
  return statusMap[normalizedLabel] || "pending";
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

export default function ReturnsPage() {
  const { t } = useTranslation();
  const { currency, isLoading: currencyLoading } = useCurrency();
  const router = useRouter();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReturnId, setExpandedReturnId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
    next_page: null,
    previous_page: null
  });
  const currencySymbol = currencyLoading ? '...' : (currency || 'EGP');
  //  استخدام ref لمنع التكرار
  const hasLoadedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const itemsPerPage = 10;

  // ========== تكوين الحالات مع الترجمة ==========
  const returnStatusConfig = getReturnStatusConfig(t);

  // ========== جلب المرتجعات ==========
  const loadReturns = useCallback(async (page: number = 1) => {
    //  إلغاء الطلب السابق
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const result = await fetchReturns(page, itemsPerPage);
      
      if (!abortControllerRef.current?.signal.aborted) {
     
        
        setReturns(result.returns);
        setPagination(result.pagination);
        hasLoadedRef.current = true;
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.error("❌ Error loading returns:", error);
        toast.error(t('returns.loadError'));
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [itemsPerPage, t]);

  // ========== تحميل الصفحة الأولى ==========
  useEffect(() => {
    if (!hasLoadedRef.current) {
     
      loadReturns(1);
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadReturns]);

  // ========== تغيير الصفحة ==========
  const handlePageChange = useCallback((newPage: number) => {
   
    if (newPage >= 1 && newPage <= pagination.last_page) {
      loadReturns(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination.last_page, loadReturns]);

  const toggleExpand = (returnId: number) => {
    setExpandedReturnId(expandedReturnId === returnId ? null : returnId);
  };

  // الانتقال إلى صفحة تفاصيل المرتجع
  const goToReturnDetails = (returnId: number) => {
    router.push(`/account/returns/${returnId}`);
  };

  // الانتقال إلى صفحة تفاصيل الطلب
  const handleOrderClick = (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/account/orders/${orderId}`);
  };

  // نسخ النص
  const copyToClipboard = (text: string, label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(t('returns.copied', { label }), {
      duration: 2000,
      position: "top-center",
    });
  };

  // ========== فلترة المرتجعات حسب الحالة (فلتر محلي) ==========
  const filteredReturns = useMemo(() => {
  
    
    if (filterStatus === "all") {
      return returns;
    }
    const filtered = returns.filter(returnItem => {
      const statusKey = mapStatusToKey(returnItem.status_label);
      return statusKey === filterStatus;
    });
   
    return filtered;
  }, [returns, filterStatus]);

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: "all", label: t('returns.filterAll') },
    { value: "pending", label: t('returns.filterPending') },
    { value: "refunded", label: t('returns.filterRefunded') },
    { value: "rejected", label: t('returns.filterRejected') }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#23A6F0] mx-auto"></div>
              
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-l min-h-screen from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6">
        {/* العنوان */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7 text-[#23A6F0]" />
          <h1 className="text-xl sm:text-xl font-bold text-gray-800">{t('returns.title')}</h1>
        </div>

        {/* فلتر الحالات */}
        <div className="flex flex-nowrap gap-2 mb-6 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:gap-3 md:gap-4">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
              
                setFilterStatus(filter.value);
              }}
              className={`whitespace-nowrap px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition ${
                filterStatus === filter.value
                  ? "bg-[#23A6F0] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* قائمة المرتجعات */}
        <div className="space-y-3 sm:space-y-4">
          {filteredReturns.length === 0 ? (
            <div className="mt-8 md:mt-12 rounded-2xl p-8 sm:p-12 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm sm:text-base">
                {returns.length === 0 ? t('returns.noReturns') : t('returns.noFilteredReturns')}
              </p>
            </div>
          ) : (
            filteredReturns.map((returnItem) => {
              const statusKey = mapStatusToKey(returnItem.status_label);
              const status = returnStatusConfig[statusKey] || returnStatusConfig.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedReturnId === returnItem.id;
              const itemsCount = returnItem.order?.items?.length || 0;
              const totalRefund = returnItem.order?.total_amount || 0;

              return (
                <div key={returnItem.id} className="bg-white rounded-[8px] sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* رأس المرتجع */}
                  <div 
                    className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleExpand(returnItem.id)}
                  >
                    <div className="flex flex-col gap-3">
                      {/* الصف الأول: رقم المرتجع ورقم الطلب والحالة */}
                      <div className="flex justify-between items-start">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              goToReturnDetails(returnItem.id);
                            }}
                            className="flex gap-2 sm:gap-4 items-center text-base sm:text-[20px] font-bold text-[#180100] cursor-pointer hover:opacity-70 transition"
                          >
                            <h1 className="text-sm sm:text-base">{t('returns.returnNumber')}</h1>
                            <div className="flex gap-1 sm:gap-2 items-center">
                              <p className="font-bold text-gray-800 text-sm sm:text-base">
                                #{String(returnItem.id).padStart(5, '0')}
                              </p>
                              <IoCopyOutline 
                                className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-[#23A6F0] transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(`#${String(returnItem.id).padStart(5, '0')}`, t('returns.returnNumber'));
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 sm:gap-4 items-center text-sm sm:text-base text-gray-500">
                            <span className="hidden sm:inline">|</span>
                            <h1 className="text-xs sm:text-sm">{t('returns.order')}</h1>
                            <div className="flex gap-1 sm:gap-2 items-center">
                              <p 
                                className="text-gray-600 text-xs sm:text-sm cursor-pointer hover:text-[#23A6F0] hover:underline transition"
                                onClick={(e) => handleOrderClick(returnItem.order?.id, e)}
                              >
                                {returnItem.order?.order_number || "-"}
                              </p>
                              <IoCopyOutline 
                                className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer hover:text-[#23A6F0] transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(returnItem.order?.order_number || "", t('returns.orderNumber'));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 ${status.color}`}>
                          <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {returnItem.status_label || status.label}
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* الصف الثاني: التاريخ */}
                      <p className="text-sm sm:text-[18px] text-[#333333]">{formatDate(returnItem.created_at)}</p>
                      
                      {/* الصف الثالث: عدد المنتجات والمبلغ المسترد */}
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex gap-2 items-center text-sm sm:text-base">
                          <p className="text-[#180100]">{t('returns.products')}</p>
                          <span className="text-gray-500">({itemsCount})</span>
                        </div>
                        {statusKey === "refunded" && totalRefund > 0 && (
                          <div className="flex gap-1 items-center text-sm font-semibold text-green-600">
                            <DollarSign className="w-4 h-4" />
                            <span>{t('returns.refundedAmount')} {currencySymbol} {totalRefund.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* تفاصيل المرتجع الموسعة */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50">
                      <div className="space-y-3 sm:space-y-4">
                        {returnItem.order?.items?.map((item, idx) => {
                          //  استخدام صورة المتغير أولاً إذا كانت موجودة
                          const variantImage = item.variant?.variant_image 
                            ? cleanImageUrl(item.variant.variant_image) 
                            : null;
                          
                          const productImage = item.images && item.images[0] 
                            ? cleanImageUrl(item.images[0]) 
                            : "/images/placeholder-product.png";

                          //  اختيار الصورة المناسبة (أولوية لصورة المتغير)
                          const displayImage = variantImage || productImage;
                          
                          // ========== استخدام الدوال الجديدة ==========
                          const memory = getMemory(item);
                          const storage = getStorage(item);
                          const color = getColor(item);
                          
                          return (
                            <div key={idx} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                              {/* صورة المنتج */}
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-[8px] overflow-hidden relative">
                                  <Image 
                                    src={displayImage} 
                                    alt={item.title || item.name || t('returns.product')} 
                                    width={80} 
                                    height={80} 
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/images/placeholder-product.png";
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {/* تفاصيل المنتج */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-gray-800 text-sm sm:text-base">
                                      {item.title || item.name || t('returns.product')}
                                    </p>
                                    
                                    {/* ========== عرض جميع الخصائص ========== */}
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                      {/* عرض الذاكرة */}
                                      {memory && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded-full text-gray-700 border border-gray-200">
                                          <span className="font-medium">{t('returns.memory')}:</span>
                                          <span>{memory}</span>
                                        </span>
                                      )}
                                      
                                      {/* عرض الهارد ديسك */}
                                      {storage && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded-full text-gray-700 border border-gray-200">
                                          <span className="font-medium">{t('returns.storage')}:</span>
                                          <span>{storage}</span>
                                        </span>
                                      )}
                                      
                                      {/* عرض اللون */}
                                      {color && (
                                        <span className="inline-flex items-center gap-1.5 text-xs bg-white px-2 py-0.5 rounded-full text-gray-700 border border-gray-200">
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
                                    
                                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-gray-500">
                                      <span>{t('returns.quantity')}: x{item.quantity}</span>
                                      <span>{t('returns.price')}: {currencySymbol} {(item.unit_price || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <p className="font-semibold text-[#000000] text-sm sm:text-base">
                                      {currencySymbol} {(item.total_price || item.unit_price * item.quantity || 0).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* إجمالي المبلغ المسترد والمعلومات الإضافية */}
                        <div className="pt-2 sm:pt-3 space-y-2">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="text-right">
                              <p className="text-xs sm:text-sm text-gray-500">{t('returns.totalRefund')}</p>
                              <p className="text-base sm:text-xl font-bold text-[#23A6F0]">EGP {totalRefund.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {returnItem.refund_method && statusKey === "refunded" && (
                            <div className="flex justify-end">
                              <p className="text-xs text-gray-500">
                                {t('returns.refundedVia')}: {translateRefundMethod(returnItem.refund_method, t)}
                              </p>
                            </div>
                          )}

                          {returnItem.notes && (
                            <div className="mt-3 p-3 bg-gray-100 rounded-[8px]">
                              <p className="text-xs text-gray-600">
                                <span className="font-bold">{t('returns.notes')}:</span> {returnItem.notes}
                              </p>
                            </div>
                          )}
                          
                          {/* زر عرض تفاصيل المرتجع */}
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => goToReturnDetails(returnItem.id)}
                              className="px-4 py-2 bg-[#23A6F0] text-white rounded-[8px] text-sm font-medium hover:bg-[#23A6F0] transition"
                            >
                              {t('returns.viewDetails')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/*  مكون Pagination */}
        {pagination.last_page > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            onPageChange={handlePageChange}
            total={pagination.total}
          />
        )}
      </div>

      {/* إضافة CSS للألوان */}
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
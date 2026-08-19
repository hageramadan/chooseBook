// app/account/orders/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle,
  Clock,
  PackageCheck,
  XCircle,
  AlertCircle,
  Box,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IoCopyOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';
import Pagination from '@/components/products/Pagination';
import { getHeaders } from "@/services/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";
// ========== تعريف الأنواع ==========
type OrderStatus = 
  | "ordered"
  | "processing"
  | "ready_for_receive"
  | "delivering"
  | "delivered"
  | "not_delivered"
  | "cancelled";

interface OrderItem {
  id: number;
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

interface OrderAddress {
  id: number;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  city: {
    id: number;
    name: string;
    delivery_fee: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  date: string;
  status: OrderStatus;
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
  address: OrderAddress | null;
  items: OrderItem[];
  created_at: string;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  next_page: number | null;
  previous_page: number | null;
}

// ========== إعدادات API ==========
const API_URL = "https://admin.ekhtarktabak.com/api";
const PLACEHOLDER_IMAGE = "/images/placeholder-product.png";

// ========== دوال التحويل ==========
const mapStatusToEnglish = (statusLabel: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    ordered: "ordered",
    processing: "processing",
    ready_for_receive: "ready_for_receive",
    delivering: "delivering",
    delivered: "delivered",
    not_delivered: "not_delivered",
    cancelled: "cancelled",
  };
  return statusMap[statusLabel] || "ordered";
};

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

const cleanImageUrl = (url: string): string => {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("/storage")) {
    return `https://admin.ekhtarktabak.com${url}`;
  }
  return url;
};

// ========== دوال جلب خصائص المنتج ==========
const getMemory = (item: OrderItem): string | null => {
  if (!item.variant?.attributes) return null;
  const memoryAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "الذاكرة"
  );
  return memoryAttr?.value || null;
};

const getStorage = (item: OrderItem): string | null => {
  if (!item.variant?.attributes) return null;
  const storageAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "هارد ديسك"
  );
  return storageAttr?.value || null;
};

const getColor = (item: OrderItem): { name: string; hex: string | null } | null => {
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

// ========== تحويل بيانات الطلب بشكل آمن ==========
const transformOrder = (apiOrder: any, locale: string = "ar-EG"): Order => {
  if (!apiOrder || !apiOrder.id) {
    console.warn("⚠️ Invalid order data:", apiOrder);
    return {
      id: 0,
      orderNumber: "N/A",
      date: "N/A",
      status: "ordered" as OrderStatus,
      status_label: "ordered",
      payment_method: "N/A",
      payment_status: "N/A",
      delivery_method: "N/A",
      subtotal: 0,
      coupon_discount_amount: 0,
      total_discount_amount: 0,
      subtotal_after_discount: 0,
      shipping_amount: 0,
      tax_amount: 0,
      total_amount: 0,
      notes: null,
      address: null,
      items: [],
      created_at: new Date().toISOString(),
    };
  }

  const englishStatus = mapStatusToEnglish(apiOrder.status_label || "ordered");

  return {
    id: apiOrder.id,
    orderNumber: apiOrder.order_number || `ORD-${apiOrder.id}`,
    date: formatDate(apiOrder.created_at),
    status: englishStatus,
    status_label: apiOrder.status_label || "ordered",
    payment_method: apiOrder.payment_method || "N/A",
    payment_status: apiOrder.payment_status || "N/A",
    delivery_method: apiOrder.delivery_method || "N/A",
    subtotal: apiOrder.subtotal || 0,
    coupon_discount_amount: apiOrder.coupon_discount_amount || 0,
    total_discount_amount: apiOrder.total_discount_amount || 0,
    subtotal_after_discount: apiOrder.subtotal_after_discount || 0,
    shipping_amount: apiOrder.shipping_amount || 0,
    tax_amount: apiOrder.tax_amount || 0,
    total_amount: apiOrder.total_amount || 0,
    notes: apiOrder.notes || null,
    address: apiOrder.address || null,
    items: apiOrder.items || [],
    created_at: apiOrder.created_at || new Date().toISOString(),
  };
};

// ========== دالة جلب الطلبات (تم إصلاحها) ==========
const fetchOrders = async (
  page: number = 1, 
  perPage: number = 10, 
  locale: string = "ar-EG",
  signal?: AbortSignal
): Promise<{ orders: Order[], pagination: PaginationData }> => {
  try {
    const response = await fetch(
      `${API_URL}/orders?page=${page}&per_page=${perPage}`,
      {
        method: "GET",
        headers: getHeaders(),
        signal, // إضافة signal لدعم إلغاء الطلب
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.result === true && data.data) {
      const orders = data.data.orders.map((order: any) => {
        try {
          return transformOrder(order, locale);
        } catch (error) {
          console.error(`❌ Error transforming order ${order.id}:`, error);
          return null;
        }
      }).filter(Boolean) as Order[];
      
      const pagination = data.data.pagination;
      
      return {
        orders: orders,
        pagination: pagination
      };
    }
    
    console.warn(`⚠️ No orders found for page ${page}`);
    return {
      orders: [],
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
    // التحقق إذا كان الخطأ بسبب إلغاء الطلب
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Fetch aborted');
      return {
        orders: [],
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
    
    console.error("❌ Error fetching orders:", error);
    throw error; // رمي الخطأ للتعامل معه في الأعلى
  }
};

// ========== تكوين حالات الطلب ==========
const getStatusConfig = (t: any) => ({
  ordered: { 
    label: t('orders.statusOrdered'), 
    color: "status-ordered", 
    icon: Clock 
  },
  processing: { 
    label: t('orders.statusProcessing'), 
    color: "status-processing", 
    icon: Box 
  },
  ready_for_receive: { 
    label: t('orders.statusReady'), 
    color: "status-ready", 
    icon: PackageCheck 
  },
  delivering: { 
    label: t('orders.statusDelivering'), 
    color: "status-delivering", 
    icon: Truck 
  },
  delivered: { 
    label: t('orders.statusDelivered'), 
    color: "status-delivered", 
    icon: CheckCircle 
  },
  not_delivered: { 
    label: t('orders.statusNotDelivered'), 
    color: "status-not-delivered", 
    icon: AlertCircle 
  },
  cancelled: { 
    label: t('orders.statusCancelled'), 
    color: "status-cancelled", 
    icon: XCircle 
  },
});

type FilterStatus = "all" | OrderStatus;

export default function OrdersPage() {
  const { t } = useTranslation();
  const { currency, isLoading: currencyLoading } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
   const currencySymbol = currencyLoading ? '...' : (currency || 'EGP');
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
    next_page: null,
    previous_page: null
  });
  const router = useRouter();
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const itemsPerPage = 10;

  // ========== تكوين الحالات مع الترجمة ==========
  const statusConfig = getStatusConfig(t);

  // ========== جلب الطلبات (تم إصلاحها) ==========
  const loadOrders = useCallback(async (page: number = 1) => {
    // إلغاء الطلب السابق إذا كان موجوداً
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // إنشاء AbortController جديد
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    
    try {
      const locale = t('locale') || 'ar-EG';
      const result = await fetchOrders(page, itemsPerPage, locale, controller.signal);
      
      // التحقق من عدم إلغاء الطلب قبل تحديث الـ state
      if (!controller.signal.aborted) {
        setOrders(result.orders);
        setPagination(result.pagination);
      }
    } catch (error) {
      // تجاهل أخطاء الإلغاء
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("❌ Error loading orders:", error);
        toast.error(t('orders.loadError'));
      }
    } finally {
      // التأكد من عدم تحديث الـ loading إذا تم إلغاء الطلب
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [itemsPerPage, t]);

  // ========== تحميل الصفحة الأولى عند التحميل ==========
  useEffect(() => {
    loadOrders(1);
    
    // تنظيف عند فك التركيب
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // تشغيل مرة واحدة فقط عند تحميل الصفحة

  // ========== إعادة التحميل عند تغيير اللغة ==========
  useEffect(() => {
    // إعادة تحميل الطلبات عند تغيير اللغة
    loadOrders(pagination.current_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]); // تشغيل عند تغيير دالة الترجمة

  // ========== تغيير الصفحة ==========
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      loadOrders(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination.last_page, loadOrders]);

  // ========== فلترة الطلبات ==========
  const filteredOrders = useMemo(() => {
    if (filterStatus === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === filterStatus);
  }, [orders, filterStatus]);

  const toggleExpand = useCallback((orderId: number) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  }, []);

  const copyOrderNumber = useCallback((orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    toast.success(t('orders.copySuccess'));
  }, [t]);

  const goToOrderDetails = useCallback((orderId: number) => {
    router.push(`/account/orders/${orderId}`);
  }, [router]);

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: "all", label: t('orders.filterAll') },
    { value: "ordered", label: t('orders.statusOrdered') },
    { value: "processing", label: t('orders.statusProcessing') },
    { value: "ready_for_receive", label: t('orders.statusReady') },
    { value: "delivering", label: t('orders.statusDelivering') },
    { value: "delivered", label: t('orders.statusDelivered') },
    { value: "not_delivered", label: t('orders.statusNotDelivered') },
    { value: "cancelled", label: t('orders.statusCancelled') },
  ];

  // ========== واجهة المستخدم ==========
  if (loading) {
    return (
      <div className="bg-gradient-to-l min-h-screen from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
          <Package className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          <h1 className="text-xl sm:text-xl font-bold text-gray-800">
            {t('orders.title')}
          </h1>
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
                  ? "bg-main text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* قائمة الطلبات */}
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center rounded-2xl mt-5">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-6">
                {orders.length === 0 && !loading ? t('orders.noOrders') : t('orders.noOrders')}
              </p>
              <Link
                href="/products"
                className="inline-block bg-main text-white px-8 py-3 rounded-xl font-semibold hover:bg-main-dark transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {t('orders.shopNow')}
              </Link>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.ordered;
              const StatusIcon = status.icon;
              const isExpanded = expandedOrderId === order.id;
              const itemsCount = order.items.length;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-[8px] sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* رأس الطلب */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              goToOrderDetails(order.id);
                            }}
                            className="flex gap-2 sm:gap-4 items-center text-base sm:text-[20px] font-bold text-[#180100] cursor-pointer hover:opacity-70 transition"
                          >
                            <h1 className="text-sm sm:text-base">{t('orders.orderNumber')}</h1>
                            <div className="flex gap-1 sm:gap-2 items-center">
                              <p className="font-bold text-gray-800 text-sm sm:text-base">
                                <span>
                                  {order.orderNumber.length > 10
                                    ? order.orderNumber.substring(0, 10) + "..."
                                    : order.orderNumber}
                                </span>
                              </p>
                              <IoCopyOutline
                                className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer hover:text-primary transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyOrderNumber(order.orderNumber);
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {status.label}
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      <p className="text-sm sm:text-[18px] text-[#333333]">
                        {order.date}
                      </p>

                      <div className="flex gap-2 items-center text-sm sm:text-base">
                        <p className="text-[#180100]">{t('orders.products')}</p>
                        <span className="text-gray-500">({itemsCount})</span>
                      </div>
                    </div>
                  </div>

                  {/* تفاصيل الطلب الموسعة */}
                  {isExpanded && order.items.length > 0 && (
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5">
                        {order.items.map((item, idx) => {
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
                            <div
                              key={idx}
                              className="flex gap-3 sm:gap-4 p-3 border rounded-[8px]"
                            >
                              <Link
                                href={`/account/orders/${order.id}`}
                                className="flex-shrink-0"
                              >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-[8px] overflow-hidden hover:opacity-80 transition cursor-pointer relative">
                                  <Image
                                    src={displayImage}
                                    alt={item.title}
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        PLACEHOLDER_IMAGE;
                                    }}
                                  />
                                </div>
                              </Link>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                  <div>
                                    <Link
                                      href={`/account/orders/${order.id}`}
                                      className="hover:underline"
                                    >
                                      <p className="font-medium text-gray-800 text-sm sm:text-base cursor-pointer hover:text-primary transition">
                                        {item.title}
                                      </p>
                                    </Link>
                                    
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                                      {memory && (
                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 rounded-full text-gray-700 border border-gray-200">
                                          <span className="font-medium">{t('orders.memory')}:</span>
                                          <span>{memory}</span>
                                        </span>
                                      )}
                                      
                                      {storage && (
                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 rounded-full text-gray-700 border border-gray-200">
                                          <span className="font-medium">{t('orders.storage')}:</span>
                                          <span>{storage}</span>
                                        </span>
                                      )}
                                      
                                      {color && (
                                        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 rounded-full text-gray-700 border border-gray-200">
                                          <span className="font-medium">{t('orders.color')}:</span>
                                          <span>{color.name}</span>
                                          {color.hex && (
                                            <span 
                                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-gray-300 inline-block"
                                              style={{ backgroundColor: color.hex }}
                                            />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-gray-500">
                                      <span>{t('orders.quantity')}: x{item.quantity}</span>
                                      <span>
                                        {t('orders.price')}: {currencySymbol} {item.unit_price.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <p className="font-semibold text-[#000000] text-sm sm:text-base">
                                      {currencySymbol} {item.total_price.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-2 sm:pt-3 flex justify-between items-center">
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="text-primary text-sm sm:text-base font-medium hover:underline"
                        >
                          {t('orders.viewDetails')}
                        </Link>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-gray-500">
                            {t('orders.total')}
                          </p>
                          <p className="text-base sm:text-xl font-bold text-primary">
                            <span className="text-xs md:text-base font-bold text-primary">
                              {currencySymbol}
                            </span>
                            {order.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            onPageChange={handlePageChange}
            total={pagination.total}
          />
        )}
      </div>

      <style jsx global>{`
        .status-ordered {
          background-color: #f181173D; color: #f18117; 
        }
        .status-processing {
          background-color: #ed89363d;
          color: #ed8936;
        }
        .status-ready {
          background-color: #A0AEC03d;
          color: #A0AEC0;
        }
        .status-delivering {
          background-color: #f6ad553d;
          color: #f6ad55;
        }
        .status-delivered {
          background-color: #48bb783d;
          color: #48bb78;
        }
        .status-not-delivered {
          background-color: #f565653d;
          color: #f56565;
        }
        .status-cancelled {
          background-color: #f565653d;
          color: #f56565;
        }
      `}</style>
    </div>
  );
}
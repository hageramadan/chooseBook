// app/account/orders/[id]/page.tsx

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
  RefreshCw,
  Star,
} from "lucide-react";
import { GrMoney } from "react-icons/gr";
import Image from "next/image";
import Link from "next/link";
import OrderTracker, { type OrderStatus } from "@/components/OrderTracker";
import { IoCopyOutline } from "react-icons/io5";
import { FaLocationDot } from "react-icons/fa6";
import toast from "react-hot-toast";
import { getHeaders } from "@/services/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";
import { ProductReviewModal } from "@/components/products/ProductReviewModal";
import { Product } from "@/types/product";

// ========== تعريف الأنواع ==========
interface OrderItem {
  id: number;
  title: string;
  product?: Product | null;
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

interface OrderAddress {
  id: number;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  type: string;
  type_label: string;
  latitude: string | null;
  longitude: string | null;
  city: {
    id: number;
    name: string;
    delivery_fee: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    image?: string;
  };
}

interface AdditionalData {
  name?: string;
  phone?: string;
  email?: string;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  status_label: string;
  return_status_label: string | null;
  payment_method: string;
  payment_status: string;
  delivery_method: "pickup" | "delivery";
  subtotal: number;
  coupon_discount_amount: number;
  total_discount_amount: number;
  subtotal_after_discount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  address: OrderAddress | null;
  additional_data?: AdditionalData | null;
  items: OrderItem[];
  created_at: string;
}

// ========== إعدادات API ==========
const API_URL = "https://admin.ekhtarktabak.com/api";

const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

// صورة ثابتة للمنتجات التي لا تحتوي على صورة
const PLACEHOLDER_IMAGE = "/images/placeholder-product.png";

// ========== دالة جلب تفاصيل الطلب ==========
const fetchOrderDetails = async (
  orderId: string,
  locale: string = "ar-EG",
): Promise<OrderDetails | null> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      }
      throw new Error("UNAUTHORIZED");
    }

    const data = await response.json();

    if (data.result === true || data.data || data.data.order) {
      return transformOrderDetails(data.data.order, locale);
    }
    return null;
  } catch (error) {
    console.error("❌ Error fetching order details:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      toast.error("جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى", {
        duration: 3000,
        position: "top-center",
      });
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      return null;
    }

    toast.error("حدث خطأ في جلب تفاصيل الطلب");
    return null;
  }
};

// ========== دالة إلغاء الطلب ==========
const cancelOrder = async (orderId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/orders/update/${orderId}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        _method: "put",
        status: "cancelled",
      }),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      }
      toast.error("جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى", {
        duration: 3000,
        position: "top-center",
      });
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
      return false;
    }

    const data = await response.json();

    if (data.result === true && data.errNum === 200) {
      toast.success("تم إلغاء الطلب بنجاح", {
        duration: 4000,
        position: "top-center",
        icon: "",
      });
      return true;
    } else {
      toast.error(data.message || "حدث خطأ أثناء إلغاء الطلب", {
        duration: 4000,
        position: "top-center",
      });
      return false;
    }
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    toast.error("حدث خطأ في الاتصال بالخادم", {
      duration: 4000,
      position: "top-center",
    });
    return false;
  }
};

// ========== تحويل حالة الطلب ==========
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

// ========== تحويل طريقة الدفع ==========
const mapPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    كاش: "الدفع عند الاستلام",
    أونلاين: "أونلاين",
    card: "بطاقة ائتمان",
    بطاقة: "بطاقة ائتمان",
    mada: "مدى",
    wallet: "محفظة",
  };
  return methodMap[method] || method;
};

// ========== تحويل طريقة التوصيل ==========
const mapDeliveryMethod = (method: string): "pickup" | "delivery" => {
  const methodMap: Record<string, "pickup" | "delivery"> = {
    توصيل: "delivery",
    استلام: "pickup",
    "استلام من الفرع": "pickup",
  };
  return methodMap[method] || "pickup";
};

// ========== تنسيق التاريخ ==========
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
};

// ========== تنظيف رابط الصورة ==========
const cleanImageUrl = (url: string): string => {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("/storage")) {
    return `https://admin.ekhtarktabak.com${url}`;
  }
  return url;
};

// ========== الحصول على اسم المستخدم ==========
const getUserName = (order: any): string => {
  if (order.address?.user?.name) {
    return order.address.user.name;
  }
  if (order.additional_data?.name) {
    return order.additional_data.name;
  }
  return "";
};

// ========== دوال استخراج الخصائص ==========

// جلب الذاكرة
const getMemory = (item: OrderItem): string | null => {
  if (!item.variant?.attributes) return null;
  const memoryAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "الذاكرة",
  );
  return memoryAttr?.value || null;
};

// جلب الهارد ديسك
const getStorage = (item: OrderItem): string | null => {
  if (!item.variant?.attributes) return null;
  const storageAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "هارد ديسك",
  );
  return storageAttr?.value || null;
};

// جلب اللون
const getColor = (
  item: OrderItem,
): { name: string; hex: string | null } | null => {
  if (!item.variant?.attributes) return null;
  const colorAttr = item.variant.attributes.find(
    (attr) => attr.attribute_type.name === "لون",
  );
  if (!colorAttr) return null;

  return {
    name: colorAttr.value,
    hex: colorAttr.meta?.color || null,
  };
};

// ========== تحويل بيانات الطلب ==========
const transformOrderDetails = (
  apiOrder: any,
  locale: string = "ar-EG",
): OrderDetails => {
  const englishStatus = mapStatusToEnglish(apiOrder.status_label);

  return {
    id: apiOrder.id,
    orderNumber: apiOrder.order_number || `#${apiOrder.id}`,
    date: formatDate(apiOrder.created_at),
    status: englishStatus,
    status_label: apiOrder.status_label,
    return_status_label: apiOrder.return_status_label || null,
    payment_method: mapPaymentMethod(apiOrder.payment_method),
    payment_status: apiOrder.payment_status,
    delivery_method: mapDeliveryMethod(apiOrder.delivery_method),
    subtotal: apiOrder.subtotal,
    coupon_discount_amount: apiOrder.coupon_discount_amount,
    total_discount_amount: apiOrder.total_discount_amount,
    subtotal_after_discount: apiOrder.subtotal_after_discount,
    shipping_amount: apiOrder.shipping_amount,
    tax_amount: apiOrder.tax_amount,
    total_amount: apiOrder.total_amount,
    notes: apiOrder.notes,
    address: apiOrder.address,
    additional_data: apiOrder.additional_data,
    items: apiOrder.items.map((item: any) => ({
      ...item,
      product_id: item.product?.id || item.id,
      product: item.product || null,
    })),
    created_at: apiOrder.created_at,
  };
};

// ========== حالة الطلب مع التنسيق ==========
const getStatusConfig = (t: any) => ({
  ordered: {
    label: t("orders.statusOrdered"),
    color: "status-pending",
    icon: Clock,
  },
  processing: {
    label: t("orders.statusProcessing"),
    color: "status-processing",
    icon: Package,
  },
  ready_for_receive: {
    label: t("orders.statusReady"),
    color: "status-ready",
    icon: PackageCheck,
  },
  delivering: {
    label: t("orders.statusDelivering"),
    color: "status-delivering",
    icon: Truck,
  },
  delivered: {
    label: t("orders.statusDelivered"),
    color: "status-delivered",
    icon: CheckCircle,
  },
  not_delivered: {
    label: t("orders.statusNotDelivered"),
    color: "status-cancelled",
    icon: XCircle,
  },
  cancelled: {
    label: t("orders.statusCancelled"),
    color: "status-cancelled",
    icon: XCircle,
  },
});

// ✅ دالة مساعدة للتحقق من حالة الدفع (تدعم العربية والإنجليزية)
const isPaymentPaid = (paymentStatus: string): boolean => {
  const paidStatuses = ["مدفوع", "Paid", "paid", "PAID"];
  return paidStatuses.includes(paymentStatus);
};

const isPaymentPending = (paymentStatus: string): boolean => {
  const pendingStatuses = ["قيد الانتظار", "Pending", "pending", "PENDING"];
  return pendingStatuses.includes(paymentStatus);
};

const isPaymentUnpaid = (paymentStatus: string): boolean => {
  const unpaidStatuses = [
    "غير مدفوع",
    "Unpaid",
    "unpaid",
    "UNPAID",
    "Not Paid",
    "not paid",
  ];
  return unpaidStatuses.includes(paymentStatus);
};

// ✅ دالة للحصول على نص الحالة المترجم
const getPaymentStatusLabel = (paymentStatus: string, t: any): string => {
  if (isPaymentPaid(paymentStatus)) {
    return t("orders.paymentPaid") || "مدفوع";
  }
  if (isPaymentPending(paymentStatus)) {
    return t("orders.paymentPending") || "قيد الانتظار";
  }
  if (isPaymentUnpaid(paymentStatus)) {
    return t("orders.paymentUnpaid") || "غير مدفوع";
  }
  return paymentStatus;
};

// ✅ دالة للحصول على لون حالة الدفع
const getPaymentStatusColor = (paymentStatus: string): string => {
  if (isPaymentPaid(paymentStatus)) {
    return "text-green-700";
  }
  if (isPaymentPending(paymentStatus)) {
    return "text-yellow-700";
  }
  if (isPaymentUnpaid(paymentStatus)) {
    return "text-red-700";
  }
  return "text-gray-700";
};

// ✅ دالة للحصول على أيقونة حالة الدفع
const getPaymentStatusIcon = (paymentStatus: string) => {
  if (isPaymentPaid(paymentStatus)) {
    return CheckCircle;
  }
  if (isPaymentPending(paymentStatus)) {
    return Clock;
  }
  if (isPaymentUnpaid(paymentStatus)) {
    return XCircle;
  }
  return XCircle;
};

// ✅ دالة للحصول على لون خلفية حالة الدفع
const getPaymentStatusBgColor = (paymentStatus: string): string => {
  if (isPaymentPaid(paymentStatus)) {
    return "bg-main-light";
  }
  if (isPaymentPending(paymentStatus)) {
    return "bg-yellow-50";
  }
  if (isPaymentUnpaid(paymentStatus)) {
    return "bg-red-50";
  }
  return "bg-gray-50";
};

// ✅ دالة للتحقق مما إذا كان يجب إظهار زر إعادة الدفع
const shouldShowRetryButton = (
  paymentStatus: string,
  paymentMethod: string,
): boolean => {
  const isUnpaid = isPaymentUnpaid(paymentStatus);
  const isCardPayment =
    paymentMethod === "بطاقة ائتمان" ||
    paymentMethod === "card" ||
    paymentMethod === "Card";
  return isUnpaid && isCardPayment;
};

export default function OrderDetailsPage() {
  const { t } = useTranslation();
  const { currency, isLoading: currencyLoading } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderNotes, setOrderNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    productId: number;
    productName: string;
  }>({ isOpen: false, productId: 0, productName: "" });
  const [ratedProducts, setRatedProducts] = useState<Set<number>>(new Set());
  const currencySymbol = currencyLoading ? "..." : currency || "EGP";
  const [showCancelModal, setShowCancelModal] = useState(false);

  // تكوين الحالات مع الترجمة
  const statusConfig = getStatusConfig(t);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error(t("orders.pleaseLogin"), {
        duration: 3000,
        position: "top-center",
      });
      router.push("/auth/login");
      return;
    }

    const loadOrderDetails = async () => {
      setLoading(true);
      const locale = t("locale") || "ar-EG";
      const data = await fetchOrderDetails(orderId, locale);
      setOrder(data);
      if (data?.notes) {
        setOrderNotes(data.notes);
      }

      // جلب تقييمات المنتجات المحفوظة
      if (data?.items) {
        const savedRatings = JSON.parse(
          localStorage.getItem("product_ratings") || "{}",
        );
        const ratedIds = new Set<number>();

        data.items.forEach((item) => {
          const productId =
            typeof item.product?.id === "number"
              ? item.product.id
              : typeof item.id === "number"
                ? item.id
                : Number(item.id) || 0;

          if (productId > 0 && savedRatings[productId]) {
            ratedIds.add(productId); // productId هو number الآن
          }
        });

        setRatedProducts(ratedIds);
      }

      setLoading(false);
    };

    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId, router, t]);

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success(t("orders.copySuccess"), {
        duration: 2000,
        position: "top-center",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReturnClick = () => {
    router.push(`/account/orders/${orderId}/return`);
  };

  // فتح وإغلاق مودال الإلغاء
  const openCancelModal = () => {
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
  };

  // دالة تأكيد إلغاء الطلب
  const confirmCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    closeCancelModal();

    const success = await cancelOrder(order.id);

    if (success) {
      setOrder({
        ...order,
        status: "cancelled",
        status_label: t("orders.statusCancelled"),
      });

      setTimeout(() => {
        router.push("/account/orders");
      }, 2000);
    }

    setIsCancelling(false);
  };

  // ✅ دالة إعادة محاولة الدفع - باستخدام الـ endpoint الجديد /repay
  const handleRetryPayment = async () => {
    if (!order) return;

    try {
      setIsRetryingPayment(true);

      const toastId = toast.loading(
        t("orders.preparingPayment") || "جاري تجهيز بوابة الدفع...",
        {
          position: "top-center",
        },
      );

      const response = await fetch(`${API_URL}/orders/${orderId}/repay`, {
        method: "POST",
        headers: getHeaders(),
      });

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        toast.error(
          t("orders.invalidSession") ||
            "جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى",
          {
            duration: 3000,
            position: "top-center",
          },
        );
        router.push("/auth/login");
        return;
      }

      const data = await response.json();
      toast.dismiss(toastId);

      if (data.data?.redirect_url) {
        window.location.href = data.data.redirect_url;
        console.log(
          "✅ Payment URL created at:",
          data.data.payment_url_created_at,
        );
      } else {
        toast.error(
          t("orders.paymentLinkError") ||
            "تعذر الحصول على رابط الدفع، يرجى المحاولة مرة أخرى",
          {
            duration: 4000,
            position: "top-center",
          },
        );
      }
    } catch (error) {
      console.error("❌ Error retrying payment:", error);
      toast.error(t("orders.serverError") || "حدث خطأ في الاتصال بالخادم", {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsRetryingPayment(false);
    }
  };

  // دالة فتح مودال التقييم
  const openReviewModal = (productId: number, productName: string) => {
    setReviewModal({
      isOpen: true,
      productId,
      productName,
    });
  };

  // دالة إغلاق مودال التقييم
  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      productId: 0,
      productName: "",
    });
  };

  // دالة عند إتمام التقييم
  const handleReviewSubmitted = (productId: number) => {
    // حفظ التقييم في localStorage
    const savedRatings = JSON.parse(
      localStorage.getItem("product_ratings") || "{}",
    );
    savedRatings[productId] = true;
    localStorage.setItem("product_ratings", JSON.stringify(savedRatings));

    // تحديث الحالة
    const newRatedProducts = new Set(ratedProducts);
    newRatedProducts.add(productId);
    setRatedProducts(newRatedProducts);

    toast.success(t("orders.ratingSaved") || "تم حفظ تقييمك للمنتج!", {
      duration: 3000,
      position: "top-center",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
            {t("orders.orderNotFound")}
          </h2>
          <p className="text-gray-500 mb-4">{t("orders.orderNotFoundDesc")}</p>
          <Link
            href="/account/orders"
            className="inline-block bg-main text-white px-6 py-2 rounded-[8px] hover:bg-main-dark transition"
          >
            {t("orders.backToOrders")}
          </Link>
        </div>
      </div>
    );
  }

  // اختيار الحالة المناسبة للعرض
  const isRefunded = order.return_status_label === "refunded";
  const isReturnPending = order.return_status_label === "pending";
  const isReturnRejected = order.return_status_label === "rejected";

  // تحديد الحالة المعروضة
  let displayStatus;
  if (isRefunded) {
    displayStatus = {
      label: t("orders.statusRefunded"),
      color: "status-refunded",
      icon: GrMoney,
    };
  } else if (isReturnPending) {
    displayStatus = {
      label: t("orders.statusReturnPending"),
      color: "status-return-pending",
      icon: Clock,
    };
  } else if (isReturnRejected) {
    displayStatus = {
      label: t("orders.statusReturnRejected"),
      color: "status-return-rejected",
      icon: XCircle,
    };
  } else {
    displayStatus = statusConfig[order.status];
  }

  const StatusIcon = displayStatus.icon;
  const userName = getUserName(order);

  // ✅ استخدام الدوال المساعدة للحصول على معلومات حالة الدفع
  const paymentStatusText = getPaymentStatusLabel(order.payment_status, t);
  const paymentStatusColor = getPaymentStatusColor(order.payment_status);
  const paymentStatusBg = getPaymentStatusBgColor(order.payment_status);
  const PaymentStatusIcon = getPaymentStatusIcon(order.payment_status);
  const showRetryButton = shouldShowRetryButton(
    order.payment_status,
    order.payment_method,
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto mb-3 px-4 md:px-8">
          <h1 className="text-[18px] font-bold mb-2 md:text-xl text-[#180100]">
            {t("orders.orderDetails")}
          </h1>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 md:mb-5">
            <Link href="/account" className="hover:text-primary transition">
              {t("account.myAccount")}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href="/account/orders"
              className="hover:text-primary transition"
            >
              {t("orders.title")}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary font-medium">
              {t("orders.orderDetails")}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* العمود الأيمن */}
            <div className="lg:col-span-2 space-y-6">
              {/* معلومات الطلب الأساسية */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <div className="flex gap-2 sm:gap-4 items-center text-base sm:text-[20px] font-bold text-[#180100]">
                        <h1 className="text-sm sm:text-base">
                          {t("orders.orderNumber")}
                        </h1>
                        <div className="flex gap-1 sm:gap-2 items-center">
                          <p className="font-bold text-gray-800 text-sm sm:text-base">
                            <span>
                              {order.orderNumber.length > 10
                                ? order.orderNumber.substring(0, 10) + "..."
                                : order.orderNumber}
                            </span>
                          </p>
                          <IoCopyOutline
                            className={`w-4 h-4 sm:w-5 sm:h-5 cursor-pointer transition ${copied ? "text-green-500" : "hover:text-primary"}`}
                            onClick={copyOrderNumber}
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-2 sm:px-3 py-1 rounded-full sm:text-sm text-[10px] font-medium flex items-center gap-1 sm:gap-1.5 ${displayStatus.color}`}
                    >
                      <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {displayStatus.label}
                    </div>
                  </div>
                  <p className="text-sm sm:text-[18px] text-[#333333]">
                    {order.date}
                  </p>
                </div>
              </div>

              <br />

              {/* المنتجات */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {t("orders.products")} ({order.items.length})
                </h2>
                <div className="space-y-4">
                  {order.items.map((item, idx) => {
                    const variantImage = item.variant?.variant_image
                      ? cleanImageUrl(item.variant.variant_image)
                      : null;

                    const productImage =
                      item.images && item.images.length > 0
                        ? cleanImageUrl(item.images[0])
                        : PLACEHOLDER_IMAGE;

                    const displayImage = variantImage || productImage;

                    const memory = getMemory(item);
                    const storage = getStorage(item);
                    const color = getColor(item);

                    // ✅ استخدام product_id الفعلي من product.id
                    const productId =
                      typeof item.product?.id === "number"
                        ? item.product.id
                        : typeof item.id === "number"
                          ? item.id
                          : Number(item.id) || 0;
                    const hasRated = ratedProducts.has(productId);

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1 border border-gray-200 rounded-[8px] p-3"
                      >
                        <div className="w-20 h-20 bg-gray-100 rounded-[8px] overflow-hidden flex-shrink-0 relative">
                          <Image
                            src={displayImage}
                            alt={item.title}
                            width={800}
                            height={800}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                PLACEHOLDER_IMAGE;
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row gap-3 md:justify-between">
                            <div>
                              <p className="font-bold text-gray-800">
                                {item.title}
                              </p>

                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {memory && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                    <span className="font-medium">
                                      {t("orders.memory")}:
                                    </span>
                                    <span>{memory}</span>
                                  </span>
                                )}

                                {storage && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                    <span className="font-medium">
                                      {t("orders.storage")}:
                                    </span>
                                    <span>{storage}</span>
                                  </span>
                                )}

                                {color && (
                                  <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                                    <span className="font-medium">
                                      {t("orders.color")}:
                                    </span>
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
                                <span>
                                  {t("orders.quantity")}:{" "}
                                  <span className="text-gray-500">
                                    x{item.quantity}
                                  </span>
                                </span>
                                <span>
                                  {t("orders.price")}:{" "}
                                  <span className="text-gray-500">
                                    {currencySymbol}{" "}
                                    {item.unit_price.toFixed(2)}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-primary">
                                {currencySymbol} {item.total_price.toFixed(2)}
                              </p>
                              {item.discount_amount > 0 && (
                                <p className="text-xs text-gray-400">
                                  {t("orders.discount")}:{" "}
                                  {item.discount_amount.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* ✅ زر تقييم المنتج - يظهر فقط إذا كان الطلب مسلم */}
                          {order.status === "delivered" &&
                            !isRefunded &&
                            !isReturnPending &&
                            !isReturnRejected &&
                           (
                              <div className="mt-2">
                                {hasRated ? (
                                  <div className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>
                                      {t("orders.productRated") ||
                                        "تم تقييم هذا المنتج"}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      openReviewModal(productId, item.title)
                                    }
                                    className="flex items-center gap-1 text-sm text-primary hover:text-[#a880a6] transition font-medium"
                                  >
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    {t("orders.rateProduct") || "تقييم المنتج"}
                                  </button>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isRefunded && !isReturnPending && !isReturnRejected && (
                  <div className="mt-6">
                    <OrderTracker
                      currentStatus={order.status}
                      deliveryMethod={order.delivery_method}
                    />
                  </div>
                )}
              </div>

              <br />

              {/* ملخص الطلب */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {t("orders.orderSummary")}
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("orders.subtotal")}
                    </span>
                    <span className="font-bold text-gray-800">
                      {currencySymbol} {order?.subtotal?.toFixed(2)}
                    </span>
                  </div>
                  {order.coupon_discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t("orders.couponDiscount")}
                      </span>
                      <span className="font-bold text-primary">
                        -{currencySymbol}{" "}
                        {order?.coupon_discount_amount?.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.total_discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t("orders.totalDiscount")}
                      </span>
                      <span className="font-bold text-primary">
                        -{currencySymbol}{" "}
                        {order?.total_discount_amount?.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("orders.deliveryFee")}
                    </span>
                    <span className="font-bold text-gray-800">
                      {currencySymbol} {order?.shipping_amount?.toFixed(2)}
                    </span>
                  </div>
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("orders.tax")}</span>
                      <span className="font-bold text-gray-800">
                        {currencySymbol} {order?.tax_amount?.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-t border-gray-200 mt-2">
                    <span className="text-lg font-bold text-gray-800">
                      {t("orders.total")}
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {currencySymbol} {order?.total_amount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* العمود الأيسر */}
            <div className="space-y-6">
              {order.additional_data != null && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-base font-bold text-gray-800 mb-4">
                    {t("orders.contactInfo")}
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">{t("orders.fullName")}</span>
                      <span className="font-medium text-gray-600">
                        {userName}
                      </span>
                    </div>
                    {order.additional_data?.phone && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold">{t("orders.phone")}</span>
                        <span className="font-medium text-gray-600" dir="ltr">
                          {order.additional_data?.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <br />

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold mb-4">
                  {t("orders.deliveryMethod")}
                </h2>
                <span className="font-medium text-gray-800">
                  {order.delivery_method === "pickup"
                    ? t("checkout.pickup")
                    : t("checkout.delivery")}
                </span>
                {order.address && (
                  <div className="flex items-center gap-2 border rounded-[8px] px-2 py-3 mt-3">
                    <FaLocationDot className="text-gray-500 flex-shrink-0" />
                    <p className="font-medium text-gray-400 text-sm">
                      {order.address.street}، {order.address.city?.name}
                    </p>
                  </div>
                )}
              </div>

              <br />

              {/* طريقة الدفع */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold mb-4">
                  {t("orders.paymentMethod")}
                </h2>
                <div className="flex items-center gap-3 p-2 border border-gray-300 rounded-[8px]">
                  <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center shadow-sm">
                    <GrMoney />
                  </div>
                  <div>
                    <p className="text-gray-500">{order.payment_method}</p>
                  </div>
                </div>
              </div>

              <br />

              {/* ✅ حالة الدفع - تدعم العربية والإنجليزية */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold mb-4">
                  {t("orders.paymentStatus") || "حالة الدفع"}
                </h2>
                <div
                  className={`flex items-center gap-3 p-3 border border-gray-300 rounded-[8px] ${paymentStatusBg}`}
                >
                  <div
                    className={`w-12 h-12 rounded-[8px] flex items-center justify-center shadow-sm flex-shrink-0 ${paymentStatusBg}`}
                  >
                    <PaymentStatusIcon
                      className={`w-5 h-5 ${paymentStatusColor}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${paymentStatusColor}`}>
                      {paymentStatusText}
                    </p>
                  </div>
                </div>

                {/* ✅ زر إعادة محاولة الدفع - يظهر فقط إذا كان الطلب غير مدفوع وطريقة الدفع بطاقة */}
                {showRetryButton && (
                  <button
                    onClick={handleRetryPayment}
                    disabled={isRetryingPayment}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-main text-white py-2.5 rounded-[8px] font-medium hover:bg-main-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRetryingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("orders.preparingPayment") || "جاري التجهيز..."}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        {t("orders.retryPayment") || "محاولة الدفع مجدداً"}
                      </>
                    )}
                  </button>
                )}
              </div>

              <br />

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4">
                  {t("orders.notes")}
                </h2>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={t("orders.noNotes")}
                  className="w-full p-3 border border-gray-200 rounded-[8px] focus:outline-none focus:border-primary resize-none bg-gray-50"
                  rows={3}
                  readOnly
                />
              </div>

              <div className="flex gap-3 mt-3 md:mt-6 mx-2">
                {!isRefunded &&
                  !isReturnPending &&
                  !isReturnRejected &&
                  order.status === "delivered" && (
                    <button
                      onClick={handleReturnClick}
                      className="flex-1 border-2 border-[#000000] text-[#000000] py-3 rounded-[8px] font-medium hover:bg-red-50 transition"
                    >
                      {t("orders.return")}
                    </button>
                  )}

                {!isRefunded &&
                  !isReturnPending &&
                  !isReturnRejected &&
                  order.status === "ordered" && (
                    <button
                      onClick={openCancelModal}
                      disabled={isCancelling}
                      className="flex-1 border-2 border-red-500 text-red-600 py-3 rounded-[8px] font-medium hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCancelling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          {t("orders.cancelling")}
                        </>
                      ) : (
                        t("orders.cancelOrder")
                      )}
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .status-pending {
            background-color: #f181173d;
            color: #f18117;
          }
          .status-processing {
            background-color: #ed89363d;
            color: #ed8936;
          }
          .status-ready {
            background-color: #a0aec03d;
            color: #a0aec0;
          }
          .status-delivering {
            background-color: #f6ad553d;
            color: #f6ad55;
          }
          .status-delivered {
            background-color: #48bb783d;
            color: #48bb78;
          }
          .status-cancelled {
            background-color: #f565653d;
            color: #f56565;
          }
          .status-refunded {
            background-color: #9f7aea3d;
            color: #9f7aea;
          }
          .status-return-pending {
            background-color: #f6ad553d;
            color: #f6ad55;
          }
          .status-return-rejected {
            background-color: #f565653d;
            color: #f56565;
          }
        `}</style>
      </div>

      {/* Modal تأكيد إلغاء الطلب */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
              {t("orders.confirmCancel")}
            </h3>
            <p className="text-center text-gray-600 text-sm mb-1">
              {t("orders.confirmCancelMessage")}
            </p>
            <p className="text-center text-red-500 font-bold text-sm mb-4">
              #{order?.orderNumber}
            </p>
            <p className="text-center text-gray-400 text-xs mb-6">
              {t("orders.cancelWarning")}
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeCancelModal}
                className="flex-1 py-2.5 rounded-[8px] border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                {t("orders.cancel")}
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={isCancelling}
                className="flex-1 py-2.5 rounded-[8px] bg-main text-white font-medium hover:bg-main-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("orders.cancelling")}
                  </>
                ) : (
                  t("orders.yesCancel")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ استخدام مكون ProductReviewModal المنفصل */}
      <ProductReviewModal
        isOpen={reviewModal.isOpen}
        onClose={closeReviewModal}
        productId={reviewModal.productId}
        productName={reviewModal.productName}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </>
  );
}

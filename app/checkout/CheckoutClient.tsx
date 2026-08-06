"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IoLockClosedOutline } from "react-icons/io5";
import { ChevronRight, CheckCircle, User, Mail, Phone, MapPin, Building, Home, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  CartItem,
  CheckoutFormData,
  CartSummary,
} from "@/components/checkout/types";
import { useCartContext } from "@/contexts/CartContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";
import toast from "react-hot-toast";

// استيراد المكونات
import ContactInfoForm from "@/components/checkout/ContactInfoForm";
import DeliveryMethodForm from "@/components/checkout/DeliveryMethodForm";
import DeliveryAddressForm from "@/components/checkout/DeliveryAddressForm";
import PaymentMethodForm from "@/components/checkout/PaymentMethodForm";
import NotesForm from "@/components/checkout/NotesForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import PhoneInput from "@/components/contact/PhoneInput";
import { getHeaders } from "@/services/api";

const API_URL = "https://admin.ekhtarktabak.com/api";

// دالة جلب السلة مع البارامترات (delivery_method و city_id)
const fetchCartWithParams = async (
  deliveryMethod: string,
  cityId?: string,
): Promise<any> => {
  try {
    const params = new URLSearchParams();

    if (deliveryMethod === "delivery") {
      params.append("delivery_method", "delivery");
    } else {
      params.append("delivery_method", "receive");
    }

    if (deliveryMethod === "delivery" && cityId) {
      params.append("city_id",  String(cityId));
    }

    const url = `${API_URL}/cart/preview?${params.toString()}`;
  

    const response = await fetch(url, {
      headers: getHeaders(),
    });

    const data = await response.json();


    if (data.result === true && data.data && data.data.cart) {
     
      return data.data.cart;
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching cart with params:", error);
    throw error;
  }
};

// دالة التحقق من رقم الهاتف حسب الدولة (مترجمة)
const validatePhoneNumberByCountry = (
  phoneNumber: string,
  countryCode: string,
  t: any,
): { isValid: boolean; error: string } => {
  const cleanNumber = phoneNumber.replace(/[\s\-]/g, "");

  if (!cleanNumber) {
    return { isValid: false, error: t('checkout.phoneRequired') };
  }

  if (!/^\d+$/.test(cleanNumber)) {
    return { isValid: false, error: t('checkout.phoneDigitsOnly') };
  }

  const rules: Record<
    string,
    {
      minLength: number;
      maxLength: number;
      startsWith: string[];
      pattern: RegExp;
      name: string;
    }
  > = {
    "+20": {
      name: t('checkout.egypt'),
      minLength: 11,
      maxLength: 11,
      startsWith: ["010", "011", "012", "015"],
      pattern: /^01[0125][0-9]{8}$/,
    },
    "+966": {
      name: t('checkout.saudi'),
      minLength: 9,
      maxLength: 10,
      startsWith: ["05"],
      pattern: /^05[0-9]{8}$/,
    },
    "+964": {
      name: t('checkout.iraq'),
      minLength: 11,
      maxLength: 11,
      startsWith: ["07"],
      pattern: /^07[0-9]{9}$/,
    },
    "+971": {
      name: t('checkout.uae'),
      minLength: 9,
      maxLength: 9,
      startsWith: ["05"],
      pattern: /^05[0-9]{8}$/,
    },
  };

  const rule = rules[countryCode];
  if (!rule) {
    return { isValid: false, error: t('checkout.invalidCountryCode') };
  }

  const startsWithValid = rule.startsWith.some((prefix) =>
    cleanNumber.startsWith(prefix),
  );
  if (!startsWithValid) {
    return {
      isValid: false,
      error: t('checkout.phoneStartsWithError', { 
        country: rule.name, 
        prefixes: rule.startsWith.join(" أو ") 
      }),
    };
  }

  if (!rule.pattern.test(cleanNumber)) {
    return {
      isValid: false,
      error: t('checkout.phoneInvalidForCountry', { country: rule.name }),
    };
  }

  return { isValid: true, error: "" };
};

// دالة إنشاء الطلب
const createOrder = async (orderData: any): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/orders/checkout`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error creating order:", error);
    throw error;
  }
};

// دالة الحصول على رسالة الخطأ حسب السبب (مترجمة)
const getErrorMessage = (reason: string | null, t: any): string => {
  const messages: Record<string, string> = {
    'payment_declined': t('checkout.paymentDeclined') || 'تم رفض الدفع من قبل البنك أو جهة الإصدار',
    'insufficient_funds': t('checkout.insufficientFunds') || 'الرصيد غير كافٍ لإتمام العملية',
    'card_expired': t('checkout.cardExpired') || 'البطاقة منتهية الصلاحية',
    'invalid_card': t('checkout.invalidCard') || 'بيانات البطاقة غير صحيحة',
    'technical_error': t('checkout.technicalError') || 'حدث خطأ تقني أثناء معالجة الدفع',
    'timeout': t('checkout.timeout') || 'انتهت مهلة الدفع، يرجى المحاولة مرة أخرى',
    'cancelled_by_user': t('checkout.cancelledByUser') || 'تم إلغاء الدفع من قبلك',
    'fraud_suspected': t('checkout.fraudSuspected') || 'تم رفض العملية للاشتباه في احتيال',
    'authentication_failed': t('checkout.authenticationFailed') || 'فشل التحقق من الهوية',
  };

  if (reason && messages[reason]) {
    return messages[reason];
  }
  return t('checkout.paymentError') || 'حدثت مشكلة أثناء معالجة الدفع. يرجى المحاولة مرة أخرى أو استخدام طريقة دفع أخرى.';
};

// تحويل بيانات السلة (مترجم)
const transformCartItems = (cart: any, t: any): CartItem[] => {
  if (!cart || !cart.items) return [];

  return cart.items.map((item: any) => {
    let color = "";
    let size = "";

    if (item.variant && item.variant.attributes) {
      for (const attr of item.variant.attributes) {
        const attrName = attr.attribute_type?.name;
        if (attrName === "اللون") {
          color = attr.value || "";
        } else if (attrName === "مقاس" || attrName === "المقاس") {
          size = attr.value || "";
        }
      }
    }

    let brandName = t('checkout.defaultBrand');
    if (item.product.brand) {
      if (typeof item.product.brand === "string") {
        brandName = item.product.brand;
      } else if (
        typeof item.product.brand === "object" &&
        item.product.brand.name
      ) {
        brandName = item.product.brand.name;
      }
    }

    const cleanImageUrl = (url: string) => {
      if (!url) return "/images/placeholder.jpg";
      if (url.startsWith("/storage")) {
        return `https://admin.ekhtarktabak.com${url}`;
      }
      return url;
    };

    return {
      id: item.id,
      name: item.product.name,
      brand: brandName,
      price: item.final_price,
      originalPrice: item.product.pricing?.has_discount
        ? item.product.pricing.price
        : undefined,
      image: cleanImageUrl(item.product.images?.[0] || ""),
      color: color,
      size: size,
      quantity: item.quantity,
      discount: item.discount_amount || undefined,
    };
  });
};

// نوع بيانات الطلب الناجح
interface CompletedOrderResult {
  orderNumber: string | number;
  itemsCount: number;
  total: number;
}

// واجهة بيانات إنشاء الحساب
interface AccountData {
  email: string;
  phone: string;
  name: string;
  password: string;
  password_confirmation: string;
}

export default function CheckoutClient() {
  const { t } = useTranslation();
  const {
    cart,
    isLoading: cartLoading,
    refetchCart,
    updateCart,
    clearAllItems,
    isGuest,
  } = useCartContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderResult, setOrderResult] = useState<CompletedOrderResult | null>(
    null,
  );
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  
  // ✅ إضافة state لحفظ قيمة paymentGateway (مثل الكود الأول)
  const [paymentGateway, setPaymentGateway] = useState<string | null>(null);
  
  const [showRedirectPopup, setShowRedirectPopup] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  const [createAccount, setCreateAccount] = useState(false);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountData, setAccountData] = useState<AccountData>({
    email: "",
    phone: "",
    name: "",
    password: "",
    password_confirmation: "",
  });
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});

  const selectedCityIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const lastDeliveryMethodRef = useRef<string | null>(null);
  const lastFetchedCityIdRef = useRef<string | null>(null);

  const cartItems = useMemo(() => transformCartItems(cart, t), [cart, t]);

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    phone: "",
    phoneNumber: "",
    phoneCountryCode: "+20",
    email: "",
    deliveryAddress: {
      street: "",
      city: "",
      governorate: "",
      buildingNo: "",
      floorNo: "",
      apartmentNo: "",
    },
    notes: "",
    deliveryMethod: "delivery",
    paymentMethod: "cash",
  });

  const cartSummary: CartSummary = useMemo(() => {
    const subtotal = cart?.subtotal || 0;
    const discount = cart?.discount_amount || 0;
    
    let deliveryFee;
    
    if (formData.deliveryMethod === "pickup") {
      deliveryFee = null;
    } else if (formData.deliveryMethod === "delivery") {
      if (!selectedCityId) {
        deliveryFee = undefined;
      } else {
        if (cart?.delivery_fee !== undefined && cart?.delivery_fee !== null) {
          deliveryFee = cart.delivery_fee;
        } else {
          deliveryFee = cart ? undefined : 0;
        }
      }
    } else {
      deliveryFee = undefined;
    }
    
    const total = cart?.total_amount || 0;

    return {
      subtotal,
      discount,
      deliveryFee,
      total,
    };
  }, [cart, formData.deliveryMethod, selectedCityId]);

  // التحقق من وجود order_number في URL (عند العودة من Paymob)
  useEffect(() => {
    const orderNumber = searchParams.get('order_number');
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');
    
    if (orderNumber) {
      if (status === 'success' || status === 'paid' || status === null) {
        toast.dismiss();
        toast.success(t('checkout.paymentSuccess'), {
          duration: 3000,
          position: 'top-center',
        });
        
        setTimeout(() => {
          router.push(`/account/orders?order=${orderNumber}`);
        }, 2000);
        
        setIsOrderCompleted(true);
        return;
      }
      
      if (status === 'failed') {
        toast.error(`❌ ${t('checkout.paymentFailed')}: ${getErrorMessage(reason, t)}`, {
          duration: 5000,
          position: 'top-center',
        });
        
        setTimeout(() => {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 3000);
        
        setIsOrderCompleted(true);
        return;
      }
    }
  }, [searchParams, router, t]);

  // التعديل المهم: لا تقم بإعادة التوجيه إلى الرئيسية عند فراغ السلة إذا كان الطلب قد تم بنجاح
  useEffect(() => {
    const orderNumber = searchParams.get('order_number');
    if (orderNumber) {
      setIsOrderCompleted(true);
      return;
    }

    if (isOrderCompleted) return;

    if (!cartLoading && (!cart || cart.items?.length === 0)) {
      router.replace("/");
    }
  }, [cart, cartLoading, router, isOrderCompleted, searchParams]);
  
  // استدعاء الـ API عند تغيير طريقة التوصيل أو المدينة (محسّن)
  useEffect(() => {
    if (isOrderCompleted) return;
    if (!cart || cart.items?.length === 0) return;
    
    if (isFetchingRef.current) return;

    const currentDeliveryMethod = formData.deliveryMethod;
    const currentCityId = selectedCityIdRef.current;

    const deliveryMethodChanged = lastDeliveryMethodRef.current !== currentDeliveryMethod;
    const cityIdChanged = lastFetchedCityIdRef.current !== currentCityId;

    if (!deliveryMethodChanged && !cityIdChanged) {
     
      return;
    }

    lastDeliveryMethodRef.current = currentDeliveryMethod;
    lastFetchedCityIdRef.current = currentCityId;



    const fetchCart = async () => {
      try {
        isFetchingRef.current = true;
        
        if (currentDeliveryMethod === "delivery" && currentCityId) {
       
          const cartData = await fetchCartWithParams("delivery", currentCityId);
          if (cartData) {
            updateCart(cartData);
          }
        } 
        else if (currentDeliveryMethod === "pickup") {
         
          const cartData = await fetchCartWithParams("pickup");
          if (cartData) {
            updateCart(cartData);
          }
        } 
        else if (currentDeliveryMethod === "delivery" && !currentCityId) {
        
          const cartData = await fetchCartWithParams("delivery");
          if (cartData) {
            updateCart(cartData);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching cart:", error);
      } finally {
        isFetchingRef.current = false;
      }
    };

    const timeoutId = setTimeout(fetchCart, 300);
    
    return () => {
      clearTimeout(timeoutId);
      isFetchingRef.current = false;
    };
  }, [formData.deliveryMethod, selectedCityId, isOrderCompleted, cart, updateCart]);

  const handleFormChange = useCallback((data: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  // ✅ دالة لاستقبال paymentGateway من PaymentMethodForm (مثل الكود الأول)
  const handlePaymentGatewayChange = useCallback((gateway: string | null) => {
    setPaymentGateway(gateway);
  }, []);

  // دالة لاستقبال address_id بعد حفظ العنوان
  const handleAddressSaved = useCallback(
    async (address: any) => {
      if (isFetchingRef.current) return;

      if (address && address.id) {
        setSelectedAddressId(address.id);
        toast.success(t('checkout.addressSaved'));

        try {
          let cityId = selectedCityIdRef.current;

          if (!cityId) {
            cityId = selectedCityId;
          }

          if (!cityId) {
            cityId = address.city?.id || address.city_id;
          }

          if (cityId && formData.deliveryMethod === "delivery") {
            isFetchingRef.current = true;
            const cartData = await fetchCartWithParams(
              "delivery",
              String(cityId),
            );
            if (cartData) {
              updateCart(cartData);
            }
          }
        } catch (error) {
          console.error("❌ Error updating cart after address save:", error);
        } finally {
          isFetchingRef.current = false;
        }
      }
    },
    [selectedCityId, formData.deliveryMethod, updateCart, t],
  );

  // دالة لاستقبال address_id من عنوان محفوظ تم اختياره
  const handleAddressSelected = useCallback(
    async (addressId: number) => {
      if (isFetchingRef.current) return;
      
      setSelectedAddressId(addressId);

      try {
        const cityId = selectedCityIdRef.current;

        if (cityId && formData.deliveryMethod === "delivery") {
          isFetchingRef.current = true;
          const cartData = await fetchCartWithParams(
            "delivery",
            String(cityId),
          );
          if (cartData) {
            updateCart(cartData);
          }
        }
      } catch (error) {
        console.error("❌ Error updating cart after address selection:", error);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [formData.deliveryMethod, updateCart],
  );

  const handleCitySelected = useCallback((cityId: string) => {
   
    selectedCityIdRef.current = cityId;
    setSelectedCityId(cityId);
  }, []);

  // دالة فتح Popup إنشاء الحساب
  const handleOpenAccountPopup = useCallback(() => {
    setAccountData((prev) => ({
      ...prev,
      name: formData.fullName || "",
      phone: formData.phone || "",
      email: formData.email || "",
    }));
    setAccountErrors({});
    setShowAccountPopup(true);
  }, [formData.fullName, formData.phone, formData.email]);

  // دالة إغلاق Popup إنشاء الحساب
  const handleCloseAccountPopup = useCallback(() => {
    setShowAccountPopup(false);
    setCreateAccount(false);
    setAccountErrors({});
  }, []);

  // دالة التحقق من بيانات الحساب (مترجمة)
  const validateAccountData = (): boolean => {
    const errors: Record<string, string> = {};

    if (!accountData.email.trim()) {
      errors.email = t('checkout.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) {
      errors.email = t('checkout.emailInvalid');
    }

    if (!accountData.phone.trim()) {
      errors.phone = t('checkout.phoneRequired');
    } else {
      const phoneValidation = validatePhoneNumberByCountry(
        accountData.phone.replace(/[\s\-]/g, ""),
        "+20",
        t,
      );
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error;
      }
    }

    if (!accountData.name.trim()) {
      errors.name = t('checkout.nameRequired');
    } else if (accountData.name.trim().length < 3) {
      errors.name = t('checkout.nameMinLength');
    }

    if (!accountData.password) {
      errors.password = t('checkout.passwordRequired');
    } else if (accountData.password.length < 8) {
      errors.password = t('checkout.passwordMinLength');
    }

    if (!accountData.password_confirmation) {
      errors.password_confirmation = t('checkout.passwordConfirmationRequired');
    } else if (accountData.password !== accountData.password_confirmation) {
      errors.password_confirmation = t('checkout.passwordMismatch');
    }

    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // دالة تأكيد إنشاء الحساب
  const handleConfirmAccount = useCallback(() => {
    if (validateAccountData()) {
      setCreateAccount(true);
      setShowAccountPopup(false);
      toast.success(t('checkout.accountCreated'));
    }
  }, [accountData, t]);

  // دالة التحقق من صحة البيانات قبل الإرسال (مترجمة)
  const validateForm = useCallback(() => {
    if (!formData.fullName.trim()) {
      toast.error(t('checkout.fullNameRequired'));
      return false;
    }

    if (isGuest && formData.paymentMethod !== "cash") {
      if (!formData.email || !formData.email.trim()) {
        toast.error(t('checkout.emailRequired'));
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error(t('checkout.emailInvalid'));
        return false;
      }
    }

    const phoneValidation = validatePhoneNumberByCountry(
      formData.phoneNumber || formData.phone.replace(formData.phoneCountryCode || "", ""),
      formData.phoneCountryCode || "+20",
      t,
    );

    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error);
      return false;
    }

    if (formData.deliveryMethod === "delivery" && !selectedAddressId && isGuest) {
      const address = formData.deliveryAddress;
      if (!address.street || !address.city) {
        toast.error(t('checkout.addressRequired'));
        return false;
      }
    }

    if (formData.deliveryMethod === "delivery" && !selectedAddressId && !isGuest) {
      toast.error(t('checkout.saveAddressFirst'));
      return false;
    }

    return true;
  }, [formData, isGuest, selectedAddressId, t]);

  // ✅ تحضير بيانات الطلب (معدل لاستخدام paymentGateway مثل الكود الأول)
  const prepareOrderData = useCallback(() => {
    const paymentMethodMap: Record<string, string> = {
      cash: "cash",
      card: "card",
      mada: "online",
      wallet: "online",
    };

    const deliveryMethodMap: Record<string, string> = {
      delivery: "delivery",
      pickup: "receive",
    };

    const orderData: any = {
      payment_method: paymentMethodMap[formData.paymentMethod] || "cash",
      delivery_method: deliveryMethodMap[formData.deliveryMethod] || "delivery",
      notes: formData.notes || "",
      create_account: createAccount,
    };

    // ✅ إضافة payment_gateway حسب طريقة الدفع (مثل الكود الأول)
    if (formData.paymentMethod === "wallet") {
      orderData.payment_gateway = "wallet";
    }
    if (formData.paymentMethod === "card") {
      orderData.payment_gateway = "paymob";
    }

    // ✅ إذا تم اختيار بوابة دفع معينة من الـ state (مثل الكود الأول)
    if (paymentGateway) {
      orderData.payment_gateway = paymentGateway;
    }

    if (createAccount && isGuest) {
      orderData.account = {
        email: accountData.email,
        phone: accountData.phone,
        name: accountData.name,
        password: accountData.password,
        password_confirmation: accountData.password_confirmation,
      };
    }

    if (isGuest) {
      const guestEmail = formData.email || accountData.email || "";
      
      const additionalData: any = {
        name: formData.fullName,
        phone: formData.phone,
        email: guestEmail,
        street: formData.deliveryAddress.street || "N/A",
        building: formData.deliveryAddress.buildingNo || "N/A",
        floor: formData.deliveryAddress.floorNo || "N/A",
        apartment: formData.deliveryAddress.apartmentNo || "N/A",
      };

      if (formData.deliveryMethod === "delivery") {
        const cityId = selectedCityIdRef.current || "1";
        additionalData.city_id = cityId;
      }

      orderData.additional_data = additionalData;
    }

    if (!isGuest && formData.deliveryMethod === "delivery") {
      if (selectedAddressId) {
        orderData.address_id = selectedAddressId;
      }
    }

   
    return orderData;
  }, [formData, selectedAddressId, createAccount, isGuest, accountData, paymentGateway]); // ✅ إضافة paymentGateway للـ dependencies

  // دالة إغلاق Popup التوجيه
  const closeRedirectPopup = useCallback(() => {
    setShowRedirectPopup(false);
    setRedirectUrl(null);
  }, []);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const paymentStarted = sessionStorage.getItem("payment_started");

      if (!paymentStarted) return;

      if (event.persisted) {
        sessionStorage.removeItem("payment_started");
        window.location.replace("/");
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  // إرسال الطلب (محدث مع Popup التوجيه)
  const handleSubmit = async () => {
    if (isSubmitting || isOrderCompleted) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const orderData = prepareOrderData();
      const response = await createOrder(orderData);

      if (response.result === true && response.data) {
        const orderNumber = response.data.order?.order_number;

        if (response.data.redirect_url) {
          sessionStorage.setItem("payment_started", "true");

          setRedirectUrl(response.data.redirect_url);
          setShowRedirectPopup(true);

          setTimeout(() => {
            setShowRedirectPopup(false);
            window.location.href = response.data.redirect_url;
          }, 3000);

          return;
        }

        const completedOrder: CompletedOrderResult = {
          orderNumber: orderNumber || 'N/A',
          itemsCount: cartItems.length,
          total: response.data.order.total_amount,
        };

        setOrderResult(completedOrder);
        setIsOrderCompleted(true);
        setShowSuccessPopup(true);

        clearAllItems().catch((err) => {
          console.error("❌ Error clearing cart after order success:", err);
        });
      } else {
        toast.error(response.message || t('checkout.orderCreationError'));
      }
    } catch (error) {
      console.error("❌ Error creating order:", error);
      toast.error(t('checkout.orderCreationError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePopup = useCallback(() => {
    setShowSuccessPopup(false);
    router.push("/");
  }, [router]);

  const handleGoToOrders = useCallback(() => {
    setShowSuccessPopup(false);
    router.push("/account/orders");
  }, [router]);

  const handleGoToHome = useCallback(() => {
    setShowSuccessPopup(false);
    router.push("/");
  }, [router]);

  const handlePhoneChange = useCallback((phoneNumber: string, countryCode: string) => {
    setFormData((prev) => ({
      ...prev,
      phone: phoneNumber,
      phoneNumber: phoneNumber,
      phoneCountryCode: countryCode,
    }));
  }, []);

  // عرض حالة الطلب المكتمل مع order_number في URL (مترجم)
  if (isOrderCompleted && searchParams.get('order_number')) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('checkout.paymentSuccess')}</h2>
          <p className="text-gray-500 mb-4">
            {t('checkout.orderNumber')}: <span className="font-bold text-[#23A6F0]">{searchParams.get('order_number')}</span>
          </p>
          <p className="text-gray-400 text-sm mb-6">{t('checkout.redirecting')}</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-[#23A6F0] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="" />
      </div>
    );
  }

  if (!isOrderCompleted && (!cart || cart.items?.length === 0)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{t('checkout.emptyCart')}</p>
        <Link
          href="/products"
          className="bg-[#23A6F0] hover:bg-[#23A6F0] text-white px-6 py-2 rounded-[8px]"
        >
          {t('checkout.shopNow')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-l min-h-[80vh] from-[#bdcbf12a] to-[#feecea3b]">
      <div className="container page-with-padding mx-auto mb-3">
        {/* Page Header - مترجم */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {t('checkout.checkoutTitle')}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/cart" className="hover:text-[#23A6F0] transition">
              {t('checkout.cart')}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#23A6F0] font-medium">{t('checkout.checkoutTitle')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info - مترجم */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('checkout.contactInfo')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('checkout.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleFormChange({ fullName: e.target.value })}
                    placeholder={t('checkout.fullNamePlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23A6F0] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('checkout.phone')} <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    value={`${formData.phoneCountryCode}${formData.phone}`}
                    onChange={handlePhoneChange}
                    required={true}
                  />
                </div>

                {isGuest && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('checkout.email')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleFormChange({ email: e.target.value })}
                      placeholder={t('checkout.emailPlaceholder')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23A6F0] transition"
                    />
                  </div>
                )}
              </div>
            </div>

            <DeliveryMethodForm
              deliveryMethod={formData.deliveryMethod}
              onDeliveryMethodChange={(method) =>
                handleFormChange({ deliveryMethod: method })
              }
            />

            {formData.deliveryMethod === "delivery" && (
              <DeliveryAddressForm
                show={true}
                addressData={formData.deliveryAddress}
                onAddressChange={(address) =>
                  handleFormChange({ deliveryAddress: address })
                }
                onAddressSaved={handleAddressSaved}
                onAddressSelected={handleAddressSelected}
                onCitySelected={handleCitySelected}
                isGuest={isGuest}
              />
            )}

            {/* ✅ تمرير onPaymentGatewayChange إلى PaymentMethodForm (مثل الكود الأول) */}
            <PaymentMethodForm
              paymentMethod={formData.paymentMethod}
              onPaymentMethodChange={(method) =>
                handleFormChange({ paymentMethod: method as any })
              }
              onPaymentGatewayChange={handlePaymentGatewayChange}
            />

            <NotesForm
              notes={formData.notes}
              onNotesChange={(notes) => handleFormChange({ notes })}
            />

            {isGuest && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 mb-2 md:mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-pink-800 text-sm">
                        {t('checkout.createAccount')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenAccountPopup}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      createAccount
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-[#23A6F0] text-white hover:bg-[#23A6F0]"
                    }`}
                  >
                    {createAccount ? " " + t('checkout.selected') : t('checkout.createAccount')}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isOrderCompleted}
              className="hidden md:block w-full bg-[#23A6F0] text-white py-3 rounded-xl font-semibold text-lg transition disabled:opacity-50"
            >
              {isSubmitting ? t('checkout.processing') : t('checkout.confirmOrder')}
            </button>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              cartItems={cartItems}
              cartSummary={cartSummary}
              deliveryMethod={formData.deliveryMethod}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isOrderCompleted}
              className="md:hidden block w-full bg-[#23A6F0] text-white py-3 rounded-xl font-semibold text-lg transition disabled:opacity-50"
            >
              {isSubmitting ? t('checkout.processing') : t('checkout.confirmOrder')}
            </button>
          </div>
        </div>
      </div>

      {/* Popup التوجيه إلى بوابة الدفع - مترجم */}
      {showRedirectPopup && redirectUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {t('checkout.redirectingToPayment')}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {t('checkout.redirectingToPaymentDesc')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-300"></div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {t('checkout.redirectingAuto')}
            </p>
          </div>
        </div>
      )}

      {/* Popup إنشاء الحساب - مترجم */}
      {showAccountPopup && (
        <AccountPopup
          isOpen={showAccountPopup}
          onClose={handleCloseAccountPopup}
          onConfirm={handleConfirmAccount}
          accountData={accountData}
          setAccountData={setAccountData}
          errors={accountErrors}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          t={t}
        />
      )}

      {showSuccessPopup && orderResult && (
        <SuccessPopup
          isOpen={showSuccessPopup}
          onClose={handleClosePopup}
          onGoToOrders={handleGoToOrders}
          onGoToHome={handleGoToHome}
          orderNumber={orderResult.orderNumber}
          orderDetails={{
            itemsCount: orderResult.itemsCount,
            total: orderResult.total,
          }}
          isGuest={isGuest}
          phone={formData.phone || ""}
          email={formData.email || accountData.email || ""}
          t={t}
        />
      )}
    </div>
  );
}

// Popup إنشاء الحساب - مترجم
interface AccountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountData: AccountData;
  setAccountData: (data: AccountData | ((prev: AccountData) => AccountData)) => void;
  errors: Record<string, string>;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  t: any;
}

function AccountPopup({
  isOpen,
  onClose,
  onConfirm,
  accountData,
  setAccountData,
  errors,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  t,
}: AccountPopupProps) {
  if (!isOpen) return null;

  const handleChange = (field: keyof AccountData, value: string) => {
    setAccountData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 text-center">
            {t('checkout.createAccount')}
          </h3>
          <p className="text-sm text-gray-500 text-center mt-1">
            {t('checkout.createAccountDescription')}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.fullName')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={accountData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={t('checkout.fullNamePlaceholder')}
                className={`w-full ps-10 pe-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23A6F0] transition ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.email')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={accountData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={t('checkout.emailPlaceholder')}
                className={`w-full ps-10 pe-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23A6F0] transition ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.phone')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={accountData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="01012345678"
                className={`w-full ps-10 pe-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23A6F0] transition ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.password')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IoLockClosedOutline  className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                value={accountData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                className={`w-full ps-10 pe-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23A6F0] transition ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.confirmPassword')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IoLockClosedOutline  className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type={showConfirmPassword ? "text" : "password"}
                value={accountData.password_confirmation}
                onChange={(e) => handleChange("password_confirmation", e.target.value)}
                placeholder="••••••••"
                className={`w-full ps-10 pe-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23A6F0] transition ${
                  errors.password_confirmation ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            {t('checkout.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#23A6F0] text-white py-2.5 rounded-xl font-medium hover:bg-[#23A6F0] transition"
          >
            {t('checkout.createAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Popup النجاح - مترجم
interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToOrders: () => void;
  onGoToHome: () => void;
  orderNumber: string | number;
  orderDetails: {
    itemsCount: number;
    total: number;
  };
  isGuest: boolean;
  phone?: string;
  email?: string;
  t: any;
}

function SuccessPopup({
  isOpen,
  onClose,
  onGoToOrders,
  onGoToHome,
  orderNumber,
  orderDetails,
  isGuest = false,
  phone = "",
  email = "",
  t,
}: SuccessPopupProps) {
  if (!isOpen) return null;

  const cleanPhone = phone.replace(/^\+?20\s*/, "").trim();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6 text-center border-b border-gray-100">
          <div className="flex justify-center mb-3">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800">
            {t('checkout.orderSuccess')}
          </h3>
          <p className="text-gray-500 text-sm mt-2">
            {t('checkout.thankYouMessage')}
          </p>
        </div>

        <div className="p-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center mb-3">
            <p className="text-xs text-gray-500 mb-1">{t('checkout.orderNumber')}</p>
            <p className="text-xl font-bold text-gray-800">#{orderNumber}</p>
          </div>

         
        </div>

        <div className={`grid ${isGuest ? 'grid-cols-1' : 'grid-cols-2'} gap-2 md:gap-5 mx-auto px-4 md:px-5 mb-5`}>
          <button
            onClick={onGoToHome}
            className="w-full bg-black text-white py-2 md:py-3 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            {t('checkout.backToHome')}
          </button>
          {!isGuest && (
            <button
              onClick={onGoToOrders}
              className="w-full bg-[#23A6F0] text-white py-2 rounded-xl font-medium hover:bg-[#23A6F0] transition"
            >
              {t('checkout.myOrders')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
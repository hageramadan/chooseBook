"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import PhoneInput from "@/components/contact/PhoneInput";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterWithPhone() {
  const router = useRouter();
  const { t } = useTranslation();
  const { registerWithPhone, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+20",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // معالج تغيير رقم الهاتف
  const handlePhoneChange = (phoneNumber: string, countryCode: string) => {
    setFormData({
      ...formData,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
    });
    
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // التحقق من الاسم
    if (!formData.name.trim()) {
      newErrors.name = t("auth.fullNameRequired");
    } else if (formData.name.trim().length < 3) {
      newErrors.name = t("auth.nameMinLength");
    }

    // التحقق من البريد الإلكتروني (اختياري ولكن نتحقق من صحته إذا أدخل)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t("auth.invalidEmail");
      }
    }

    // التحقق من رقم الهاتف
    const fullPhone = `${formData.countryCode}${formData.phoneNumber}`;
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    
    if (!formData.phoneNumber) {
      newErrors.phone = t("auth.phoneRequired");
    } else if (!phoneRegex.test(fullPhone.replace(/\s/g, ""))) {
      newErrors.phone = t("auth.invalidPhone");
    }

    // التحقق من كلمة المرور
    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth.passwordMinLength");
    }

    // التحقق من تطابق كلمة المرور
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setIsSubmitting(true);

    // استخدام API حقيقي عبر الـ Context
    const result = await registerWithPhone(
      formData.name,
      formData.phoneNumber,
      formData.password,
      formData.countryCode
    );

    if (result.success) {
      toast.success(result.message || t("auth.otpSent"), {
        duration: 4000,
        position: "top-center",
      });

      // التوجيه مباشرة إلى صفحة OTP للهاتف
      const fullPhone = `${formData.countryCode}${formData.phoneNumber}`;
      setTimeout(() => {
        router.push(`/auth/verify-otp/phone?phone=${encodeURIComponent(fullPhone)}&isRegister=true`);
      }, 1500);
    } else {
      toast.error(result.message || t("auth.registrationFailed"), {
        duration: 4000,
        position: "top-center",
      });
    }

    setIsSubmitting(false);
  };

  const clearFieldError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center ">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="max-w-md mx-auto">
            {/* بطاقة تسجيل حساب جديد */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              {/* العنوان */}
              <div className="text-center mb-8">
                <h1 className="text-xl font-bold text-gray-800 mb-2">
                  {t("auth.register")}
                </h1>
                <p className="text-gray-500 text-sm">
                  {t("auth.enterDetails")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* الاسم */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    {t("auth.fullName")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        clearFieldError("name");
                      }}
                      placeholder={t("auth.namePlaceholder")}
                      disabled={isLoading}
                      className={`w-full px-4 py-2 ps-10 border text-base rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none transition-colors ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      } ${isLoading ? "opacity-50" : ""}`}
                      
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* البريد الإلكتروني (اختياري) */}
                {/* تم التعليق عليه كما هو في الكود الأصلي */}

                {/* رقم الهاتف */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    {t("auth.phoneNumber")} <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    value={`${formData.countryCode}${formData.phoneNumber}`}
                    onChange={handlePhoneChange}
                    required={true}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* كلمة المرور */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    {t("auth.password")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        clearFieldError("password");
                      }}
                      placeholder={t("auth.passwordPlaceholder")}
                      disabled={isLoading}
                      className={`w-full px-4 text-sm py-2 ps-10 pe-10 border rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none transition-colors ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      } ${isLoading ? "opacity-50" : ""}`}
                      
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* تأكيد كلمة المرور */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    {t("auth.confirmPassword")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        clearFieldError("confirmPassword");
                      }}
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      disabled={isLoading}
                      className={`w-full px-4 py-2 text-sm ps-10 pe-10 border rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none transition-colors ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-300"
                      } ${isLoading ? "opacity-50" : ""}`}
                      
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* زر إنشاء الحساب */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center gap-2 px-4 py-3 bg-main text-white rounded-[8px] hover:bg-main-dark transition font-medium ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("auth.creatingAccount")}
                    </>
                  ) : (
                    t("auth.register")
                  )}
                </button>

                {/* رابط تسجيل الدخول */}
                <div className="text-center mt-6 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">
                    {t("auth.haveAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/auth/login")}
                      className="text-primary font-medium hover:underline"
                    >
                      {t("auth.login")}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
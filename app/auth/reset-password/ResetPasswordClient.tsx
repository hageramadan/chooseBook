"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { resetPassword } from "@/services/api";
import { useTranslation } from "@/hooks/useTranslation";

export default function ResetPasswordClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const email = searchParams.get("email") || "";
  
  const [formData, setFormData] = useState({
    new_password: "",
    new_password_confirmation: "",
  });

  const [errors, setErrors] = useState<{
    new_password?: string;
    new_password_confirmation?: string;
  }>({});

  // ✅ التحقق من وجود reset_token و reset_email في localStorage
  useEffect(() => {
    if (!email) {
      toast.error(t("auth.emailRequired"));
      setTimeout(() => router.push("/auth/forgot-password"), 2000);
      return;
    }
    
    // ✅ التحقق من وجود reset_token في localStorage
    if (typeof window !== 'undefined') {
      const resetToken = localStorage.getItem('reset_token');
      const savedEmail = localStorage.getItem('reset_email');
      
      console.log('🔍 Checking reset token:', resetToken);
      console.log('📧 Saved email:', savedEmail);
      console.log('📧 Current email:', email);
      
      // ✅ التحقق من وجود reset_token
      if (!resetToken) {
        toast.error(t("auth.resetTokenNotFound") || "رمز التحقق غير موجود. يرجى المحاولة مرة أخرى");
        setTimeout(() => router.push("/auth/forgot-password"), 2000);
        return;
      }
      
      // ✅ التحقق من تطابق البريد الإلكتروني
      if (savedEmail && savedEmail !== email) {
        toast.error(t("auth.emailMismatch") || "البريد الإلكتروني غير متطابق. يرجى المحاولة مرة أخرى");
        setTimeout(() => router.push("/auth/forgot-password"), 2000);
        return;
      }
      
      console.log('✅ Reset token verification passed');
    }
  }, [email, router, t]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.new_password) {
      newErrors.new_password = t("auth.newPasswordRequired");
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = t("auth.passwordMinLength");
    }

    if (!formData.new_password_confirmation) {
      newErrors.new_password_confirmation = t("auth.confirmPasswordRequired");
    } else if (formData.new_password !== formData.new_password_confirmation) {
      newErrors.new_password_confirmation = t("auth.passwordMismatch");
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

    setIsLoading(true);

    // ✅ إضافة try-catch للتعامل مع الأخطاء
    try {
      console.log('📤 Sending reset password request for email:', email);
      
      const result = await resetPassword({
        email: email,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation,
      });

      console.log('📥 Reset password response:', result);

      if (result.result) {
        toast.success(t("auth.resetSuccess"), {
          duration: 3000,
        });
        
        setTimeout(() => {
          router.push("/auth/login?reset=true");
        }, 1500);
      } else {
        toast.error(result.message || t("auth.resetFailed"), {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      toast.error(t("auth.unexpectedError") || "حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* زر الرجوع */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t("auth.back")}</span>
          </button>

          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-800 mb-2">{t("auth.createNewPassword")}</h1>
            <p className="text-gray-500 text-sm">
              {t("auth.enterNewPassword")}
            </p>
            <p className="text-gray-700 font-medium mt-2 break-all">{email}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* كلمة المرور الجديدة */}
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">
                {t("auth.newPassword")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaLock className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.new_password}
                  onChange={(e) => {
                    setFormData({ ...formData, new_password: e.target.value });
                    if (errors.new_password) setErrors({ ...errors, new_password: undefined });
                  }}
                  placeholder={t("auth.newPasswordPlaceholder")}
                  disabled={isLoading}
                  className={`w-full px-4 text-sm py-2 ps-10 pe-10 border rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none ${
                    errors.new_password ? "border-red-500" : "border-gray-300"
                  } ${isLoading ? "opacity-50" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1">{errors.new_password}</p>
              )}
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t("auth.confirmPassword")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaLock className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.new_password_confirmation}
                  onChange={(e) => {
                    setFormData({ ...formData, new_password_confirmation: e.target.value });
                    if (errors.new_password_confirmation) setErrors({ ...errors, new_password_confirmation: undefined });
                  }}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 text-sm ps-10 pe-10 border rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none ${
                    errors.new_password_confirmation ? "border-red-500" : "border-gray-300"
                  } ${isLoading ? "opacity-50" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.new_password_confirmation && (
                <p className="text-red-500 text-xs mt-1">{errors.new_password_confirmation}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-main text-white rounded-[8px] hover:bg-main-dark transition disabled:opacity-50"
            >
              {isLoading ? t("auth.resetting") : t("auth.resetPassword")}
            </button>

            <div className="text-center mt-6 pt-4 border-t">
              <p className="text-gray-600 text-sm">
                {t("auth.rememberPassword")}{" "}
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
    </>
  );
}
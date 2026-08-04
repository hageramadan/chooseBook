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
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterWithEmail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { registerWithEmail, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("auth.nameRequired");
    } else if (formData.name.trim().length < 3) {
      newErrors.name = t("auth.nameMinLength");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = t("auth.emailRequired");
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t("auth.invalidEmail");
    }

    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth.passwordMinLength");
    }

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

    const result = await registerWithEmail(
      formData.name,
      formData.email,
      formData.password
    );

    if (result.success) {
      toast.success(t("auth.registerSuccess"), {
        duration: 3000,
      });

      setTimeout(() => {
        router.push(`/auth/verify-otp/email?email=${encodeURIComponent(formData.email)}`);
      }, 1500);
    } else {
      toast.error(result.message || t("auth.registerFailed"));
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
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-800 mb-2">{t("auth.createAccount")}</h1>
            <p className="text-gray-500 text-sm">{t("auth.enterDetails")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">
                {t("auth.fullName")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaUser className="absolute  start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    clearFieldError("name");
                  }}
                  placeholder={t("auth.namePlaceholder")}
                  disabled={isLoading}
                  className={`w-full px-4 py-2  ps-10 border rounded-[8px] ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">
                {t("auth.email")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaEnvelope className="absolute  start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    clearFieldError("email");
                  }}
                  placeholder={t("auth.emailPlaceholder")}
                  disabled={isLoading}
                  className={`w-full px-4 py-2  ps-10 border rounded-[8px] ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">
                {t("auth.password")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaLock className="absolute  start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    clearFieldError("password");
                  }}
                  placeholder={t("auth.passwordPlaceholder")}
                  disabled={isLoading}
                  className={`w-full px-4 py-2  ps-10  pe-10 border rounded-[8px] ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute  end-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">
                {t("auth.confirmPassword")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaLock className="absolute  start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    clearFieldError("confirmPassword");
                  }}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  disabled={isLoading}
                  className={`w-full px-4 py-2  ps-10  pe-10 border rounded-[8px] ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute  end-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#23A6F0] text-white rounded-[8px] hover:bg-[#23A6F0] transition disabled:opacity-50"
            >
              {isLoading ? t("auth.creatingAccount") : t("auth.createAccount")}
            </button>

            <div className="text-center mt-6 pt-4 border-t">
              <p className="text-gray-600 text-sm">
                {t("auth.haveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="text-[#23A6F0] font-medium hover:underline"
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
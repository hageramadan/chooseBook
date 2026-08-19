"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function OTPWithEmail() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { verifyOTPWithEmail, resendOTPToEmail, isAuthenticated } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(59);
  const [canResend, setCanResend] = useState(false);
  
  const email = searchParams.get("email") || "";
  const isLogin = searchParams.get("isLogin") === "true";
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      toast.error(t("auth.emailRequired"));
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  }, [email, router, t]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !canResend) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  //  دالة معالجة اللصق (Paste) - نفس الهيكل من OTPWithPhone
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const pastedData = e.clipboardData.getData("text");
    const cleanedData = pastedData.replace(/\s/g, "").replace(/[^0-9]/g, "");
    
    if (cleanedData.length >= 6) {
      const otpDigits = cleanedData.slice(0, 6).split("");
      const newOtp = [...otp];
      otpDigits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      
      const lastFilledIndex = Math.min(otpDigits.length, 5);
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      } else {
        inputRefs.current[lastFilledIndex]?.focus();
      }
    } else {
      const otpDigits = cleanedData.split("");
      const newOtp = [...otp];
      otpDigits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      
      const lastFilledIndex = Math.min(otpDigits.length, 5);
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      }
      
      if (cleanedData.length > 0 && cleanedData.length < 6) {
        toast.error(t('otp.pasteIncomplete'), {
          duration: 2000,
        });
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    
    // الانتقال إلى الحقل التالي إذا تم إدخال رقم
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  //  دالة معالجة الضغط على المفاتيح - نفس الهيكل من OTPWithPhone مع إضافة دعم الأسهم
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    //  التنقل بالأسهم (يمين ويسار)
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    //  حذف الرقم والانتقال للخلف (نفس الفانكشن من OTPWithPhone)
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
    
    //  السماح بالـ Delete (حذف للأمام)
    if (e.key === "Delete") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error(t("auth.invalidOTP"));
      return;
    }

    setIsLoading(true);

    const result = await verifyOTPWithEmail(otpValue, email);

    if (result.success) {
      toast.success(t("auth.otpSuccess"), {
        duration: 2000,
      });
      
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } else {
      toast.error(result.message || t("auth.invalidOTP"));
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    if (!canResend) {
      toast.error(t("auth.pleaseWaitResend"));
      return;
    }
    
    setIsLoading(true);

    const result = await resendOTPToEmail(email);

    if (result.success) {
      toast.success(result.message || t("auth.resendSuccess"), {
        duration: 3000,
      });
      setCanResend(false);
      setTimeLeft(59);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } else {
      toast.error(result.message || t("auth.resendFailed"), {
        duration: 4000,
      });
    }

    setIsLoading(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              {isLogin ? t("auth.verifyLogin") : t("auth.verifyEmail")}
            </h1>
            <p className="text-gray-500 text-sm">
              {isLogin ? t("auth.verifyLoginDesc") : t("auth.verifyEmailDesc")}
            </p>
            <p className="text-gray-700 font-medium mt-2 break-all">{email || t("auth.email")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2 mb-6 flex-row-reverse" dir="rtl">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className="w-12 h-12 md:w-14 md:h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-[8px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                  maxLength={1}
                  dir="ltr"
                />
              ))}
            </div>

            <div className="text-center mb-6">
              {!canResend ? (
                <p className="text-gray-500 text-sm">
                  {t("auth.didntReceiveCode")}{" "}
                  <span className="text-primary font-medium">
                    {t("auth.resendIn")} 
                    <span className="ms-1 font-bold">{timeLeft.toString().padStart(2, "0")} {t("auth.seconds")}</span>
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-primary font-medium hover:underline transition disabled:opacity-50"
                >
                  {t("auth.resendCode")}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-main text-white rounded-[8px] hover:bg-main-dark transition disabled:opacity-50 font-medium"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></span>
                  {t("auth.verifying")}
                </>
              ) : (
                t("auth.verify")
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
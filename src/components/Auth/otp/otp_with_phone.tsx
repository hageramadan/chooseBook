"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function OTPWithPhone() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOTPWithPhone, resendOTPToPhone, isAuthenticated } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(59);
  const [canResend, setCanResend] = useState(false);
  
  //  استقبال country_code و phone منفصلين
  const fullPhone = searchParams.get("phone") || "";
  const isLogin = searchParams.get("isLogin") === "true";
  const isRegister = searchParams.get("isRegister") === "true";
  
  //  استخراج country_code و phone من الرقم الكامل
  let countryCode = "+20";
  let phoneNumber = fullPhone;
  
  if (fullPhone.startsWith("+20")) {
    countryCode = "+20";
    phoneNumber = fullPhone.substring(3);
  } else if (fullPhone.startsWith("+966")) {
    countryCode = "+966";
    phoneNumber = fullPhone.substring(4);
  } else if (fullPhone.startsWith("+971")) {
    countryCode = "+971";
    phoneNumber = fullPhone.substring(4);
  } else if (fullPhone.startsWith("+")) {
    // معالجة عامة
    const match = fullPhone.match(/^\+(\d{1,4})(.+)$/);
    if (match) {
      countryCode = `+${match[1]}`;
      phoneNumber = match[2];
    }
  }

  // التحقق من وجود رقم الهاتف
  useEffect(() => {
    if (!fullPhone) {
      toast.error("رقم الهاتف مطلوب للتحقق");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  }, [fullPhone, router]);

  // إذا كان المستخدم مسجل دخول بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // مؤقت إعادة الإرسال
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !canResend) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setIsLoading(true);

    //  إرسال otp, phone, country_code بشكل منفصل
    const result = await verifyOTPWithPhone(otpValue, phoneNumber, countryCode);

    if (result.success) {
      toast.success("تم التحقق بنجاح! جاري توجيهك... 🎉", {
        duration: 2000,
      });
      
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } else {
      toast.error(result.message || "رمز التحقق غير صحيح");
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    if (!canResend) {
      toast.error("الرجاء الانتظار قبل إعادة الإرسال");
      return;
    }
    
    setIsLoading(true);

    //  إعادة إرسال OTP باستخدام phone و country_code منفصلين
    // ملاحظة: دالة resendOTPToPhone تحتاج أيضاً إلى تعديل لاستقبال country_code
    const result = await resendOTPToPhone(phoneNumber, countryCode);

    if (result.success) {
      toast.success(result.message || "تم إرسال رمز جديد إلى هاتفك", {
        duration: 3000,
      });
      setCanResend(false);
      setTimeLeft(59);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        document.getElementById("otp-0")?.focus();
      }, 100);
    } else {
      toast.error(result.message || "فشل إعادة إرسال الرمز", {
        duration: 4000,
      });
    }

    setIsLoading(false);
  };

  return (
    <>
     
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center p-4">
        <div className="lg:max-w-md w-full bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              {isLogin ? "التحقق من تسجيل الدخول" : isRegister ? "تفعيل الحساب" : "التحقق من الهاتف"}
            </h1>
            <p className="text-gray-500 text-sm">
              {isLogin 
                ? "أدخل الرقم المكون من 6 أرقام الذي أرسلناه إلى هاتفك لتأكيد تسجيل الدخول"
                : isRegister
                ? "أدخل الرقم المكون من 6 أرقام الذي أرسلناه إلى هاتفك لتفعيل حسابك"
                : "أدخل الرقم المكون من 6 أرقام الذي أرسلناه إلى هاتفك للتحقق"
              }
            </p>
            <p className="text-gray-700 font-medium mt-2 direction-ltr" dir="ltr">
              {`${countryCode} ${phoneNumber}  `}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-between lg:gap-2 mb-6 flex-row-reverse">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className="w-10 h-10 md:w-14 md:h-14 text-center text-xl font-bold border-2 border-gray-300  rounded-[8px]  focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                  maxLength={1}
                />
              ))}
            </div>

            <div className="text-center mb-6">
              {!canResend ? (
                <p className="text-gray-500 text-sm">
                  لم تستلم الرمز؟{" "}
                  <span className="text-primary font-medium">
                    إعادة الإرسال ({timeLeft.toString().padStart(2, "0")} ثانية)
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-primary font-medium hover:underline transition disabled:opacity-50"
                >
                  لم تستلم الرمز؟ إعادة إرسال
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-main text-white  rounded-[8px]  hover:bg-main-dark transition disabled:opacity-50 font-medium"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></span>
                  جاري التحقق...
                </>
              ) : (
                "تحقق"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
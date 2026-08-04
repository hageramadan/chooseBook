"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaPhoneAlt, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function ForgotWithPhone() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(59);
  const [canResend, setCanResend] = useState(false);

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
    // السماح فقط بالأرقام
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    // الانتقال تلقائياً إلى الحقل التالي
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // الانتقال إلى الحقل السابق عند الضغط على Backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setIsLoading(true);

    // محاكاة التحقق من OTP
    setTimeout(() => {
      setIsLoading(false);
      toast.success("تم التحقق بنجاح! ");

      // التوجيه إلى صفحة إعادة تعيين كلمة المرور
      setTimeout(() => {
        // router.push("/auth/reset-password");
      }, 1500);
    }, 1500);
  };

  const handleResendCode = () => {
    if (!canResend) return;

    toast.success("تم إرسال رمز جديد إلى رقم هاتفك");
    setCanResend(false);
    setTimeLeft(59);
    setOtp(["", "", "", "", "", ""]);

    // التركيز على أول حقل
    document.getElementById("otp-0")?.focus();
  };

  return (
    <>
      

      <div className=" page-with-padding bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="max-w-md mx-auto">
            {/* بطاقة التحقق */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              {/* العنوان */}
              <div className="text-center mb-8">
                <h1 className="text-xl font-bold text-gray-800 mb-2">
                  التحقق من الهاتف
                </h1>
                <p className="text-gray-500 text-sm">
                  أدخل الرقم المكون من 6 أرقام الذي أرسلناه عبر رقم الهاتف:
                </p>
                <p className="text-gray-700 font-medium mt-2 dir-ltr">
                  +20 12 3456 74910
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* حقول OTP */}
                <div className="flex justify-between gap-2 mb-6">
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
                      className="w-12 h-12 md:w-14 md:h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#23A6F0] focus:ring-2 focus:ring-[#23A6F0]/20 outline-none transition-all"
                      maxLength={1}
                      
                    />
                  ))}
                </div>

                {/* مؤقت إعادة الإرسال */}
                <div className="text-center mb-6">
                  {!canResend ? (
                    <p className="text-gray-500 text-sm">
                      لم تستلم الرمز؟{" "}
                      <span className="text-[#23A6F0] font-medium">
                        إعادة الإرسال ({timeLeft.toString().padStart(2, "0")})
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-[#23A6F0] font-medium hover:underline"
                    >
                      لم تستلم الرمز؟ إعادة إرسال
                    </button>
                  )}
                </div>

                {/* زر الاستمرار */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center gap-2 px-4 py-3 bg-black text-white rounded-[8px] hover:bg-gray-800 transition font-medium ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    <>استمرار</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

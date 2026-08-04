// components/OrderTracker.tsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Box,
  Home,
  XCircle,
  PackageCheck,
  Truck,
  AlertCircle,
} from "lucide-react";
import { FaCircleCheck } from "react-icons/fa6";
import { useTranslation } from "@/hooks/useTranslation";

//  تصدير النوع هنا
export type OrderStatus =
  | "ordered" // تم الطلب
  | "processing" // قيد المعالجة
  | "ready_for_receive" // جاهز للاستلام
  | "delivering" // جارٍ التوصيل
  | "delivered" // تم التسليم
  | "not_delivered" // لم يتم التسليم
  | "cancelled"; // ملغي

export type DeliveryMethod = "pickup" | "delivery";

interface OrderTrackerProps {
  currentStatus: OrderStatus;
  deliveryMethod?: DeliveryMethod;
}

// ========== تكوين المراحل حسب نوع الاستلام ==========
const getStepsConfig = (t: any) => ({
  pickup: [
    { label: t('orderTracker.ordered'), icon: Clock },
    { label: t('orderTracker.processing'), icon: Box },
    { label: t('orderTracker.readyForPickup'), icon: PackageCheck },
    { label: t('orderTracker.delivered'), icon: Home },
  ],
  delivery: [
    { label: t('orderTracker.ordered'), icon: Clock },
    { label: t('orderTracker.processing'), icon: Box },
    { label: t('orderTracker.onTheWay'), icon: Truck },
    { label: t('orderTracker.delivered'), icon: Home },
  ],
});

export default function OrderTracker({
  currentStatus,
  deliveryMethod = "pickup",
}: OrderTrackerProps) {
  const { t } = useTranslation(); //  استخدام hook الترجمة
  
  // ========== حساب المراحل بناءً على نوع الاستلام ==========
  const stepsConfig = useMemo(() => getStepsConfig(t), [t]);
  const steps = useMemo(() => {
    return stepsConfig[deliveryMethod];
  }, [deliveryMethod, stepsConfig]);

  // ========== حساب الخطوة الحالية ==========
  const currentStep = useMemo(() => {
    const statusMap: Record<OrderStatus, number> = {
      ordered: 0,
      processing: 1,
      ready_for_receive: 2,
      delivering: 2,
      delivered: 3,
      not_delivered: 3,
      cancelled: -1,
    };
    return statusMap[currentStatus] ?? 0;
  }, [currentStatus]);

  // ========== عرض الحالات الخاصة ==========
  if (currentStatus === "cancelled") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full"
        dir="rtl"
      >
        <div className="bg-blue-50 border border-red-200 rounded-[8px] p-4 md:p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <XCircle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-3" />
          </motion.div>
          <h3 className="text-base md:text-xl font-bold text-red-600">{t('orderTracker.cancelledTitle')}</h3>
          <p className="text-sm md:text-base text-red-500 mt-1">{t('orderTracker.cancelledDesc')}</p>
        </div>
      </motion.div>
    );
  }

  if (currentStatus === "not_delivered") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full"
        dir="rtl"
      >
        <div className="bg-blue-50 border border-red-200 rounded-[8px] p-4 md:p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-3" />
          </motion.div>
          <h3 className="text-base md:text-xl font-bold text-red-600">{t('orderTracker.notDeliveredTitle')}</h3>
          <p className="text-sm md:text-base text-red-500 mt-1">{t('orderTracker.notDeliveredDesc')}</p>
        </div>
      </motion.div>
    );
  }

  // ========== عرض الـ Timeline ==========
  return (
    <div className="w-full">
      <div className="relative">
        {/* الخط الخلفي (الرمادي) */}
        <div className="absolute top-5 start-9 end-9 h-[2px] bg-gray-200 rounded-full" />

        {/* الخط الأمامي (المتحرك) */}
        <motion.div
          className="absolute top-5 h-[2px] bg-[#23A6F0] rounded-full"
          initial={{ right: "36px", width: "0%" }}
          animate={{
            right: "36px",
            width:
              currentStep >= steps.length - 1
                ? "calc(100% - 72px)"
                : `calc(${(currentStep / (steps.length - 1)) * 100}% - ${
                    (currentStep / (steps.length - 1)) * 72
                  }px)`,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />

        {/* الأيقونات */}
        <div className="relative flex justify-between items-center">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={idx} className="flex flex-col items-center text-center">
                <motion.div
                  className="relative z-10 mb-2"
                  initial={false}
                  animate={
                    isCurrent
                      ? {
                          scale: [1, 1.1, 1],
                          transition: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                        }
                      : { scale: 1 }
                  }
                >
                  {/* Glow Effect للحالة الحالية */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-300"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.4, opacity: [0.2, 0.5, 0.2] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  <div
                    className={`
                      relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full 
                      flex items-center justify-center bg-white
                      border-2 transition-all duration-300
                      ${
                        isCompleted
                          ? "border-[#23A6F0] bg-[#23A6F0]/10"
                          : isCurrent
                          ? "border-[#23A6F0]"
                          : "border-gray-300"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <FaCircleCheck className="w-6 h-6 md:w-7 md:h-7 text-[#23A6F0]" />
                      </motion.div>
                    ) : (
                      <step.icon
                        className={`w-5 h-5 md:w-6 md:h-6 ${
                          isCurrent ? "text-[#23A6F0]" : "text-gray-400"
                        }`}
                      />
                    )}
                  </div>
                </motion.div>

                <p
                  className={`
                    font-bold text-xs md:text-sm
                    ${isCompleted || isCurrent ? "text-gray-800" : "text-gray-400"}
                  `}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
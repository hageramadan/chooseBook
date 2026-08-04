// components/checkout/ContactInfoForm.tsx
"use client";

import { useState } from "react";
import { ContactInfoFormProps } from "./types";
import PhoneInput from "@/components/contact/PhoneInput";
import { Mail } from "lucide-react";

// دالة التحقق من الاسم الكامل
const validateFullName = (name: string): string | null => {
  if (!name.trim()) {
    return "الاسم الكامل مطلوب";
  }
  if (name.trim().length < 3) {
    return "الاسم الكامل يجب أن يكون على الأقل 3 أحرف";
  }
  if (name.trim().length > 100) {
    return "الاسم الكامل طويل جداً";
  }
  return null;
};

//  دالة التحقق من البريد الإلكتروني
const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "البريد الإلكتروني مطلوب";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "البريد الإلكتروني غير صحيح";
  }
  return null;
};

interface ContactInfoFormExtendedProps extends ContactInfoFormProps {
  isGuest?: boolean; //  إضافة prop للتحقق من حالة الضيف
}

export default function ContactInfoForm({ 
  formData, 
  onFormChange,
  isGuest = false //  القيمة الافتراضية false
}: ContactInfoFormExtendedProps) {
  // حالة لتخزين رسالة الخطأ للاسم
  const [nameError, setNameError] = useState<string | null>(null);
  const [isNameTouched, setIsNameTouched] = useState(false);

  //  حالة لتخزين رسالة الخطأ للبريد الإلكتروني
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailTouched, setIsEmailTouched] = useState(false);

  // معالج تغيير الاسم
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFormChange({ fullName: value });
    
    if (isNameTouched) {
      const error = validateFullName(value);
      setNameError(error);
    }
  };

  // معالج ترك حقل الاسم
  const handleNameBlur = () => {
    setIsNameTouched(true);
    const error = validateFullName(formData.fullName);
    setNameError(error);
  };

  //  معالج تغيير البريد الإلكتروني
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFormChange({ email: value });
    
    if (isEmailTouched) {
      const error = validateEmail(value);
      setEmailError(error);
    }
  };

  //  معالج ترك حقل البريد الإلكتروني
  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    const error = validateEmail(formData.email || "");
    setEmailError(error);
  };

  // معالج تغيير رقم الهاتف (من مكون PhoneInput)
  const handlePhoneChange = (phoneNumber: string, countryCode: string) => {
    // بناء الرقم الكامل مع كود الدولة
    const fullPhone = `${countryCode}${phoneNumber}`;
    
    // تحديث الفورم بالبيانات الجديدة
    onFormChange({ 
      phone: fullPhone,
      phoneNumber: phoneNumber,     // الرقم فقط بدون كود
      phoneCountryCode: countryCode // كود الدولة
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        
        معلومات الاتصال
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center">
        {/* حقل الاسم الكامل */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            placeholder="أدخل اسمك الكامل"
            className={`w-full px-4 py-3 border  rounded-[8px]  focus:outline-none focus:ring-2 focus:ring-[#23A6F0] focus:border-[#23A6F0] transition ${
              nameError && isNameTouched
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-200"
            }`}
          />
          {nameError && isNameTouched && (
            <p className="text-red-500 text-sm mt-1">{nameError}</p>
          )}
        </div>
        
        {/* حقل رقم الجوال باستخدام PhoneInput المتطور */}
        <div className="h-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">
             رقم الجوال <span className="text-red-500">*</span>
          </label>
          <PhoneInput
            value={formData.phone || ""}
            onChange={handlePhoneChange}
            required={true}
          />
        </div>
      </div>

      {/*  حقل البريد الإلكتروني (يظهر فقط للضيف) */}
      {isGuest && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            البريد الإلكتروني <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute  start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email || ""}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="example@email.com"
              className={`w-full  ps-12  pe-4 py-3 border  rounded-[8px]  focus:outline-none focus:ring-2 focus:ring-[#23A6F0] focus:border-[#23A6F0] transition ${
                emailError && isEmailTouched
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-200"
              }`}
            />
          </div>
          {emailError && isEmailTouched && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
         
        </div>
      )}
    </div>
  );
}
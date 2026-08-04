"use client";

import Link from "next/link";
import { FaTwitter, FaInstagram } from "react-icons/fa";
import { TfiEmail } from "react-icons/tfi";
import { MdKeyboardArrowDown } from "react-icons/md";
import { RxLinkedinLogo } from "react-icons/rx";
import { IoLogoWhatsapp } from "react-icons/io";
import { FaFacebook } from "react-icons/fa";
import { PiGiftBold } from "react-icons/pi";
import { LiaPhoneSolid } from "react-icons/lia";
import { useSettings } from "@/hooks/useSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

//  دالة للحصول على الترجمات حسب اللغة
const getTranslations = (lang: string) => {
  if (lang === "en") {
    return {
      freeShipping: "Order over $2000 and get free shipping",
      followUs: "Follow us:",
      language: "Eng",
      loading: "Loading...",
      phone: "Phone",
      email: "Email",
    };
  }
  // Arabic (default)
  return {
    freeShipping: "اطلب بقيمة 2000$ واحصل علي توصيل مجاني",
    followUs: "تابعنا :",
    language: "عربي",
    loading: "جاري التحميل...",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
  };
};

export function SubNavbar() {
  const { settings, loading: settingsLoading } = useSettings();
  const { language, setLanguage } = useLanguage();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  //  الحصول على الترجمات حسب اللغة الحالية
  const t = getTranslations(language);

  //  إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  //  إغلاق القائمة عند الضغط على Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showLanguageDropdown) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showLanguageDropdown]);

  //  دالة تغيير اللغة - نفس طريقة الناف بار
  const handleLanguageChange = async (locale: string) => {
    try {
      localStorage.setItem("user_language", locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
      setLanguage(locale);

      // إذا كان المستخدم مسجل دخول، تحديث اللغة في الباك اند
      // if (isAuthenticated) {
      //   await updateUserLocale(locale);
      // }

      setShowLanguageDropdown(false);
      
     

      window.location.reload();
    } catch (error) {
      console.error("Error changing language:", error);
      const savedLanguage = localStorage.getItem("user_language") || "ar";
      setLanguage(savedLanguage);
     
    }
  };

  // بناء روابط التواصل الاجتماعي للـ SubNavbar
  const getSocialLinks = () => {
    if (!settings) return [];
    
    const links = [];
    
    if (settings.instagram) {
      links.push({ 
        href: settings.instagram, 
        label: "Instagram",
        icon: FaInstagram
      });
    }
    
    if (settings.facebook) {
      links.push({ 
        href: settings.facebook, 
        label: "Facebook",
        icon: FaFacebook
      });
    }
    
    if (settings.whatsapp) {
      const whatsappUrl = settings.whatsapp.startsWith('https://') 
        ? settings.whatsapp 
        : `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`;
      links.push({ 
        href: whatsappUrl, 
        label: "WhatsApp",
        icon: IoLogoWhatsapp
      });
    }

    if (settings.twitter) {
      links.push({ 
        href: settings.twitter, 
        label: "Twitter",
        icon: FaTwitter
      });
    }

    if (settings.linkedin) {
      links.push({ 
        href: settings.linkedin, 
        label: "LinkedIn",
        icon: RxLinkedinLogo
      });
    }

    return links;
  };

  const socialLinks = getSocialLinks();

  //  حل مشكلة Hydration Mismatch - استخدام useRef بدلاً من useState
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // استخدام requestAnimationFrame لتأخير التحديث
    const raf = requestAnimationFrame(() => {
      setIsClient(true);
    });
    
    return () => cancelAnimationFrame(raf);
  }, []);

  //  إذا كان في السيرفر أو لم يتم التحميل بعد، عرض محتوى ثابت
  if (!isClient) {
    return (
      <div className="w-full bg-[#23A6F0] border-b border-[#E4E7E9] py-2 md:py-3">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
            <div className="flex gap-5 items-center">
              <div className="hidden md:flex items-center gap-1">
                <LiaPhoneSolid className="text-white" />
                <span className="text-white text-sm md:text-sm font-bold">
                  ---
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <TfiEmail className="text-white" />
                <span className="text-white text-sm md:text-sm font-bold">
                  ---
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0 md:gap-3">
              {/* <PiGiftBold className="text-white w-4 h-4 md:w-5 md:h-5" /> */}
              <p className="text-white text-xs md:text-sm font-semibold text-center">
                ---
              </p>
            </div>
            <div className="hidden md:flex items-center gap-0 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-white text-xs md:text-sm font-medium">
                  ---
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#23A6F0] border-b border-[#E4E7E9] py-2 md:py-3">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between ">
          {/* Right Section - Email & Phone */}
          <div className="hidden lg:flex gap-5 items-center ">
            {/* Phone */}
            <div className="hidden md:flex items-center gap-1">
              <LiaPhoneSolid className="text-white" />
              <Link
                dir="ltr"
                href={settings?.whatsapp ? `tel:${settings.whatsapp.replace(/[^0-9]/g, '')}` : "#"}
                className="text-white text-sm md:text-sm font-bold hover:opacity-80 transition-opacity"
              >
                {settingsLoading ? t.loading : settings?.phone || "(000) 000-999"}
              </Link>
            </div>
            
            {/* Email */}
            <div className="hidden md:flex items-center gap-2">
              <TfiEmail className="text-white" />
              <Link
                href={settings?.email ? `mailto:${settings.email}` : "#"}
                className="text-white text-sm md:text-sm font-bold hover:opacity-80 transition-opacity"
              >
                {settingsLoading ? t.loading : settings?.email || "lorum@lorum.com"}
              </Link>
            </div>
          </div>

          {/* Center Section - Free Shipping Message */}
          <div className="flex items-start md:items-center gap-1 md:gap-3">
            {/* <PiGiftBold className="text-white w-4 h-4 md:w-5 md:h-5" /> */}
            {/* <p className="text-white text-xs md:text-sm font-semibold ">
              {t.freeShipping}
            </p> */}
          </div>
          
          {/* Left Section - Language & Social Media */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Social Media Links */}
            <div className="hidden md:flex items-center gap-3 md:gap-4">
              <span className="text-white text-xs md:text-sm font-medium">
                {t.followUs}
              </span>
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white duration-300 hover:scale-110 transform hover:opacity-80"
                    aria-label={social.label}
                  >
                    <Icon className="text-sm md:text-base" />
                  </Link>
                );
              })}
            </div>
            
            {/* Divider - Show only if there are social links */}
            {socialLinks.length > 0 && (
              <div className="w-px h-5 bg-[#ffffff52]"></div>
            )}
            
            {/* Language Selector with Dropdown */}
            <div className="relative" ref={languageDropdownRef}>
              <div 
                className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                <span className="text-white text-xs md:text-sm font-medium">
                  {language === "ar" ? "عربي" : "Eng"}
                </span>
                <MdKeyboardArrowDown 
                  className={`text-white transition-transform duration-200 ${showLanguageDropdown ? "rotate-180" : ""}`} 
                />
              </div>

              {/* Language Dropdown */}
              {showLanguageDropdown && (
                <div className="absolute top-full end-0 mt-2 w-40 bg-white rounded-lg border shadow-xl z-50">
                  <div className="py-2">
                    <button
                      onClick={() => handleLanguageChange("ar")}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        language === "ar" ? "text-[#23A6F0] font-bold" : ""
                      }`}
                    >
                      <span className="text-lg">🇸🇦</span>
                      العربية
                      {language === "ar" && (
                        <span className="mr-auto text-[#23A6F0]">✓</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleLanguageChange("en")}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        language === "en" ? "text-[#23A6F0] font-bold" : ""
                      }`}
                    >
                      <span className="text-lg">🇬🇧</span>
                      English
                      {language === "en" && (
                        <span className="mr-auto text-[#23A6F0]">✓</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
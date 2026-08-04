"use client";

import Image from "next/image";
import Link from "next/link";
import { PiLineVerticalThin } from "react-icons/pi";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getCategories } from "@/services/api";
import { useSettings } from "@/hooks/useSettings";
import { useLanguage } from "@/contexts/LanguageContext";

//  دالة للحصول على الترجمات حسب اللغة (نفس الفوتر الأول)
const getTranslations = (lang: string) => {
  if (lang === 'en') {
    return {
      categories: "Categories",
      new: "New",
      leastPrice: "Least Price",
      discounts: "Discounts",
      help: "Help",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      contactUs: "Contact Us",
      callUs: "Call Us",
      email: "Email",
      loading: "Loading...",
      noCategories: "No categories",
      home: "Home",
      allRightsReserved: "All Rights Reserved",
      storeName: "Your perfect store, everything you need",
    };
  }
  // Arabic (default)
  return {
    categories: "الفئات",
    new: "جديدنا",
    leastPrice: "اقل الاسعار",
    discounts: "الخصومات",
    help: "المساعدة",
    terms: "الشروط والاحكام",
    privacy: "سياسة الخصوصية",
    contactUs: "تواصل معنا",
    callUs: "اتصل بنا",
    email: "البريد الإلكتروني",
    loading: "جاري التحميل...",
    noCategories: "لا توجد فئات",
    home: "الرئيسية",
    allRightsReserved: "جميع الحقوق محفوظة",
    storeName: "متجرك المثالي هنا كل ما تريد",
  };
};

export function Footer() {
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  //  إضافة state لمنع Hydration Error
  const [isMounted, setIsMounted] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [footerCategories, setFooterCategories] = useState<
    { id: number; name: string }[]
  >([]);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // استخدام Hook الإعدادات
  const { settings, loading: settingsLoading } = useSettings();

  //  تعيين isMounted بعد تحميل العميل
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getCategories();
        setFooterCategories(
          categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))
        );
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showCategoriesDropdown &&
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target as Node)
      ) {
        setShowCategoriesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCategoriesDropdown]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCategoriesDropdown) {
        setShowCategoriesDropdown(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showCategoriesDropdown]);

  // بناء روابط التواصل الاجتماعي للفوتر - مع الصور
  const getSocialLinks = () => {
    if (!settings) return [];
    
    const links = [];
    
    // انستجرام
    if (settings.instagram) {
      links.push({ 
        href: settings.instagram, 
        label: "Instagram",
        imagePath: "/images/social/insta.png"
      });
    }
    
    // فيسبوك
    if (settings.facebook) {
      links.push({ 
        href: settings.facebook, 
        label: "Facebook",
        imagePath: "/images/social/face.png"
      });
    }
    
    // واتساب
    if (settings.whatsapp) {
      const whatsappUrl = settings.whatsapp.startsWith('https://') 
        ? settings.whatsapp 
        : `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`;
      links.push({ 
        href: whatsappUrl, 
        label: "WhatsApp",
        imagePath: "/images/social/wats.png"
      });
    }

    // تويتر (X)
    if (settings.twitter) {
      links.push({ 
        href: settings.twitter, 
        label: "Twitter",
        imagePath: "/images/social/x.png"
      });
    }

    // سناب شات
    if (settings.snapchat) {
      links.push({ 
        href: settings.snapchat, 
        label: "Snapchat",
        imagePath: "/images/social/snap.png"
      });
    }

    // لينكد إن
    if (settings.linkedin) {
      links.push({ 
        href: settings.linkedin, 
        label: "LinkedIn",
        imagePath: "/images/social/linkedin.png"
      });
    }

    return links;
  };

  const socialLinks = getSocialLinks();

  //  عرض نسخة مبسطة أثناء التحميل على السيرفر (بدون نصوص مترجمة)
  if (!isMounted) {
    return (
      <footer className="border-t mt-auto bg-[#141718] text-white pt-6 md:pt-10">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex flex-wrap md:flex-row flex-col items-center justify-center md:justify-between gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-24 h-8 bg-gray-700 animate-pulse rounded"></div>
                <PiLineVerticalThin className="w-6 h-8 text-[#E8ECEF]" />
                <div className="w-48 h-4 bg-gray-700 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="flex md:flex-row flex-col justify-center gap-5 items-center">
              <div className="w-16 h-4 bg-gray-700 animate-pulse rounded"></div>
              <div className="w-16 h-4 bg-gray-700 animate-pulse rounded"></div>
              <div className="w-16 h-4 bg-gray-700 animate-pulse rounded"></div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 md:pt-8 pb-16 lg:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-32 h-4 bg-gray-700 animate-pulse rounded"></div>
              <div className="flex gap-6">
                <div className="w-20 h-4 bg-gray-700 animate-pulse rounded"></div>
                <div className="w-20 h-4 bg-gray-700 animate-pulse rounded"></div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-gray-700 animate-pulse rounded-full"></div>
                <div className="w-6 h-6 bg-gray-700 animate-pulse rounded-full"></div>
                <div className="w-6 h-6 bg-gray-700 animate-pulse rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t mt-auto bg-[#141718] text-white pt-6 md:pt-10">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* القسم العلوي */}
        <div className="flex flex-wrap md:flex-row flex-col items-center justify-center md:justify-between gap-8 mb-8">
          {/* اللوجو */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-[#FFFFFF] text-base md:text-2xl font-bold">
                {settingsLoading ? t.loading : settings?.name || "LoGo"}
              </h1>
              <PiLineVerticalThin className="w-6 h-8 text-[#E8ECEF]" />
              <p className="text-white/70 text-sm leading-relaxed">
                {settingsLoading ? t.loading : settings?.address || t.storeName}
              </p>
            </div>
          </div>

          {/* روابط -  استخدام الترجمات */}
          <div className="flex md:flex-row flex-col justify-center gap-5 items-center text-[14px]">
            <Link
              href="/"
              className="font-bold hover:text-[#23A6F0] transition-colors"
            >
              {t.home}
            </Link>

            {/* Categories Dropdown -  استخدام الترجمات */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() =>
                  setShowCategoriesDropdown(!showCategoriesDropdown)
                }
                onMouseEnter={() => setShowCategoriesDropdown(true)}
                className="flex items-center gap-1 hover:text-[#23A6F0] transition-colors"
              >
                {t.categories}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    showCategoriesDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showCategoriesDropdown && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-36 lg:w-48 bg-white rounded-[8px] border shadow-xl z-50"
                  onMouseLeave={() => setShowCategoriesDropdown(false)}
                >
                  <div className="absolute -bottom-1.5 right-4 w-3 h-3 rotate-45 bg-white border-r border-b"></div>

                  <div className="py-2">
                    {footerCategories.length > 0 ? (
                      footerCategories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/products?categories=[${category.id}]`}
                          className="block px-4 py-2 text-[14px] transition-colors hover:bg-gray-50 text-right"
                          style={{ color: "#112B40" }}
                          onClick={() => setShowCategoriesDropdown(false)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#23A6F0")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#112B40")
                          }
                        >
                          {category.name}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-[14px] text-gray-500 text-right">
                        {t.noCategories}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="hover:text-[#23A6F0] transition-colors"
            >
              {t.contactUs}
            </Link>
          </div>
        </div>

        {/* footer bottom -  استخدام الترجمات */}
        <div className="border-t border-white/20 pt-6 md:pt-8 pb-16 lg:pb-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 font-bold text-sm">
              © {t.allRightsReserved} | {new Date().getFullYear()}
            </p>

            <div className="flex gap-6">
              <Link 
                href={settings?.terms_and_conditions ? "/terms" : "#"} 
                className="hover:text-[#23A6F0] text-white"
              >
                {settingsLoading ? t.loading : settings?.terms_and_conditions || t.terms}
              </Link>
              <Link 
                href={settings?.privacy_policy ? "/privacy" : "#"} 
                className="hover:text-[#23A6F0] text-white"
              >
                {settingsLoading ? t.loading : settings?.privacy_policy || t.privacy}
              </Link>
            </div>

            {/* social - استخدام الصور بدلاً من الأيقونات */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity hover:scale-110 transform duration-200"
                  aria-label={social.label}
                >
                  <Image
                    src={social.imagePath}
                    alt={social.label}
                    width={26}
                    height={26}
                    className="w-[26px] h-[26px] object-contain"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
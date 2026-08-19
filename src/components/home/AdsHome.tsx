// components/AdsHome.tsx

'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'
import Image from 'next/image'
import { getAds, getFullImageUrl } from '@/services/api'
import { useLanguage } from '@/contexts/LanguageContext'

export interface AdPopup {
  id: number;
  sub_title: string;
  name: string;
  description: string;
  link: string | null;
  image: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  type?: string;
  type_label?: string;
}

interface AdsHomeProps {
  onLoad?: () => void;
}

// دالة للحصول على الترجمات حسب اللغة
const getTranslations = (lang: string) => {
  if (lang === 'en') {
    return {
      loading: "Loading...",
      shopNow: "Shop Now",
      expiresIn: "Expires in",
      days: "Days",
      hours: "Hours",
      minutes: "Minutes",
      seconds: "Seconds",
      offerExpired: "Offer expired",
      limitedOffer: "Limited Offer",
      dontMiss: "Don't miss the opportunity",
      previous: "Previous ad",
      next: "Next ad",
      goToAd: "Go to ad",
    };
  }
  // Arabic (default)
  return {
    loading: "جاري التحميل...",
    shopNow: "تسوق الان",
    expiresIn: "سينتهي الخصم خلال",
    days: "أيام",
    hours: "ساعات",
    minutes: "دقائق",
    seconds: "ثواني",
    offerExpired: "انتهى العرض",
    limitedOffer: "لفترة محدودة",
    dontMiss: "لا تفوت الفرصة",
    previous: "إعلان سابق",
    next: "إعلان تالي",
    goToAd: "الانتقال إلى الإعلان",
  };
};

export function AdsHome({ onLoad }: AdsHomeProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  const [isClient, setIsClient] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // ✅ استدعاء onLoad بعد تحميل البيانات
  useEffect(() => {
    if (!loading && !isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
  }, [loading, isDataLoaded, onLoad]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // جلب الإعلانات من API
  useEffect(() => {
    const loadAds = async () => {
      setLoading(true);
      const data = await getAds();
      setAds(data);
      setLoading(false);
    };

    loadAds();
  }, []);

  // تصفية الإعلانات النشطة
  const activeAds = ads.filter(ad => ad.is_active === 1);
  const currentAd = activeAds[currentAdIndex] || activeAds[0] || ads[0];

  // التبديل التلقائي بين الإعلانات كل 5 ثواني
  useEffect(() => {
    if (activeAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % activeAds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeAds.length]);

  // الانتقال إلى إعلان محدد
  const goToAd = (index: number) => {
    setCurrentAdIndex(index);
  };

  // التبديل يدوياً
  const nextAd = () => {
    setCurrentAdIndex((prevIndex) => (prevIndex + 1) % activeAds.length);
  };

  const prevAd = () => {
    setCurrentAdIndex((prevIndex) => (prevIndex - 1 + activeAds.length) % activeAds.length);
  };

  // حساب الوقت المتبقي من end_date من الـ API
  useEffect(() => {
    if (!currentAd) return;

    const endDateStr = currentAd.end_date;
    const calculateTimeLeft = (end: Date) => {
      const now = new Date();
      const difference = end.getTime() - now.getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };    
    if (!endDateStr) {
      const fallbackDate = new Date(currentAd.created_at);
      fallbackDate.setDate(fallbackDate.getDate() + 3);
      calculateTimeLeft(fallbackDate);
      
      const timer = setInterval(() => {
        calculateTimeLeft(fallbackDate);
      }, 1000);
      
      return () => clearInterval(timer);
    }

    const endDate = new Date(endDateStr);
    
    if (isNaN(endDate.getTime())) {
      console.error('Invalid end_date:', endDateStr);
      return;
    }

    calculateTimeLeft(endDate);
    
    const timer = setInterval(() => {
      calculateTimeLeft(endDate);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentAd]);

  // Format numbers to always show 2 digits
  const formatNumber = (num: number) => String(num).padStart(2, '0');

  // عرض شاشة تحميل
  if (loading) {
    return (
      <section className="py-6 md:py-12 bg-white">
        <div className="container-custom">
          <div className="bg-[#F2F8FD] rounded-2xl p-8 animate-pulse">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-32"></div>
                <div className="h-12 bg-gray-200 rounded w-64"></div>
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-12 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="w-[336px] md:w-[536px] h-[124px] md:h-[424px] bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // عرض نسخة ثابتة أثناء Hydration
  if (!isClient) {
    return (
      <section className="bg-[#FDF2F8] py-12">
        <div className="flex flex-row items-stretch justify-between gap-3 sm:gap-6 md:gap-10 min-h-[200px]">
          <div className="flex items-center justify-center w-full">
          </div>
        </div>
      </section>
    );
  }

  // إذا لم يوجد إعلانات أو انتهى العرض
  if (activeAds.length === 0 || !currentAd || isExpired) {
    if (!isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
    return null;
  }

  const adImageUrl = getFullImageUrl(currentAd.image);
  const hasTimer = timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0;

  return (
    <section className="py-6 md:py-12 bg-white">
      <div className="container-custom">
        <div className="bg-[#F2F8FD] rounded-2xl flex flex-col md:flex-row items-center justify-between px-4 md:px-10 py-6 md:py-8 relative overflow-hidden">
          
          {/* أزرار التنقل (إذا كان هناك أكثر من إعلان) */}
          {activeAds.length > 1 && (
            <>
              <button
                onClick={prevAd}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-1 md:p-2 shadow-lg transition-all"
                aria-label={t.previous}
              >
                <FaArrowLeft className="h-4 w-4 md:h-6 md:w-6 text-primary rotate-180" />
              </button>
              <button
                onClick={nextAd}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-1 md:p-2 shadow-lg transition-all"
                aria-label={t.next}
              >
                <FaArrowLeft className="h-4 w-4 md:h-6 md:w-6 text-primary" />
              </button>
            </>
          )}

          {/* محتوى الإعلان */}
          <div className="flex flex-col gap-2 md:gap-[22px] flex-1 z-10 px-4 md:px-0 w-full md:w-1/2">
            {currentAd.sub_title && (
              <p className="text-[10px] md:text-[14px] font-semibold py-1 px-2 bg-[#FF995D] text-white w-fit rounded">
                {currentAd.sub_title}
              </p>
            )}
            
            <h1 className="text-xl md:text-[48px] font-bold text-[#191C1F]">
              {currentAd.name}
            </h1>
            
            {currentAd.description && (
              <p className="text-sm md:text-[24px] text-[#191C1F] w-full md:w-[80%] leading-[1.5]">
                {currentAd.description}
              </p>
            )}
            
            {/* Countdown Timer - يظهر فقط إذا كان هناك وقت متبقي */}
            {hasTimer && (
              <div className="mt-2">
                <p className="text-xs md:text-sm text-gray-600 mb-2">{t.expiresIn}</p>
                <div className="flex gap-2 md:gap-4">
                  <div className="text-center">
                    <div className="bg-white text-[#191C1F] rounded-lg px-2 py-1 md:px-3 md:py-2 min-w-[40px] md:min-w-[60px]">
                      <span className="text-base md:text-2xl font-bold">{formatNumber(timeLeft.days)}</span>
                    </div>
                    <p className="text-[8px] md:text-xs text-gray-500 mt-1">{t.days}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white text-[#191C1F] rounded-lg px-2 py-1 md:px-3 md:py-2 min-w-[40px] md:min-w-[60px]">
                      <span className="text-base md:text-2xl font-bold">{formatNumber(timeLeft.hours)}</span>
                    </div>
                    <p className="text-[8px] md:text-xs text-gray-500 mt-1">{t.hours}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white text-[#191C1F] rounded-lg px-2 py-1 md:px-3 md:py-2 min-w-[40px] md:min-w-[60px]">
                      <span className="text-base md:text-2xl font-bold">{formatNumber(timeLeft.minutes)}</span>
                    </div>
                    <p className="text-[8px] md:text-xs text-gray-500 mt-1">{t.minutes}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white text-[#191C1F] rounded-lg px-2 py-1 md:px-3 md:py-2 min-w-[40px] md:min-w-[60px]">
                      <span className="text-base md:text-2xl font-bold">{formatNumber(timeLeft.seconds)}</span>
                    </div>
                    <p className="text-[8px] md:text-xs text-gray-500 mt-1">{t.seconds}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Button
              asChild
              aria-label='buy now'
              className="w-fit md:w-[180px] md:h-[60px] animate-in text-[12px] md:text-[16px] font-bold fade-in slide-in-from-bottom-5 duration-700 delay-200 rounded-xl mt-2"
              style={{ backgroundColor: 'var(--main-color)' }}
            >
              <Link 
                href={currentAd.link || "/products"} 
                className="flex items-center justify-center gap-2 text-white"
              >
                {t.shopNow}
                <FaArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {/* صورة الإعلان */}
          <div className="mt-4 md:mt-0 w-full md:w-1/2 flex justify-center">
            <Image 
              src={adImageUrl}
              alt={currentAd.name || "Advertisement"}
              className="w-[280px] md:w-[536px] h-[180px] md:h-[424px] object-cover rounded-lg"
              width={536}
              height={424}
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/advs.png";
              }}
            />
          </div>
        </div>

        {/* مؤشرات التقدم (dots) للإعلانات المتعددة */}
        {activeAds.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {activeAds.map((_, index) => (
              <button
                key={index}
                onClick={() => goToAd(index)}
                className={`transition-all duration-300 rounded-full ${
                  currentAdIndex === index
                    ? 'w-6 h-2 bg-main'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`${t.goToAd} ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
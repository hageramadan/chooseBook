// components/Hero.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaArrowLeft } from "react-icons/fa";
import { getSliders, getFullImageUrl } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface Slide {
  id: number;
  image: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

interface HeroProps {
  onLoad?: () => void;
}

//  دالة للحصول على الترجمات حسب اللغة
const getTranslations = (lang: string) => {
  if (lang === 'en') {
    return {
      loadingSlides: "Loading slides...",
      shopNow: "Shop Now",
      showMore:"Show More", 
      noSlides: "No slides available",
      defaultTitle: "Integrated Technology Experience",
      defaultDescription: "Original products from top brands with guaranteed quality you deserve. Discover exclusive offers and fast delivery.",
    };
  }
  // Arabic (default)
  return {
    loadingSlides: "جاري تحميل العروض...",
    shopNow: "تسوق الآن",
    showMore:"المزيد", 
    noSlides: "لا توجد عروض متاحة",
    defaultTitle: "تجربة تقنية متكاملة",
    defaultDescription: "منتجات أصلية من أشهر العلامات التجارية مع ضمان وجودة تستحقها اكتشف عروض حصرية وتوصيل سريع.",
  };
};

// Individual Slider Component with Touch Support
function IndividualSlider({ 
  slides, 
  position,
  startDelay = 0,
  onSlideChange
}: { 
  slides: Slide[]; 
  position: 'left' | 'right';
  startDelay?: number;
  onSlideChange?: (index: number) => void;
}) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // متغيرات السحب باللمس
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSwipingHorizontal = useRef<boolean>(false);
  const isSwiping = useRef<boolean>(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!isAutoPlaying || slides.length === 0) return;

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = (prev + 1) % slides.length;
          onSlideChange?.(next);
          return next;
        });
      }, 4000);
    }, startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, slides.length, startDelay, onSlideChange]);

  const goToNextSlide = () => {
    if (slides.length === 0) return;
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => {
      const next = (prev + 1) % slides.length;
      onSlideChange?.(next);
      return next;
    });
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  const goToPrevSlide = () => {
    if (slides.length === 0) return;
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => {
      const prevSlide = (prev - 1 + slides.length) % slides.length;
      onSlideChange?.(prevSlide);
      return prevSlide;
    });
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  // دوال السحب للموبايل - محسنة
  const handleTouchStart = (e: React.TouchEvent) => {
    // منع التداخل مع الأزرار والروابط
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
    setIsAutoPlaying(false);
    isSwipingHorizontal.current = false;
    isSwiping.current = false;
    setDragProgress(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;
    
    // تحديد الاتجاه - أفقي أم عمودي
    if (!isSwipingHorizontal.current && Math.abs(diffX) > 10) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        isSwipingHorizontal.current = true;
        isSwiping.current = true;
        e.preventDefault();
      }
    }
    
    if (isSwipingHorizontal.current) {
      e.preventDefault();
      const containerWidth = containerRef.current.clientWidth;
      let progress = diffX / containerWidth;
      // تحديد حدود السحب
      progress = Math.min(Math.max(progress, -0.8), 0.8);
      setDragProgress(progress);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) {
      setIsDragging(false);
      setDragProgress(0);
      return;
    }
    
    const minSwipeDistance = 0.15; // 15% عتبة السحب
    
    // فقط إذا كان السحب أفقياً وتجاوز العتبة
    if (isSwipingHorizontal.current && Math.abs(dragProgress) > minSwipeDistance) {
      if (dragProgress < 0) {
        goToNextSlide(); // سحب لليسار -> التالي
      } else if (dragProgress > 0) {
        goToPrevSlide(); // سحب لليمين -> السابق
      }
    }
    
    // إعادة التعيين
    setIsDragging(false);
    setDragProgress(0);
    touchStartX.current = 0;
    touchStartY.current = 0;
    isSwipingHorizontal.current = false;
    isSwiping.current = false;
    
    // استئناف التشغيل التلقائي بعد 10 ثواني
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // دعم السحب بالماوس للحاسوب
  const handleMouseDown = (e: React.MouseEvent) => {
    // منع التداخل مع الأزرار والروابط
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    setIsDragging(true);
    setIsAutoPlaying(false);
    isSwipingHorizontal.current = false;
    isSwiping.current = false;
    setDragProgress(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const currentX = e.clientX;
    const diffX = currentX - touchStartX.current;
    
    if (!isSwipingHorizontal.current && Math.abs(diffX) > 10) {
      isSwipingHorizontal.current = true;
      isSwiping.current = true;
    }
    
    if (isSwipingHorizontal.current) {
      const containerWidth = containerRef.current.clientWidth;
      let progress = diffX / containerWidth;
      progress = Math.min(Math.max(progress, -0.8), 0.8);
      setDragProgress(progress);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) {
      setIsDragging(false);
      setDragProgress(0);
      return;
    }
    
    const minSwipeDistance = 0.15;
    
    if (isSwipingHorizontal.current && Math.abs(dragProgress) > minSwipeDistance) {
      if (dragProgress < 0) {
        goToNextSlide();
      } else if (dragProgress > 0) {
        goToPrevSlide();
      }
    }
    
    setIsDragging(false);
    setDragProgress(0);
    touchStartX.current = 0;
    touchStartY.current = 0;
    isSwipingHorizontal.current = false;
    isSwiping.current = false;
    
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // حساب مؤشرات السلايدات المجاورة
  const getPrevIndex = () => {
    return currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
  };

  const getNextIndex = () => {
    return (currentSlide + 1) % slides.length;
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ 
        touchAction: isDragging && isSwipingHorizontal.current ? 'none' : 'pan-y',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div className="relative w-full h-full">
        {/* السلايد الحالي */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75"
          style={{
            transform: `translateX(${dragProgress * 100}%)`,
            zIndex: 10,
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title || `Slide ${currentSlide + 1}`}
              fill
              loading="eager"
              className="object-cover pointer-events-none"
              priority
              quality={90}
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder-slide.jpg';
              }}
            />
          </div>
        </div>

        {/* السلايد التالي */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75"
          style={{
            transform: `translateX(${dragProgress < 0 ? (100 + dragProgress * 100) : 100}%)`,
            zIndex: dragProgress < 0 ? 15 : 5,
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src={slides[getNextIndex()].image}
              alt={slides[getNextIndex()].title || `Slide ${getNextIndex() + 1}`}
              fill
              className="object-cover pointer-events-none"
              priority={false}
              quality={90}
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder-slide.jpg';
              }}
            />
          </div>
        </div>

        {/* السلايد السابق */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75"
          style={{
            transform: `translateX(${dragProgress > 0 ? (-100 + dragProgress * 100) : -100}%)`,
            zIndex: dragProgress > 0 ? 15 : 5,
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src={slides[getPrevIndex()].image}
              alt={slides[getPrevIndex()].title || `Slide ${getPrevIndex() + 1}`}
              fill
              className="object-cover pointer-events-none"
              priority={false}
              quality={90}
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder-slide.jpg';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero({ onLoad }: HeroProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  const [leftSlides, setLeftSlides] = useState<Slide[]>([]);
  const [rightSlides, setRightSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [centerText, setCenterText] = useState({
    title: t.defaultTitle,
    description: t.defaultDescription
  });

  // ✅ استدعاء onLoad بعد تحميل البيانات
  useEffect(() => {
    if (!loading && !isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
  }, [loading, isDataLoaded, onLoad]);

  // جلب السلايدرات من API
  useEffect(() => {
    const loadSliders = async () => {
      setLoading(true);
      try {
        const slidersData = await getSliders(language);
        
        if (slidersData && slidersData.length > 0) {
          const formattedSlides: Slide[] = slidersData.map((slider: any) => ({
            id: slider.id,
            image: getFullImageUrl(slider.image),
            title: slider.name !== "-" ? slider.name : "",
            description: slider.description || "",
            buttonText: t.shopNow,
            buttonLink: slider.link || "/products"
          }));

          const left = formattedSlides;
          const right = formattedSlides;
          setLeftSlides(left);
          setRightSlides(right);

          if (formattedSlides.length > 0) {
            setCenterText({
              title: formattedSlides[0].title,
              description: formattedSlides[0].description 
            });
          }
        } else {
          setCenterText({
            title: t.defaultTitle,
            description: t.defaultDescription
          });
        }
      } catch (error) {
        console.error('Error loading sliders:', error);
        setCenterText({
          title: t.defaultTitle,
          description: t.defaultDescription
        });
      }
      
      setLoading(false);
    };

    loadSliders();
  }, [language, t.shopNow, t.defaultTitle, t.defaultDescription]);

  // عرض شاشة تحميل
  if (loading) {
    return (
      <section className="container-custom my-4 rounded-[8px] relative w-full min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] lg:min-h-[70vh] overflow-hidden">
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#23A6F0] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  // إذا لم توجد سلايدرات
  if (leftSlides.length === 0 && rightSlides.length === 0) {
    if (!isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
    return <></>;
  }

  return (
    <section className=" relative w-full min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] lg:min-h-[70vh] overflow-hidden">
      
      {/* Slider */}
      <div className="w-full h-full">
        <div className="flex w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh]">
          <div className="w-full h-full relative">
            <IndividualSlider 
              slides={leftSlides} 
              position="left" 
              startDelay={0}
            />
          </div>
        </div>
      </div>

      {/* Overlay gradient - فقط للديكور */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black/40 via-black/10 to-black/40" />

      {/* Fixed Center Text */}
      <div className="container absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-6 pointer-events-none">
        <div className="max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] pointer-events-none">
          <h1 className="text-2xl text-white text-center sm:text-3xl md:text-4xl lg:text-5xl xl:text-[58px] font-bold mb-2 sm:mb-3 md:mb-4  drop-shadow-lg">
            {centerText.title}
          </h1>
          <p className=" w-full text-center  text-white  text-sm sm:text-base md:text-lg lg:text-[20px] mb-4 sm:mb-6 md:mb-8 leading-relaxed drop-shadow-md line-clamp-3">
            {centerText.description}
          </p>
    
          {/* الأزرار - pointer-events-auto للسماح بالنقر */}
          {/* <div className="flex gap-4 pointer-events-auto justify-center">
            <Button
              asChild
              className="text-white text-[14px] sm:text-[16px] font-bold rounded-xl hover:scale-105 transition-transform duration-300"
              style={{
                backgroundColor: "#23A6F0",
                width: "150px",
                height: "45px",
              }}
            >
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 hover:scale-105 cursor-pointer"
              >
                {t.shopNow}
              </Link>
            </Button>

        
          </div> */}
        </div>
      </div>
    </section>
  );
}
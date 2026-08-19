// components/CategoriesSection.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FaArrowRightLong } from "react-icons/fa6";
import { getCategories } from "@/services/api";

interface CategoriesSectionProps {
  onLoad?: () => void;
}


export function CategoriesSection({ onLoad }: CategoriesSectionProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // ✅ استدعاء onLoad بعد تحميل البيانات
  useEffect(() => {
    if (!loading && !isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
  }, [loading, isDataLoaded, onLoad]);

  // استخدام useCallback لتثبيت الدالة
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError("حدث خطأ في تحميل التصنيفات");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // دوال السحب
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollStart(sliderRef.current.scrollLeft);
    sliderRef.current.style.cursor = 'grabbing';
    sliderRef.current.style.userSelect = 'none';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    setScrollStart(sliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollStart - walk;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const x = e.touches[0].pageX;
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollStart - walk;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab';
      sliderRef.current.style.userSelect = 'auto';
    }
  };

  // دوال أزرار التحريك
  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -300 : 300;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // بناء رابط الصورة الكامل
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return "/images/categories/placeholder.jpg";
    if (imagePath.startsWith('/storage')) {
      return `https://admin.ekhtarktabak.com${imagePath}`;
    }
    return imagePath;
  };

  // دالة للحصول على صورة ثابتة لكل قسم بناءً على الاسم (كإحتياطي)
  const getCategoryImage = (categoryName: string, categoryImage?: string): string => {
    // إذا كانت الصورة موجودة في البيانات
    if (categoryImage) {
      return getFullImageUrl(categoryImage);
    }

    // تعيين صور مختلفة حسب اسم القسم (إحتياطي)
    const imageMap: { [key: string]: string } = {
      'الإلكترونيات': '/images/categories/cate1.png',
      'الهواتف الذكية': '/images/categories/cate1.png',
      'أجهزة اللابتوب': '/images/categories/cat2.png',
      'الكمبيوتر': '/images/categories/cat2.png',
      'اكسسوارات': '/images/categories/cate3.png',
      'سماعات': '/images/categories/cate4.png',
    };

    // البحث عن الصورة المناسبة
    for (const [key, value] of Object.entries(imageMap)) {
      if (categoryName.includes(key)) {
        return value;
      }
    }
    
    // صورة افتراضية إذا لم يتم العثور على تطابق
    return '/images/categories/placeholder.jpg';
  };

  if (loading) {
    return (
      <section className="py-8 container mx-auto px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (error) {
    if (!isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
    return (
     <></>
    );
  }

  if (categories.length === 0) {
    if (!isDataLoaded && onLoad) {
      setIsDataLoaded(true);
      onLoad();
    }
    return (
      <></>
    );
  }

  return (
    <section className="py-2 md:py-8">
      <div className="container mx-auto px-4 sm:px-6 relative">
        
        {/* زر السهم الأيمن */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-main rounded-full shadow-lg p-2 md:p-3 hover:bg-main-dark-dark transition-all duration-300 hidden md:block"
          style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateX(50%) translateY(-50%)'
          }}
          aria-label="التمرير لليسار"
        >
          <FaArrowRightLong className="text-white" size={16} />
        </button>

        {/* زر السهم الأيسر */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-main rounded-full shadow-lg p-2 md:p-3 hover:bg-main-dark transition-all duration-300 hidden md:block"
          style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateX(-50%) translateY(-50%)'
          }}
          aria-label="التمرير لليمين"
        >
          <FaArrowLeftLong className="text-white" size={16} />
        </button>

        {/* حاوية السحب الأفقية */}
        <div 
          ref={sliderRef}
          className="overflow-x-auto h-[120px] md:h-[250px] pt-4 md:pt-8 hide-scrollbar"
          style={{ 
            width: '100%',
            overflowY: 'hidden',
            cursor: 'grab',
            WebkitOverflowScrolling: 'touch',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="flex gap-2 md:gap-[26px] justify-start items-center h-full">
            {categories.slice(0, 10).map((category) => (
              <div
                key={category.id}
                className="flex-shrink-0 flex items-center group transition-all duration-300 hover:-translate-y-2"
              >
                <Link href={`/products?categories=[${category.id}]`}>
                  <div className="flex items-center flex-col transition-all w-[100px] md:w-[180px] duration-300 cursor-pointer py-7">
                    <div 
                      className="relative bg-gray-100 flex items-center justify-center overflow-hidden rounded-full h-[80px] md:h-[176px] w-[80px] md:w-[176px] transition-transform duration-300"
                    >
                      <Image
                        src={getCategoryImage(category.name, category.image)}
                        alt={category.name}
                        width={148}
                        height={148}
                        className="object-contain transition-transform duration-500 w-[50px] h-[50px] md:w-[128px] md:h-[128px]"
                        sizes="148px"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/categories/placeholder.jpg";
                        }}
                      />
                    </div>
                    <div className="text-center mt-2 pb-2 w-full">
                      <h3 
                        className="text-[10px] sm:text-[16px] whitespace-nowrap"
                        style={{ color: '#112B40' }}
                      >
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
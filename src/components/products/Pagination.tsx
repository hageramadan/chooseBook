// components/Pagination.tsx
'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  total?: number; // إضافة total اختياري
}

export default function Pagination({ currentPage, lastPage, onPageChange, total }: PaginationProps) {
  const {language}= useTranslation();
  const isEnglish = language === 'en';
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (lastPage <= maxVisible) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(lastPage);
      } else if (currentPage >= lastPage - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = lastPage - 3; i <= lastPage; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(lastPage);
      }
    }
    
    return pages;
  };

  // تنسيق الأرقام بإضافة صفر أمامي إذا كان الرقم أقل من 10
  const formatPageNumber = (page: number) => {
    return page < 10 ? `0${page}` : `${page}`;
  };

  //  التحقق من صحة البيانات
  if (!lastPage || lastPage <= 0) {
    return null;
  }

  // إذا كان هناك صفحة واحدة فقط
  if (lastPage <= 1) {
    return (
      <div className="flex justify-center items-center gap-2 mt-12 mb-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[1E75AB] text-white font-medium">
          {formatPageNumber(1)}
        </div>
      </div>
    );
  }

  //  منع تجاوز الصفحات
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= lastPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-12 mb-4">
     
      
      {/* أزرار التصفح */}
      <div className="flex justify-center items-center gap-2 flex-wrap">
        {/* زر السابق */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#23A6F0]'
          }`}
          aria-label="الصفحة السابقة"
        >
          <ChevronRight  className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                    isEnglish ? 'rotate-180' : ''
                  }`}  />
        </button>
        
        {/* أرقام الصفحات */}
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="w-12 h-12 flex items-center justify-center text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => handlePageChange(page as number)}
              className={`w-12 h-12 rounded-full transition-all duration-200 font-medium ${
                page === currentPage
                  ? 'bg-[#23A6F0] text-white border-2 border-[#23A6F0]'
                  : 'bg-white text-[#23A6F0] border-2 border-gray-300 hover:border-[#23A6F0] hover:bg-gray-50'
              }`}
              aria-label={`الصفحة ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {formatPageNumber(page as number)}
            </button>
          )
        ))}
        
        {/* زر التالي */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center ${
            currentPage === lastPage
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#23A6F0]'
          }`}
          aria-label="الصفحة التالية"
        >
          <ChevronLeft  className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                    isEnglish ? 'rotate-180' : ''
                  }`}  />
        </button>
      </div>
    </div>
  );
}
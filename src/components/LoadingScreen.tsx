// components/LoadingScreen.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let currentProgress = 0;

    const simulateLoading = () => {
      currentProgress += Math.random() * 3 + 1;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
      }
      
      setProgress(Math.min(currentProgress, 100));
    };

    progressInterval = setInterval(simulateLoading, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-1">
        {/* اللوجو */}
         <div className="relative w-32 h-32 lg:w-40 lg:h-40 mx-auto">
          <Image
            src="/logo.png" // ✅ غيري المسار حسب مكان اللوجو عندك
            alt="اللوجو"
            fill
            className="object-contain"
            priority
          />
          {/* <h1 className="text-[32px] lg:text-[64px] text-center font-bold transition-colors  text-[#E60076]">logo</h1> */}
        </div>

        {/* مؤشر التحميل */}
        <div className="flex flex-col items-center space-y-4 w-64">
          {/* <div className="relative w-12 h-12">
            <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin"></div>
          </div> */}
          
          {/* شريط التقدم */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#23A6F0] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* <p className="text-gray-600 text-sm font-medium">
            جاري تحميل البيانات... {Math.round(progress)}%
          </p> */}
        </div>
      </div>
    </div>
  );
};
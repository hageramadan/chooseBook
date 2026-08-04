// app/HomeLoading.tsx
"use client";

export default function HomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#23A6F0] border-r-transparent"></div>
        <p className="mt-4 text-gray-600">جاري تحميل المحتوى...</p>
      </div>
    </div>
  );
}
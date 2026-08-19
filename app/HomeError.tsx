// app/HomeError.tsx
"use client";

import { useRouter } from "next/navigation";

interface HomeErrorProps {
  error: string;
}

export default function HomeError({ error }: HomeErrorProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-red-600 text-xl">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 px-6 py-2 bg-main text-white rounded-lg  hover:bg-main-dark transition"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
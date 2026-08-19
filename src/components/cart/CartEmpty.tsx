// components/cart/CartEmpty.tsx
"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronRight } from "lucide-react";

export function CartEmpty() {
  const { t } = useTranslation();
  
  return (
    <div className="container h-[80vh]">
      <PageHeader title={t('cartEmpty.title')} t={t} />
      
      <div className="text-center rounded-2xl mt-5">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t('cartEmpty.emptyTitle')}
        </h2>
        <p className="text-gray-500 mb-6">
          {t('cartEmpty.emptyMessage')}
        </p>
        <Link
          href="/products"
          className="inline-block bg-main text-white px-8 py-3 rounded-[8px] font-semibold hover:bg-main-dark transition-all duration-300 shadow-md hover:shadow-lg"
        >
          {t('cartEmpty.shopNow')}
        </Link>
      </div>
    </div>
  );
}

const PageHeader = ({ title, t }: { title: string; t: any }) => (
  <div className="page-with-padding">
    <h1 className="text-xl font-bold text-gray-800">{title}</h1>
    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
      <Link href="/" className="hover:text-primary">{t('cartEmpty.home')}</Link>
      <ChevronRight className="w-4 h-4" />
      <span className="text-primary">{title}</span>
    </div>
  </div>
);
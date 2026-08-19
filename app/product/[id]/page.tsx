// app/product/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ProductDetails } from '@/components/products/ProductDetails';
import { 
  getProductById, 
  extractColorsFromProduct, 
  extractSizesFromProduct,
  getFinalPrice,
  getOriginalPrice,
  getDiscountPercentage,
  ProductData 
} from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { YouMayAlsoLike } from '@/components/home/YouMayAlsoLike';
import { CustomerReviews } from '@/components/products/CustomerReviews';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

// تحويل بيانات الـ API إلى الشكل المطلوب للـ ProductDetails
const transformProductData = (apiProduct: ProductData, t: any) => {
  const colors = extractColorsFromProduct(apiProduct);
  const sizes = extractSizesFromProduct(apiProduct);
  const finalPrice = getFinalPrice(apiProduct);
  const originalPrice = getOriginalPrice(apiProduct);
  const discountPercentage = getDiscountPercentage(apiProduct);
  
  // تنظيف رابط الصورة
  const cleanImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.startsWith("/storage")) {
      return `https://admin.ekhtarktabak.com${url}`;
    }
    return url;
  };

  // معالجة الصور
  const processedImages = apiProduct.images?.map(cleanImageUrl) || ["/images/placeholder.jpg"];
  
  // إذا لم يكن هناك ألوان، أضف ألوان افتراضية حسب اللغة
  const finalColors = colors.length > 0 ? colors : [
    { name: t("product.defaultColors.red"), code: 'var(--main-color)' },
    { name: t("product.defaultColors.blue"), code: "#252B42" },
    { name: t("product.defaultColors.green"), code: "#23856D" },
  ];
  
  // إذا لم يكن هناك مقاسات، أضف مقاسات افتراضية
  const finalSizes = sizes.length > 0 ? sizes : ["S", "M", "L", "XL"];
  
  // ✅ تحسين التحقق من التوفر
  let isAvailable = apiProduct.is_active;
  if (apiProduct.has_variants && apiProduct.variants) {
    // إذا كان هناك متغيرات، نتحقق من وجود أي متغير متاح
     // @ts-ignore
    isAvailable = isAvailable && apiProduct.variants.some(v => (v.quantity ?? 0) > 0);
  } else {
    // إذا لم يكن هناك متغيرات، نتحقق من الكمية الرئيسية
    isAvailable = isAvailable && (apiProduct.quantity ?? 0) > 0;
  }
  
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description,
    price: finalPrice,
    originalPrice: originalPrice || undefined,
    discount: discountPercentage || undefined,
    brand: apiProduct.brand?.name || apiProduct.category?.name ,
    category: apiProduct.category?.name || t("product.defaultCategory"),
    images: processedImages,
    colors: finalColors,
    sizes: finalSizes,
    rating: apiProduct.avg_rating || 4.5,
    reviewsCount: apiProduct.total_reviews || 0,
    sku: `SKU-${apiProduct.id}`,
    availability: isAvailable, // ✅ استخدام التحسين الجديد
    variants: apiProduct.variants || [],
    has_variants: apiProduct.has_variants || false,
    video: apiProduct.video || null,
    quantity: apiProduct.quantity || 0, // ✅ إضافة الكمية الرئيسية
  };
};

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation(); //  استخدام hook الترجمة
  const { language } = useLanguage(); //  الحصول على اللغة
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params;
      setProductId(unwrappedParams.id);
    };
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiProduct = await getProductById(productId);
        
        if (apiProduct) {
          const transformedProduct = transformProductData(apiProduct, t);
          setProduct(transformedProduct);
        } else {
          setError(t("product.notFound"));
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(t("product.error"));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, t]);

  if (loading) {
    return (
      <div className="min-h-screen page-with-padding flex items-center justify-center">
        <LoadingSpinner size="lg" text='' />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen page-with-padding flex flex-col items-center justify-center">
        {/* <p className="text-red-500 text-xl mb-4">{error || t("product.notFound")}</p> */}
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-main hover:bg-main-dark text-white px-6 py-2 rounded-[8px]"
        >
          {t("product.backToHome")}
        </button>
      </div>
    );
  }

  return (
    <div className='page-with-padding'>
      <ProductDetails product={product} />
      <CustomerReviews productId={parseInt(productId!)} />
      <YouMayAlsoLike />
    </div>
  );
}
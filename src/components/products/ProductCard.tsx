// src/components/products/ProductCard.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { FaRegStar } from "react-icons/fa";
import { FaStar } from "react-icons/fa6";
import { useFavorites } from "@/hooks/useFavorites";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";

interface ColorOption {
  color: string;
  name: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  href: string;
  originalPrice?: number;
  discount?: number;
  colors?: ColorOption[];
  rating?: number;
  reviewsCount?: number;
  isBestSeller?: boolean;
  variantId?: number | null;
  hasVariants?: boolean;
  variants?: Array<{ id: number }>;
  quantity?: number | null;
}

// دالة للحصول على الترجمات حسب اللغة
const getTranslations = (lang: string) => {
  if (lang === 'en') {
    return {
      loginRequired: "Please login first to add products to favorites",
      errorAdding: "Error adding to favorites",
      bestSeller: "Best Seller",
      addToCart: "Add to Cart",
      removeFromFavorites: "Remove from favorites",
      addToFavorites: "Add to favorites",
      addedToCart: "Product added to cart successfully",
      errorAddingToCart: "Error adding product to cart",
      reviews: "reviews",
      outOfStock: "Out of Stock",
      productUnavailable: "Product is not available",
    };
  }
  // Arabic (default)
  return {
    loginRequired: "يرجى تسجيل الدخول أولاً لإضافة المنتجات إلى المفضلة",
    errorAdding: "حدث خطأ أثناء إضافة المنتج إلى المفضلة",
    bestSeller: "الاكثر طلبا",
    addToCart: "إضافة إلى السلة",
    removeFromFavorites: "إزالة من المفضلة",
    addToFavorites: "إضافة إلى المفضلة",
    addedToCart: "تم إضافة المنتج إلى السلة",
    errorAddingToCart: "حدث خطأ أثناء إضافة المنتج إلى السلة",
    reviews: "تقييمات",
    outOfStock: "نفذ من المخزون",
    productUnavailable: "المنتج نفذ من المخزون",
  };
};

export function ProductCard({ 
  id, 
  name, 
  price, 
  image, 
  hoverImage,
  href,
  originalPrice,
  discount,
  colors = [],
  rating = 0,
  reviewsCount = 0,
  isBestSeller = false,
  variantId = null,
  hasVariants = false,
  variants = [],
  quantity,
}: ProductCardProps) {
  const { language } = useLanguage();
  const { currency, isLoading: currencyLoading } = useCurrency();
  const t = getTranslations(language);
  
  const [isHovered, setIsHovered] = useState(false);
  const [currentImage, setCurrentImage] = useState(image);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLocalMutating, setIsLocalMutating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { isFavorite, toggleFavorite, isLoading } = useFavorites();
  const { addItem, isLoading: cartLoading } = useCartContext();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const isProductFavorite = isFavorite(id);
  const [localFavorite, setLocalFavorite] = useState(isProductFavorite);
  
  // التحقق من التوفر - الكمية null أو undefined أو 0 أو أقل
  const isOutOfStock = quantity === null || quantity === undefined || quantity <= 0;

  // دالة لتوليد نجوم التقييم
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-[#FA8232] w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-[#FA8232] w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-[#77878F] w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />);
      }
    }
    return stars;
  };

  useEffect(() => {
    setLocalFavorite(isProductFavorite);
  }, [isProductFavorite]);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error(t.loginRequired, {
        duration: 3000,
        position: "top-center",
        icon: "❤️",
      });
      
      const currentUrl = window.location.href;
      router.push(`/auth/login?redirectTo=${encodeURIComponent(currentUrl)}`);
      return;
    }
    
    if (isLocalMutating || isLoading) return;
    
    setIsLocalMutating(true);
    const previousState = localFavorite;
    setLocalFavorite(!previousState);
    
    const success = await toggleFavorite(id, previousState);
    
    if (!success) {
      setLocalFavorite(previousState);
      toast.error(t.errorAdding, {
        duration: 3000,
        position: "top-center",
      });
    }
    
    setIsLocalMutating(false);
  }, [id, localFavorite, isLocalMutating, isLoading, toggleFavorite, isAuthenticated, router, t]);

 const handleQuickView = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  // الانتقال إلى صفحة تفاصيل المنتج
  router.push(href);
}, [href, router]);
  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) {
      toast.error(t.productUnavailable, {
        duration: 3000,
        position: "top-center",
      });
      return;
    }
    
    if (isAddingToCart || cartLoading) return;
    
    const productId = parseInt(id);
    const quantityToAdd = 1;
    
    if (hasVariants && variants.length > 0) {
      const firstVariantId = variants[0].id;
      
      setIsAddingToCart(true);
      try {
        await addItem(productId, quantityToAdd, firstVariantId);
      } catch (error) {
        console.error("❌ Error adding to cart:", error);
        toast.error(t.errorAddingToCart, {
          duration: 3000,
          position: "top-center",
        });
      } finally {
        setIsAddingToCart(false);
      }
      return;
    }
    
    setIsAddingToCart(true);
    try {
      const finalVariantId = variantId || null;
      await addItem(productId, quantityToAdd, finalVariantId);
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      toast.error(t.errorAddingToCart, {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsAddingToCart(false);
    }
  }, [id, variantId, hasVariants, variants, isAddingToCart, cartLoading, addItem, isOutOfStock, t]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hoverImage) {
      setCurrentImage(hoverImage);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImage(image);
  };

  return (
    <div
      role="article"
      aria-labelledby={`product-name-${id}`}
      className="group w-full max-w-[340px] sm:max-w-[350px] md:max-w-[308px] lg:max-w-[308px] mx-auto h-auto relative bg-white transition-all duration-300 hover:shadow-lg"
      style={{
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '16px 0',
        overflow: 'hidden',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={href} className="block h-full" aria-label={`عرض تفاصيل ${name}`}>
        {/* Image Container */}
        <div 
          className="relative mx-auto transition-colors duration-300"
          style={{
            borderRadius: '8px',
            padding: '0 16px',
          }}
        >
          {/* Heart Icon - Top Left Corner (موجود في الموبايل ومخفي في الديسكتوب) */}
          <button
            onClick={handleFavoriteClick}
            disabled={isLocalMutating || isLoading}
            className="block md:hidden absolute top-1 left-2 z-10 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-all duration-200 hover:scale-110"
            style={{ color: localFavorite ? '#ef4444' : '#112B40' }}
            aria-label={localFavorite ? t.removeFromFavorites : t.addToFavorites}
            aria-pressed={localFavorite}
          >
            {isLocalMutating ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className="h-4 w-4" fill={localFavorite ? '#ef4444' : 'none'} />
            )}
          </button>

          {/* Best Seller Badge */}
          {isBestSeller && (
            <div className="absolute top-2 right-4 z-10">
              <p className="text-[9px] sm:text-xs font-bold text-white bg-main px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                {t.bestSeller}
              </p>
            </div>
          )}

          {/* Discount Badge */}
          {discount && discount > 0 && (
            <div className="absolute top-10 right-4 z-10">
              <p className="text-[9px] sm:text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                {discount}% OFF
              </p>
            </div>
          )}

          <div className="relative w-full aspect-square">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={currentImage}
              alt={name}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/products/placeholder.png";
              }}
            />
          </div>

          {/* الطبقة المظللة التي تظهر عند hover */}
          {isHovered && (
            <div 
              className="absolute inset-0 rounded-lg transition-colors duration-300 pointer-events-none"
              style={{ backgroundColor: '#0000001A' }}
            />
          )}

          {/* Icons Overlay - appears at bottom center on hover */}
          {isHovered && (
            <div className="absolute bottom-3 left-0 right-0 justify-center -translate-y-1/2 flex gap-2 animate-in fade-in zoom-in-95 pointer-events-auto px-4">
              {/* Eye Icon - Quick View */}
              <button
                onClick={handleQuickView}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-main-dark transition-all duration-200 hover:scale-110"
                style={{ color: '#112B40' }}
                aria-label="معاينة سريعة"
              >
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 hover:text-white" />
              </button>

              {/* Shopping Cart Icon - Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart || cartLoading}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-main-dark transition-all duration-200 hover:scale-110"
                style={{ color: isOutOfStock ? '#999' : '#112B40' }}
                aria-label={isOutOfStock ? t.outOfStock : t.addToCart}
              >
                {isAddingToCart || cartLoading ? (
                  <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 hover:text-white" />
                )}
              </button>

              {/* Heart Icon - Add to Favorites (يظهر فقط في الديسكتوب) */}
              <button
                onClick={handleFavoriteClick}
                disabled={isLocalMutating || isLoading}
                className="bg-white md:block hidden rounded-full p-2 shadow-lg hover:bg-main-dark transition-all duration-200 hover:scale-110"
                style={{ color: localFavorite ? '#ef4444' : '#112B40' }}
                aria-label={localFavorite ? t.removeFromFavorites : t.addToFavorites}
              >
                {isLocalMutating ? (
                  <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 hover:text-white" fill={localFavorite ? '#ef4444' : 'none'} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="px-4 mt-3">
          {/* Rating Section */}
          {/* <div className="flex items-center gap-1 mb-1">
            <div className="flex gap-0.5">
              {renderStars(rating)}
            </div>
            <p className="text-[#77878F] text-[10px] sm:text-xs md:text-sm">({reviewsCount || 0})</p>
          </div> */}

          {/* Product Name */}
          <h3 
            id={`product-name-${id}`}
            className="text-[16px] font-medium line-clamp-2 mb-1" 
            style={{ color: '#112B40' }}
          >
            {name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            {originalPrice && originalPrice > price ? (
              <>
                <span className="text-lg font-bold relative text-primary" >
                  {price.toLocaleString()} <span className="text-xs absolute top-1 me-1">
                    {currencyLoading ? '...' : currency || 'EGP'}
                  </span>
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {originalPrice.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold relative text-primary" >
                {price.toLocaleString()} <span className="text-xs absolute top-1 me-1">
                  {currencyLoading ? '...' : currency || 'EGP'}
                </span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
// components/products/ProductDetails.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Heart,
  Truck,
  RefreshCw,
  Ruler,
  Info,
  HardDrive,
  MemoryStick,
  Play,
  X,
} from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BsShare } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa6";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { FaRegStar } from "react-icons/fa";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
//  إضافة واجهة العملة


interface VariantAttribute {
  id: number;
  attribute_type: {
    id: number;
    name: string;
  };
  value: string;
  meta: {
    color?: string;
  } | null;
}

interface ProductVariant {
  id: number;
  sku: string | null;
  price: number;
  has_discount: boolean;
  discount_type: string | null;
  discount_value: number | null;
  price_after_discount: number;
  quantity: number | null;
  is_active: boolean;
  variant_image: string | null;
  attributes: VariantAttribute[];
}

interface ProductDetailsProps {
  product: {
    id: number;
    avg_rating: number;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    brand: string | null;
    category: string;
    images: string[];
    colors: Array<{ name: string; code: string }>;
    sizes: string[];
    rating: number;
    reviewsCount: number;
    sku: string;
    availability: boolean;
    variants?: ProductVariant[];
    has_variants?: boolean;
    video?: string;
  
    quantity?: number | null; // ✅ إضافة الكمية الرئيسية للمنتج
  };
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { currency, isLoading: currencyLoading } = useCurrency();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedRam, setSelectedRam] = useState("");
  const [selectedHardDisk, setSelectedHardDisk] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "info" | "measurements" | "shipping"
  >("info");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );

  //  حالة عرض الفيديو
  const [showVideo, setShowVideo] = useState(false);

  const videoRef = useRef<HTMLIFrameElement>(null);

  const { addItem, getItemQuantity, isLoading: cartLoading } = useCartContext();
  const { toggleFavorite, isFavorite, isMutating } = useFavorites();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // ✅ دالة للتحقق من توفر المنتج
  // ✅ دالة للتحقق من توفر المنتج
const getAvailableQuantity = (): number => {
  // إذا كان المنتج يحتوي على متغيرات
  if (product.has_variants && product.variants && product.variants.length > 0) {
    // إذا كان هناك متغير محدد، نأخذ الكمية من المتغير
    if (selectedVariant) {
      return selectedVariant.quantity ?? 0;
    }
    // إذا لم يتم اختيار متغير بعد، نبحث عن أول متغير متاح
    const availableVariant = product.variants.find(v => (v.quantity ?? 0) > 0);
    return availableVariant ? (availableVariant.quantity ?? 0) : 0;
  }
  
  // إذا لم يكن هناك متغيرات، نأخذ الكمية من المنتج نفسه
  return product.quantity ?? 0;
};

  // ✅ التحقق من أن المنتج متوفر
 // ✅ التحقق من أن المنتج متوفر
const isProductAvailable = (): boolean => {
  // إذا كان المنتج يحتوي على متغيرات
  if (product.has_variants && product.variants && product.variants.length > 0) {
    // إذا كان هناك متغير محدد، نتحقق من كميته
    if (selectedVariant) {
      return (selectedVariant.quantity ?? 0) > 0;
    }
    // إذا لم يتم اختيار متغير، نتحقق من وجود أي متغير متاح
    return product.variants.some(v => (v.quantity ?? 0) > 0);
  }
  
  // إذا لم يكن هناك متغيرات، نتحقق من الكمية الرئيسية
  return (product.quantity ?? 0) > 0;
};

  // ✅ الحصول على الحد الأقصى للكمية
  // ✅ الحصول على الحد الأقصى للكمية
const getMaxQuantity = (): number => {
  const availableQty = getAvailableQuantity();
  // إذا كانت الكمية غير محدودة (null) أو أكبر من 99، نحدها بـ 99
  if (availableQty === 0) return 0;
  return Math.min(availableQty, 99);
};

  //  استخراج معرف الفيديو من رابط يوتيوب
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    const cleanUrl = url.split("?")[0];

    let videoId = null;

    const shortPattern = /youtu\.be\/([^\/\?]+)/;
    const shortMatch = cleanUrl.match(shortPattern);
    if (shortMatch) {
      videoId = shortMatch[1];
    }

    if (!videoId) {
      const longPattern = /youtube\.com\/watch\?v=([^\/\?&]+)/;
      const longMatch = url.match(longPattern);
      if (longMatch) {
        videoId = longMatch[1];
      }
    }

    if (!videoId) {
      const embedPattern = /youtube\.com\/embed\/([^\/\?]+)/;
      const embedMatch = url.match(embedPattern);
      if (embedMatch) {
        videoId = embedMatch[1];
      }
    }

    return videoId;
  };

  //  الحصول على رابط تضمين الفيديو
  const getEmbedVideoUrl = (videoUrl: string): string | null => {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) {
      return null;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1`;
  };

  //  عرض الفيديو
  const showVideoPlayer = () => {
    if (!product.video) {
      toast.error(t("product.noVideo"));
      return;
    }
    setShowVideo(true);
  };

  //  إخفاء الفيديو والعودة للصورة
  const hideVideoPlayer = () => {
    setShowVideo(false);
    if (videoRef.current) {
      videoRef.current.src = "";
    }
  };

  //  قائمة بجميع الأسماء المحتملة لكل attribute (تدعم العربية والإنجليزية)
  const COLOR_NAMES = ["لون", "اللون", "color", "Color", "colour", "Colour"];
  const RAM_NAMES = ["الذاكرة", "RAM", "ram", "ذاكرة", "memory", "Memory"];
  const HARD_DISK_NAMES = ["هارد ديسك", "Hard disk", "hard disk", "Hard Disk", "هارد", "harddrive", "HardDrive", "storage", "Storage"];

  //  دالة مساعدة لتحويل hex code إلى اسم لون
  const getColorNameFromHex = (hex: string): string => {
    const colorMap: { [key: string]: string } = {
      '#1A23A3': 'أزرق داكن',
      '#B5B7BB': 'رمادي فاتح',
      '#000000': 'أسود',
      '#FFFFFF': 'أبيض',
      '#FF0000': 'أحمر',
      '#00FF00': 'أخضر',
      '#0000FF': 'أزرق',
      '#FFFF00': 'أصفر',
      '#FF00FF': 'وردي',
      '#00FFFF': 'سماوي',
      '#FFA500': 'برتقالي',
      '#800080': 'بنفسجي',
      '#008000': 'أخضر غامق',
      '#808080': 'رمادي',
      '#A52A2A': 'بني',
    };
    
    const upperHex = hex.toUpperCase();
    return colorMap[upperHex] || `لون (${hex})`;
  };

  //  دالة مساعدة للحصول على اسم اللون من attribute
  const getColorDisplayName = (colorAttr: VariantAttribute): string => {
    if (colorAttr.value && colorAttr.value !== "-" && colorAttr.value !== "") {
      return colorAttr.value;
    }
    
    if (colorAttr.meta?.color) {
      if (language === 'ar') {
        return getColorNameFromHex(colorAttr.meta.color);
      }
      return colorAttr.meta.color;
    }
    
    return t("product.unknownColor");
  };

  //  Extract colors from variants
  const getAvailableColorsFromVariants = (): {
    name: string;
    code: string;
    variants: ProductVariant[];
  }[] => {
    if (!product.variants || product.variants.length === 0) {
      return product.colors.map((c) => ({ ...c, variants: [] }));
    }

    const colorMap = new Map<
      string,
      { name: string; code: string; variants: ProductVariant[] }
    >();

    product.variants.forEach((variant) => {
      if (!variant.attributes) return;

      const colorAttr = variant.attributes.find(
        (attr) => COLOR_NAMES.includes(attr.attribute_type?.name)
      );

      if (colorAttr) {
        const colorName = getColorDisplayName(colorAttr);
        const colorCode = colorAttr.meta?.color || "#000000";

        if (!colorMap.has(colorName)) {
          colorMap.set(colorName, {
            name: colorName,
            code: colorCode,
            variants: [],
          });
        }

        colorMap.get(colorName)!.variants.push(variant);
      }
    });

    if (colorMap.size === 0 && product.colors && product.colors.length > 0) {
      return product.colors.map((c) => ({ ...c, variants: [] }));
    }

    return Array.from(colorMap.values());
  };

  //  Get RAM options for selected color
  const getAvailableRamForColor = (colorName: string): string[] => {
    if (!product.variants || product.variants.length === 0) {
      return [];
    }

    const ramOptions = new Set<string>();

    product.variants.forEach((variant) => {
      if (!variant.attributes) return;

      const colorAttr = variant.attributes.find(
        (attr) => COLOR_NAMES.includes(attr.attribute_type?.name)
      );
      
      const ramAttr = variant.attributes.find(
        (attr) => RAM_NAMES.includes(attr.attribute_type?.name)
      );

      if (colorAttr && ramAttr) {
        const colorDisplayName = getColorDisplayName(colorAttr);
        
        if (colorDisplayName === colorName && ramAttr.value && ramAttr.value !== "-") {
          ramOptions.add(ramAttr.value);
        }
      }
    });

    return Array.from(ramOptions);
  };

  //  Get Hard Disk options for selected color and RAM
  const getAvailableHardDiskForColorAndRam = (
    colorName: string,
    ramValue: string,
  ): string[] => {
    if (!product.variants || product.variants.length === 0) {
      return [];
    }

    const hardDiskOptions = new Set<string>();

    product.variants.forEach((variant) => {
      if (!variant.attributes) return;

      const colorAttr = variant.attributes.find(
        (attr) => COLOR_NAMES.includes(attr.attribute_type?.name)
      );
      
      const ramAttr = variant.attributes.find(
        (attr) => RAM_NAMES.includes(attr.attribute_type?.name)
      );
      
      const hardDiskAttr = variant.attributes.find(
        (attr) => HARD_DISK_NAMES.includes(attr.attribute_type?.name)
      );

      if (colorAttr && ramAttr && hardDiskAttr) {
        const colorDisplayName = getColorDisplayName(colorAttr);
        
        if (
          colorDisplayName === colorName &&
          ramAttr.value === ramValue &&
          hardDiskAttr.value &&
          hardDiskAttr.value !== "-"
        ) {
          hardDiskOptions.add(hardDiskAttr.value);
        }
      }
    });

    return Array.from(hardDiskOptions);
  };

  //  Get matching variant
  const getSelectedVariant = (
    colorName: string,
    ramValue: string,
    hardDiskValue: string,
  ): ProductVariant | null => {
    if (!product.variants || product.variants.length === 0) return null;

    const variant = product.variants.find((variant) => {
      if (!variant.attributes) return false;

      const colorAttr = variant.attributes.find(
        (attr) => COLOR_NAMES.includes(attr.attribute_type?.name)
      );
      
      const ramAttr = variant.attributes.find(
        (attr) => RAM_NAMES.includes(attr.attribute_type?.name)
      );
      
      const hardDiskAttr = variant.attributes.find(
        (attr) => HARD_DISK_NAMES.includes(attr.attribute_type?.name)
      );

      if (colorAttr && ramAttr && hardDiskAttr) {
        const colorDisplayName = getColorDisplayName(colorAttr);
        
        return (
          colorDisplayName === colorName &&
          ramAttr.value === ramValue &&
          hardDiskAttr.value === hardDiskValue
        );
      }
      
      return false;
    });

    return variant || null;
  };

  //  Get all available images
  const getAllImages = (): string[] => {
    const images: string[] = [];

    if (selectedVariant && selectedVariant.variant_image) {
      images.push(selectedVariant.variant_image);
    }

    if (product.images && product.images.length > 0) {
      images.push(...product.images);
    }

    return [...new Map(images.map((img) => [img, img])).values()];
  };

  //  Get main image
  const getMainImage = (): string => {
    const allImagesList = getAllImages();

    if (allImagesList.length > 0 && selectedImage < allImagesList.length) {
      return allImagesList[selectedImage];
    }

    return "/images/placeholder.jpg";
  };

  const availableColors = product.has_variants
    ? getAvailableColorsFromVariants()
    : [];
  const availableRam = selectedColor
    ? getAvailableRamForColor(selectedColor)
    : [];
  const availableHardDisk =
    selectedColor && selectedRam
      ? getAvailableHardDiskForColorAndRam(selectedColor, selectedRam)
      : [];

  //  Set first available color
  useEffect(() => {
    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0].name);
    }
  }, [availableColors.length]);

  //  Reset RAM and Hard Disk on color change
  useEffect(() => {
    if (selectedColor) {
      const ramOptions = getAvailableRamForColor(selectedColor);
      if (ramOptions.length > 0) {
        setSelectedRam(ramOptions[0]);
      } else {
        setSelectedRam("");
      }
      setSelectedHardDisk("");
    }
  }, [selectedColor]);

  //  Reset Hard Disk on RAM change
  useEffect(() => {
    if (selectedColor && selectedRam) {
      const hardDiskOptions = getAvailableHardDiskForColorAndRam(
        selectedColor,
        selectedRam,
      );
      if (hardDiskOptions.length > 0) {
        setSelectedHardDisk(hardDiskOptions[0]);
      } else {
        setSelectedHardDisk("");
      }
    }
  }, [selectedRam]);

  //  Update variant
  useEffect(() => {
    if (selectedColor && selectedRam && selectedHardDisk) {
      const variant = getSelectedVariant(
        selectedColor,
        selectedRam,
        selectedHardDisk,
      );
      setSelectedVariant(variant);
      setSelectedImage(0);
      
      // ✅ إعادة تعيين الكمية إلى 1 عند تغيير المتغير
      setQuantity(1);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedColor, selectedRam, selectedHardDisk]);

  //  Current price
  const currentPrice = selectedVariant
    ? selectedVariant.price_after_discount || selectedVariant.price
    : product.price;

  const originalPrice = selectedVariant?.has_discount
    ? selectedVariant.price
    : product.originalPrice;

  const isProductFavorite = isFavorite(product.id.toString());
  const itemInCartQuantity = getItemQuantity(product.id);

  // ✅ التحقق من توفر المنتج
  const availableQty = getAvailableQuantity();
  const maxQty = getMaxQuantity();
  const isAvailable = isProductAvailable();

  //  الحصول على رمز العملة
  const getCurrencySymbol = (): string => {
     return currencyLoading ? '...' : (currency || 'EGP');
  };

  //  Add to cart - معدلة مع التحقق من الكمية
  const handleAddToCart = async () => {
    if (isAddingToCart) return;

    // ✅ التحقق من توفر المنتج
    if (!isAvailable) {
      toast.error(t("product.outOfStock"), {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    if (product.has_variants && !selectedVariant) {
      toast.error(t("product.pleaseSelect"), {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    // ✅ التحقق من أن الكمية المطلوبة لا تتجاوز المتاحة
    if (quantity > maxQty) {
      toast.error(t("product.notEnoughStock").replace('{max}', maxQty.toString()), {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      const variantId = selectedVariant?.id || null;
      const success = await addItem(product.id, quantity, variantId);

      if (success) {
        setQuantity(1);
        // toast.success(t("product.addedToCart"), {
        //   duration: 3000,
        //   position: "top-center",
        // });
      }
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      toast.error(t("product.errorAdding"), {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error(t("product.loginFirst"), {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    await toggleFavorite(product.id.toString(), isProductFavorite);
  };

  // ✅ تحديث دالة زيادة الكمية
  const increaseQuantity = () => {
    if (quantity < maxQty) {
      setQuantity((prev) => prev + 1);
    } else {
      toast.error(t("product.maxQuantity").replace('{max}', maxQty.toString()), {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const cleanImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.startsWith("/storage")) {
      return `https://admin.ekhtarktabak.com${url}`;
    }
    return url;
  };

  const discountAmount = originalPrice ? originalPrice - currentPrice : 0;
  const discountPercentage = originalPrice
    ? Math.round((discountAmount / originalPrice) * 100)
    : 0;

  const allImages = getAllImages();
  const mainImage = getMainImage();

  //  استخراج رابط الفيديو للتضمين
  const embedVideoUrl = product.video ? getEmbedVideoUrl(product.video) : null;

  if (authLoading) {
    return (
      <div className="container-custom py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-[8px] mb-3"></div>
          <div className="h-7 bg-gray-200 rounded-[8px] w-1/3 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded-[8px] w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom">
      {/* Breadcrumb - مترجم */}
      <div className="flex gap-1 mb-2 text-base">
        <Link href="/" className="text-[#726C6C]">
          {t("products.home")}
        </Link>
        <span className="text-[#333333] font-bold">/</span>
        <Link href="/products" className="text-[#726C6C] font-bold text-sm line-clamp-1">
          {product.brand || t("products.title")}
        </Link>
        <span className="text-[#180100] font-bold">/</span>
       <p className="text-[#180100] text-sm  truncate max-w-[200px] lg:max-w-[250px]">
          {product.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-10">
        {/* ===== Images Section ===== */}
        <div className="space-y-1.5 col-span-2">
          <div className="relative h-[200px] md:h-[400px] lg:h-[500px] bg-[#00000033] rounded-[8px] overflow-hidden">
            {/*  إذا كان الفيديو ظاهر، اعرض الفيديو */}
            {showVideo && embedVideoUrl ? (
              <>
                <iframe
                  ref={videoRef}
                  src={embedVideoUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={t("product.videoTitle").replace('{name}', product.name)}
                />
                <button
                  onClick={hideVideoPlayer}
                  className="absolute top-3  start-3 z-20 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all duration-200 border border-white/20 hover:border-white/40"
                  aria-label={t("product.closeVideo")}
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url(${cleanImageUrl(mainImage)})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                
                <div 
                  className="absolute inset-0 w-full h-full z-10"
                  style={{
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.1) 100%)",
                  }}
                />

                {discountPercentage > 0 && (
                  <span className="absolute top-2 right-2 bg-main text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                    {discountPercentage}% {t("product.discount")}
                  </span>
                )}

                {/* ✅ عرض علامة " نفذ من المخزون" إذا كانت الكمية صفر */}
                {/* {!isAvailable && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-t-lg">
                    <p className="text-white text-lg font-bold bg-red-600 px-4 py-2 rounded-lg">
                      {t("product.outOfStock")}
                    </p>
                  </div>
                )} */}

                {product.video && embedVideoUrl && isAvailable && (
                  <button
                    onClick={showVideoPlayer}
                    className="absolute inset-0 z-10 flex items-center justify-center group"
                    aria-label={t("product.playVideo")}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white shadow-lg">
                      <Play className="w-8 h-8 md:w-10 md:h-10 text-[#0A0500] fill-[#0A0500] ml-1" />
                    </div>
                  </button>
                )}
              </>
            )}
          </div>

          {/*  الصور المصغرة - تختفي عند عرض الفيديو */}
          {allImages.length > 1 && !showVideo && (
            <div className="flex gap-1.5">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`
                    relative aspect-[4/3] max-h-[80px] bg-gray-100 rounded-[8px] overflow-hidden
                    border-2 transition-all duration-200
                    ${selectedImage === index ? "border-primary" : "border-transparent hover:border-gray-300"}
                  `}
                >
                  <Image
                    src={cleanImageUrl(image)}
                    alt={`${product.name} - ${t("product.image")} ${index + 1}`}
                    width={2000}
                    height={2000}
                    className="object-cover"
                    sizes="(max-width: 768px) 30vw, 15vw"
                  />
                </button>
              ))}
            </div>
          )}

          {/*  رسالة بدل الصور المصغرة عند عرض الفيديو */}
          {showVideo && (
            <div className="text-center text-sm text-gray-500 py-2">
              <button
                onClick={hideVideoPlayer}
                className="text-primary hover:underline font-medium"
              >
                {t("product.backToImages")}
              </button>
            </div>
          )}
        </div>

        {/* ===== Product Info ===== */}
        <div className="space-y-2 lg:space-y-5 lg:col-span-3">
          {/* Title & Price */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <h1 className="text-lg lg:text-xl font-bold text-[#000000] leading-tight">
                {product.name}
              </h1>
              <span className="text-sm lg:text-base text-[#666666]">
                {product.brand }
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-lg lg:text-xl font-bold text-primary flex items-center gap-0.5">
                {currentPrice.toLocaleString()}
                <span className="text-sm">{getCurrencySymbol()}</span>
              </span>
              {originalPrice && originalPrice !== currentPrice && (
                <span className="text-xs lg:text-base text-[#00000080] line-through flex items-center gap-0.5">
                  {originalPrice.toLocaleString()}
                  <span className="text-[10px]">{getCurrencySymbol()}</span>
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 lg:mt-4">
              {product.reviewsCount > 0 && (
 <div className="flex items-center bg-[#EDF0F8] text-[#3A4980] font-bold text-xs rounded-full px-2 py-0.5 gap-1">
              <IoChatboxEllipsesOutline className="w-3 h-3" />
              <span>{product.reviewsCount}</span>
              <span>{t("product.review")}</span>
            </div>
              )}
           
            {product.avg_rating > 0 && (
              <div className="flex items-center bg-[#FFF5F4] text-[#FA6054] font-bold text-xs rounded-full px-2 py-0.5 gap-1">
                <FaRegStar className="w-2.5 h-2.5" />
                <span>{product.avg_rating}</span>
              </div>
            )}
          </div>

          {/* ===== Color Selection ===== */}
          {product.has_variants && availableColors.length > 0 && (
            <>
              <div>
                <div className="flex justify-between items-center lg:mt-4">
                  <span className="text-sm font-bold text-[#333333]">
                    {t("product.color")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {availableColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`
                        group relative w-7 h-7 rounded-full transition-all duration-200
                        ${selectedColor === color.name ? "ring-2 ring-offset-1 scale-105" : "hover:scale-105"}
                      `}
                      style={{ backgroundColor: color.code }}
                      aria-label={`${t("product.color")} ${color.name}`}
                    >
                      {selectedColor === color.name && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <hr className="my-2" />
            </>
          )}

          {/* ===== RAM Selection ===== */}
          {product.has_variants && availableRam.length > 0 && (
            <div>
              <div className="flex justify-between items-center lg:mt-4">
                <span className="text-sm font-bold text-[#333333] flex items-center gap-1.5">
                  <MemoryStick className="w-3.5 h-3.5" />
                  {t("product.ram")}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableRam.map((ram) => (
                  <button
                    key={ram}
                    onClick={() => setSelectedRam(ram)}
                    className={`
                      flex items-center justify-center rounded-[8px] px-2.5 py-1 text-xs font-medium transition-all duration-200
                      ${
                        selectedRam === ram
                          ? "bg-[#EDF0F8] text-primary border border-primary"
                          : "bg-[#F3F3F3] text-[#726C6C] hover:bg-[#EDF0F8]"
                      }
                    `}
                  >
                    {ram}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== Hard Disk Selection ===== */}
          {product.has_variants && availableHardDisk.length > 0 && (
            <div>
              <div className="flex justify-between items-center mt-2 lg:mt-4">
                <span className="text-sm font-bold text-[#333333] flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  {t("product.hardDisk")}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableHardDisk.map((hardDisk) => (
                  <button
                    key={hardDisk}
                    onClick={() => setSelectedHardDisk(hardDisk)}
                    className={`
                      flex items-center justify-center rounded-[8px] px-2.5 py-1 text-xs font-medium transition-all duration-200
                      ${
                        selectedHardDisk === hardDisk
                          ? "bg-[#EDF0F8] text-primary border border-primary"
                          : "bg-[#F3F3F3] text-[#726C6C] hover:bg-[#EDF0F8]"
                      }
                    `}
                  >
                    {hardDisk}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== Quantity ===== */}
          <div>
            <div className="flex items-center gap-2 lg:mt-4">
              <div className={`flex items-center rounded-full bg-[#F3F3F3] h-9 w-[110px] justify-center ${!isAvailable ? 'opacity-50' : ''}`}>
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || !isAvailable}
                  className="w-6 h-6 flex items-center justify-center text-[#A3A3A3] transition disabled:cursor-not-allowed"
                >
                  <FaMinus className="w-2.5 h-2.5" />
                </button>
                <span className="w-10 text-center text-base font-bold text-[#222222]">
                  {quantity}
                </span>
                <button
                  onClick={increaseQuantity}
                  disabled={quantity >= maxQty || !isAvailable}
                  className="w-6 h-6 flex items-center justify-center text-[#3A4980] font-bold transition disabled:cursor-not-allowed"
                >
                  <FaPlus className="w-2.5 h-2.5 font-bold" />
                </button>
              </div>
              
              {/* ✅ عرض الكمية المتبقية */}
              {isAvailable && maxQty > 0 && maxQty < 10 && (
                <span className="text-xs text-orange-600">
                  {t("product.onlyLeft").replace('{count}', maxQty.toString())}
                </span>
              )}
              
              {/* ✅ عرض " نفذ من المخزون" */}
              {!isAvailable && (
                <span className="text-sm text-red-600 font-bold">
                  {t("product.outOfStock")}
                </span>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-1.5 lg:gap-4 mt-2 lg:mt-4">
            <button
              onClick={handleAddToCart}
              disabled={
                isAddingToCart ||
                cartLoading ||
                !isAvailable ||
                (product.has_variants && !selectedVariant)
              }
              className={`flex-1 text-sm text-white px-4 py-2 rounded-[8px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                ${isAvailable ? 'bg-main hover:bg-main-dark/80' : 'bg-gray-400 cursor-not-allowed'}
              `}
            >
              {isAddingToCart ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("product.adding")}
                </>
              ) : (
                  isAvailable ?t("product.addToCart"):t("product.outOfStock")
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleToggleFavorite}
                disabled={isMutating}
                className={`
                  flex-1 py-2 rounded-[8px] text-primary font-bold transition-all duration-300 flex items-center justify-center gap-2 text-xs
                  ${
                    isProductFavorite
                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      : "border border-primary hover:bg-main-dark/80"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${isProductFavorite?'text-[#ef4444]':'text-primary'}`}
                  fill={isProductFavorite ? "#ef4444" : "none"}
                />
                {isProductFavorite ? t("product.inFavorites") : t("product.addToFavorites")}
              </button>
            </div>
          </div>

          {/* Accordion */}
          <div className="border-t border-gray-200 pt-2 space-y-1.5">
            <div>
              <button
                onClick={() =>
                  setActiveTab(activeTab === "info" ? "shipping" : "info")
                }
                className="flex justify-between items-center w-full py-1.5 text-right"
              >
                <span className="font-semibold text-gray-800 flex items-center gap-1.5 text-sm">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  {t("product.productInfo")}
                </span>
                <span className="text-lg">
                  {activeTab === "info" ? "−" : "+"}
                </span>
              </button>
              {activeTab === "info" && (
                <div className="pt-0.5 pb-1 text-gray-600 text-[11px] leading-relaxed space-y-0.5">
                  <p>{product.description}</p>
                  <p>
                    <strong>{t("product.productCode")}:</strong> {product.sku}
                  </p>
                  <p>
                    <strong>{t("product.category")}:</strong> {product.category}
                  </p>
                  <p>
                    <strong>{t("product.brand")}:</strong> {product.brand }
                  </p>
                  {selectedVariant && (
                    <>
                      <p>
                        <strong>{t("product.ram")}:</strong> {selectedRam}
                      </p>
                      <p>
                        <strong>{t("product.hardDisk")}:</strong> {selectedHardDisk}
                      </p>
                    </>
                  )}
                  {/* ✅ عرض الكمية المتاحة */}
                  <p>
                    <strong>{t("product.availableQuantity")}:</strong> {isAvailable ? maxQty : 0}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
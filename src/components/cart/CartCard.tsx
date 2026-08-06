// components/cart/CartItemCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Heart } from "lucide-react";
import { FaPlus, FaMinus } from "react-icons/fa6";
import toast from "react-hot-toast";
import { CartItemDisplay } from "./CartPage";
import { useFavoritesContext } from "@/contexts/FavoritesContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency"; // ✅ إضافة استيراد useCurrency

interface CartItemCardProps {
  item: CartItemDisplay;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater?: (id: string) => void;
}

// دالة للحصول على اسم العلامة التجارية
const getBrandName = (
  brand: string | { name: string } | null | undefined,
): string => {
  if (!brand) return "";
  if (typeof brand === "string") return brand;
  if (typeof brand === "object" && "name" in brand) return brand.name;
  return "";
};

// دالة للحصول على اللون المناسب للعرض (مع دعم الـ Hex)
const getColorDisplay = (colorName: string, colorHex?: string): string => {
  if (colorHex && colorHex.startsWith("#")) {
    return colorHex;
  }

  const colorMap: Record<string, string> = {
    "ازرق فاتح": "#1e91eb",
    "ازرق داكن": "#252B42",
    بيج: "#bdae8c",
    احمر: "#23A6F0",
    زيتوني: "#a4bfa8",
    رمادي: "#454545",
    بينك: "#d959c6",
    بنكي: "#d959c6",
    اسود: "#000000",
    ابيض: "#ffffff",
    اخضر: "#23856D",
    برتقالي: "#E77C40",
  };
  return colorMap[colorName] || "#cccccc";
};

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const { t } = useTranslation();
  const { currency, isLoading: currencyLoading } = useCurrency(); // ✅ استخدام الـ Hook
  
  // ✅ الحصول على رمز العملة
  const currencySymbol = currencyLoading ? '...' : (currency || 'EGP');
  
  const {
    id,
    productId,
    name,
    brand,
    price,
    originalPrice,
    image,
    color,
    colorHex,
    memory,
    storage,
    size,
    quantity,
    totalPrice,
  } = item;

  const { addFavorite, removeFavorite, isFavorite, isMutating } =
    useFavoritesContext();

  const isProductFavorite = isFavorite(productId);
  const brandName = getBrandName(brand);

  const handleToggleFavorite = async () => {
    if (isMutating) return;

    if (isProductFavorite) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  };

  const handleRemove = () => {
    toast(
      (toastInstance) => (
        <div className="flex flex-col gap-3 p-3" dir="rtl">
          <p className="text-gray-800 text-sm font-medium">
            {t('cart.confirmDelete')}{" "}
            <span className="font-bold text-blue-500">{name}</span> {t('cart.fromCart')}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                toast.dismiss(toastInstance.id);
                onRemove(id);
              }}
              className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-[8px] hover:bg-red-600 transition font-medium"
            >
              {t('cart.yesDelete')}
            </button>
            <button
              onClick={() => toast.dismiss(toastInstance.id)}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-[8px] hover:bg-gray-300 transition font-medium"
            >
              {t('cart.cancel')}
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        style: { maxWidth: "380px", padding: "0", borderRadius: "16px" },
      },
    );
  };

  return (
    <>
      {/* تنسيق الشاشات الكبيرة (md فما فوق) */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#F0EAE9] p-4 hover:shadow-md transition-shadow duration-300">
        <div className="flex gap-4">
          <ProductImageLarge
            id={parseInt(productId)}
            image={image}
            name={name}
          />
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
              <ProductDetailsLarge
                id={parseInt(productId)}
                name={name}
                brand={brandName}
                color={color}
                colorHex={colorHex}
                memory={memory}
                storage={storage}
                size={size}
                t={t}
              />
              <ActionButtonsLarge
                isSaved={isProductFavorite}
                onToggleFavorite={handleToggleFavorite}
                isMutating={isMutating}
                onRemove={handleRemove}
                t={t}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between mt-2 gap-3">
              <ProductPriceLarge
                price={price}
                originalPrice={originalPrice}
                totalPrice={totalPrice}
                quantity={quantity}
                currencySymbol={currencySymbol} // ✅ تمرير رمز العملة
                t={t}
              />
              <QuantityControlLarge
                id={id}
                quantity={quantity}
                onUpdateQuantity={onUpdateQuantity}
              />
            </div>
          </div>
        </div>
      </div>

      {/* تنسيق الموبايل */}
      <div className="md:hidden bg-white rounded-[8px] border border-gray-100 p-2 hover:shadow-md transition-shadow duration-300">
        <div className="flex gap-2">
          <ProductImageMobile
            id={parseInt(productId)}
            image={image}
            name={name}
          />
          <div className="flex-1">
            <div className="flex justify-between items-start gap-1">
              <ProductDetailsMobile
                id={parseInt(productId)}
                name={name}
                brand={brandName}
                color={color}
                colorHex={colorHex}
                memory={memory}
                storage={storage}
                size={size}
                t={t}
              />
              <ActionButtonsMobile
                isSaved={isProductFavorite}
                onToggleFavorite={handleToggleFavorite}
                isMutating={isMutating}
                onRemove={handleRemove}
                t={t}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <ProductPriceMobile
                price={price}
                originalPrice={originalPrice}
                totalPrice={totalPrice}
                quantity={quantity}
                currencySymbol={currencySymbol} // ✅ تمرير رمز العملة
                t={t}
              />
              <QuantityControlMobile
                id={id}
                quantity={quantity}
                onUpdateQuantity={onUpdateQuantity}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ========== مكونات الشاشات الكبيرة ==========

const ProductImageLarge = ({
  id,
  image,
  name,
}: {
  id: number;
  image: string;
  name: string;
}) => {
  const cleanImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.startsWith("/storage")) {
      return `https://admin.ekhtarktabak.com${url}`;
    }
    return url;
  };

  return (
    <Link href={`/product/${id}`} className="flex-shrink-0">
      <div className="w-24 h-24 md:w-[124px] md:h-[150px] bg-gray-100 rounded-[4px] overflow-hidden">
        <Image
          src={cleanImageUrl(image)}
          alt={name}
          width={124}
          height={152}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    </Link>
  );
};

const ProductDetailsLarge = ({
  id,
  name,
  brand,
  color,
  colorHex,
  memory,
  storage,
  size,
  t,
}: {
  id: number;
  name: string;
  brand: string;
  color: string;
  colorHex?: string;
  memory: string;
  storage: string;
  size: string;
  t: any;
}) => {
  const colorCode = getColorDisplay(color, colorHex);

  return (
    <div>
      <Link href={`/product/${id}`}>
        <h1 className="text-lg font-semibold text-gray-800 hover:text-[#23A6F0] transition">
          {name}
        </h1>
      </Link>
      
      <div className="flex flex-col gap-2 mt-2 text-sm">
        {color && color !== "-" && (
          <span className="font-extrabold flex items-center gap-2">
            {t('cart.color')}:
            <span className="text-gray-800 font-normal flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: colorCode }}
              />
              {color}
            </span>
          </span>
        )}
        {!color && colorHex && (
          <span className="font-extrabold flex items-center gap-2">
            {t('cart.color')}:
            <span className="text-gray-800 font-normal flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: colorHex }}
              />
              {t('cart.colorLabel')}
            </span>
          </span>
        )}
        {memory && (
          <span className="font-extrabold">
            {t('cart.memory')}: <span className="text-gray-800 font-normal">{memory}</span>
          </span>
        )}
        {storage && (
          <span className="font-extrabold">
            {t('cart.storage')}: <span className="text-gray-800 font-normal">{storage}</span>
          </span>
        )}
        {size && (
          <span className="font-extrabold">
            {t('cart.size')}: <span className="text-gray-800 font-normal">{size}</span>
          </span>
        )}
      </div>
    </div>
  );
};

const ProductPriceLarge = ({
  price,
  originalPrice,
  totalPrice,
  quantity,
  currencySymbol, // ✅ استقبال رمز العملة
  t,
}: {
  price: number;
  originalPrice?: number;
  totalPrice: number;
  quantity: number;
  currencySymbol: string; // ✅ إضافة النوع
  t: any;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      {originalPrice && originalPrice > price && (
        <span className="text-sm text-gray-400 line-through">
          {originalPrice.toLocaleString()} {currencySymbol} {/* ✅ استخدام رمز العملة */}
        </span>
      )}
      <div className="text-xs text-gray-500">
        {price.toLocaleString()} {currencySymbol} / {t('cart.perItem')} {/* ✅ استخدام رمز العملة */}
      </div>
    </div>
    <div className="flex items-center gap-0.5">
      <span className="text-lg font-bold text-[#23A6F0]">
        {totalPrice.toLocaleString()} {currencySymbol} {/* ✅ استخدام رمز العملة */}
      </span>
      <span className="text-xs text-gray-400">({t('cart.total')})</span>
    </div>
  </div>
);

const QuantityControlLarge = ({
  id,
  quantity,
  onUpdateQuantity,
}: {
  id: string;
  quantity: number;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}) => (
  <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
    <button
      onClick={() => onUpdateQuantity(id, quantity - 1)}
      disabled={quantity <= 1}
      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#23A6F0] transition rounded-full hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FaMinus className="w-3 h-3" />
    </button>
    <span className="w-8 text-center font-semibold text-gray-800">
      {quantity}
    </span>
    <button
      onClick={() => onUpdateQuantity(id, quantity + 1)}
      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#23A6F0] transition rounded-full hover:bg-white"
    >
      <FaPlus className="w-3 h-3" />
    </button>
  </div>
);

const ActionButtonsLarge = ({
  isSaved,
  onToggleFavorite,
  isMutating,
  onRemove,
  t,
}: {
  isSaved: boolean;
  onToggleFavorite: () => void;
  isMutating: boolean;
  onRemove: () => void;
  t: any;
}) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onToggleFavorite}
      disabled={isMutating}
      className={`flex items-center gap-1 text-sm transition disabled:opacity-50 ${
        isSaved
          ? "text-[#c41f1c] hover:text-[#c41f1c]"
          : "text-[#180100] hover:text-[#c41f1c]"
      }`}
    >
      <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
      <span>{isSaved ? t('cart.removeFromFavorites') : t('cart.save')}</span>
    </button>
    <span className="text-gray-300">|</span>
    <button
      onClick={onRemove}
      className="flex items-center gap-1 text-sm text-[#180100] hover:text-red-500 transition"
    >
      <Trash2 className="w-4 h-4" />
      <span>{t('cart.delete')}</span>
    </button>
  </div>
);

// ========== مكونات الموبايل ==========

const ProductImageMobile = ({
  id,
  image,
  name,
}: {
  id: number;
  image: string;
  name: string;
}) => {
  const cleanImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.startsWith("/storage")) {
      return `https://admin.ekhtarktabak.com${url}`;
    }
    return url;
  };

  return (
    <Link href={`/product/${id}`} className="flex-shrink-0">
      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
        <Image
          src={cleanImageUrl(image)}
          alt={name}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      </div>
    </Link>
  );
};

const ProductDetailsMobile = ({
  id,
  name,
  brand,
  color,
  colorHex,
  memory,
  storage,
  size,
  t,
}: {
  id: number;
  name: string;
  brand: string;
  color: string;
  colorHex?: string;
  memory: string;
  storage: string;
  size: string;
  t: any;
}) => {
  const colorCode = getColorDisplay(color, colorHex);

  return (
    <div className="flex-1">
      <Link href={`/product/${id}`}>
        <h1 className="text-sm font-semibold text-gray-800 hover:text-[#23A6F0] transition line-clamp-1">
          {name}
        </h1>
      </Link>
      {brand && <p className="text-xs text-gray-500">{brand}</p>}
      <div className="flex flex-wrap gap-1 mt-0.5 text-xs text-gray-600 items-center">
        {color && color !== "-" && (
          <span className="font-extrabold flex items-center gap-2">
            {t('cart.color')}:
            <span className="text-gray-800 font-normal flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: colorCode }}
              />
              {color}
            </span>
          </span>
        )}
        {!color && colorHex && (
          <span className="font-extrabold flex items-center gap-2">
            {t('cart.color')}:
            <span className="text-gray-800 font-normal flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: colorHex }}
              />
              {t('cart.colorLabel')}
            </span>
          </span>
        )}
        {memory && (
          <>
            <span className="text-gray-300">|</span>
            <span>{t('cart.memory')}: {memory}</span>
          </>
        )}
        {storage && (
          <>
            <span className="text-gray-300">|</span>
            <span>{t('cart.storage')}: {storage}</span>
          </>
        )}
        {size && (
          <>
            <span className="text-gray-300">|</span>
            <span>{size}</span>
          </>
        )}
      </div>
    </div>
  );
};

const ProductPriceMobile = ({
  price,
  originalPrice,
  totalPrice,
  quantity,
  currencySymbol, // ✅ استقبال رمز العملة
  t,
}: {
  price: number;
  originalPrice?: number;
  totalPrice: number;
  quantity: number;
  currencySymbol: string; // ✅ إضافة النوع
  t: any;
}) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-1.5">
      {originalPrice && originalPrice > price && (
        <span className="text-[10px] text-gray-400 line-through">
          {originalPrice.toLocaleString()} {currencySymbol} {/* ✅ استخدام رمز العملة */}
        </span>
      )}
      <div className="text-[9px] text-gray-400">
        {price.toLocaleString()} {currencySymbol} / {t('cart.perItem')} {/* ✅ استخدام رمز العملة */}
      </div>
    </div>
    <span className="text-sm font-bold text-[#23A6F0]">
      {totalPrice.toLocaleString()} {currencySymbol} {/* ✅ استخدام رمز العملة */}
    </span>
  </div>
);

const QuantityControlMobile = ({
  id,
  quantity,
  onUpdateQuantity,
}: {
  id: string;
  quantity: number;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}) => (
  <div className="flex items-center gap-0.5 bg-gray-200 rounded-full">
    <button
      onClick={() => onUpdateQuantity(id, quantity - 1)}
      disabled={quantity <= 1}
      className={`w-6 h-6 flex items-center justify-center rounded-full transition ${
        quantity <= 1 ? "text-gray-300" : "text-gray-600 hover:text-[#23A6F0]"
      }`}
    >
      <FaMinus className="w-2 h-2" />
    </button>
    <span className="w-5 text-center text-xs font-semibold text-gray-800">
      {quantity}
    </span>
    <button
      onClick={() => onUpdateQuantity(id, quantity + 1)}
      className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-[#23A6F0] transition rounded-full"
    >
      <FaPlus className="w-2 h-2" />
    </button>
  </div>
);

const ActionButtonsMobile = ({
  isSaved,
  onToggleFavorite,
  isMutating,
  onRemove,
  t,
}: {
  isSaved: boolean;
  onToggleFavorite: () => void;
  isMutating: boolean;
  onRemove: () => void;
  t: any;
}) => (
  <div className="flex items-end gap-1.5">
    <button
      onClick={onToggleFavorite}
      disabled={isMutating}
      className={`flex items-center gap-0.5 text-xs transition disabled:opacity-50 ${
        isSaved ? "text-[#23A6F0]" : "text-gray-400 hover:text-[#23A6F0]"
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
      <span>{isSaved ? t('cart.remove') : t('cart.save')}</span>
    </button>
    <button
      onClick={onRemove}
      className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-red-500 transition"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>{t('cart.delete')}</span>
    </button>
  </div>
);
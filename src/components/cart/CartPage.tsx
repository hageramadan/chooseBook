// components/cart/CartPage.tsx
"use client";

import { useState, useEffect } from "react";
import { CartItemCard } from "./CartCard";
import { CartSummary } from "./CartSummary";
import { CartEmpty } from "./CartEmpty";
import { useCartContext } from "@/contexts/CartContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export interface Ibrand {
  id: number;
  name: string;
}

export interface CartItemDisplay {
  id: string;
  productId: string;
  name: string;
  brand: Ibrand;
  price: number;
  originalPrice?: number;
  image: string;
  variantImage?: string | null;
  productImage?: string; 
  color: string;
  colorHex?: string;
  memory: string;    
  storage: string;
  size: string;
  quantity: number;
  discount?: number;
  totalPrice: number;
}

export function CartPage() {
  const { t } = useTranslation();
  const { cart, isLoading, updateQuantity, removeItem, refetchCart, isGuest } = useCartContext();
  const [cartItems, setCartItems] = useState<CartItemDisplay[]>([]);

  const itemsCount = cart?.items?.length || 0;

  const extractAttributes = (variant: any) => {
    let color = "";
    let colorHex = "";
    let memory = "";
    let storage = "";
    let size = "";
    
    if (variant && variant.attributes && Array.isArray(variant.attributes)) {
      for (const attr of variant.attributes) {
        const attrName = attr.attribute_type?.name;
        const attrValue = attr.value || "";
        
        const isValidValue = (val: string) => val && val !== "-" && val.trim() !== "";
        
        if (attrName === "لون" || attrName === "اللون") {
          if (isValidValue(attrValue)) {
            color = attrValue;
          } else {
            if (attr.meta?.color) {
              color = t('cart.colorLabel');
              colorHex = attr.meta.color;
            }
          }
          if (attr.meta?.color) {
            colorHex = attr.meta.color;
          }
        } 
        else if (attrName === "الذاكرة" || attrName === "الرام") {
          if (isValidValue(attrValue)) {
            memory = attrValue;
          }
        } 
        else if (attrName === "هارد ديسك" || attrName === "التخزين" || attrName === "المساحة") {
          if (isValidValue(attrValue)) {
            storage = attrValue;
          }
        } 
        else if (attrName === "مقاس" || attrName === "المقاس") {
          if (isValidValue(attrValue)) {
            size = attrValue;
          }
        }
      }
    }
    
    return { color, colorHex, memory, storage, size };
  };

  const getBrandObject = (product: any): Ibrand => {
    if (product.brand && typeof product.brand === 'object' && product.brand.id && product.brand.name) {
      return {
        id: product.brand.id,
        name: product.brand.name
      };
    }
    if (product.brand && typeof product.brand === 'string') {
      return {
        id: 0,
        name: product.brand
      };
    }
    return {
      id: 0,
      name: t('cartPage.defaultBrand')
    };
  };

  const cleanImageUrl = (url: string | null | undefined) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.startsWith("/storage")) {
      return `https://alfareed.admin.t-carts.com${url}`;
    }
    return url;
  };

  useEffect(() => {
    if (cart && cart.items && cart.items.length > 0) {
      const transformedItems: CartItemDisplay[] = cart.items.map((item) => {
        const { color, colorHex, memory, storage, size } = extractAttributes(item.variant);
        
        const variantImage = item.variant?.variant_image || null;
        const productMainImage = item.product.images?.[0] || "";
        const displayImage = variantImage || productMainImage;
        
        let originalPrice: number | undefined = undefined;
        
        if (item.variant?.has_discount) {
          originalPrice = item.variant.price;
        } 
        else if (item.product.pricing?.has_discount) {
          originalPrice = item.product.pricing.price;
        }
        
        return {
          id: item.id.toString(),
          productId: item.product.id.toString(),
          name: item.product.name,
          brand: getBrandObject(item.product),
          price: item.final_price,
          originalPrice: originalPrice,
          image: cleanImageUrl(displayImage),
          variantImage: variantImage ? cleanImageUrl(variantImage) : null,
          productImage: cleanImageUrl(productMainImage),
          color: color,
          colorHex: colorHex,
          memory: memory,
          storage: storage,
          size: size,
          quantity: item.quantity,
          discount: item.discount_amount || undefined,
          totalPrice: item.total_price,
        };
      });
      
      setCartItems(transformedItems);
    } else {
      setCartItems([]);
    }
  }, [cart, t]);

  const subtotal = cart?.subtotal || 0;
  const totalDiscount = cart?.discount_amount || 0;
  const deliveryFee = cart?.delivery_fee || 0;
  const total = cart?.total_amount || 0;
  
  const promoDiscount = cart?.coupon_discount || 0;
  const promoCode = cart?.applied_coupon_code || "";

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(parseInt(cartItemId), newQuantity);
  };

  const handleRemoveItem = async (cartItemId: string) => {
    await removeItem(parseInt(cartItemId));
  };

  const saveForLater = (id: string) => {};

  const applyPromoCode = async (code: string, discount: number) => {
    await refetchCart();
  };

  const removePromoCode = async () => {
    await refetchCart();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('cartPage.loading')} />
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="bg-gradient-to-l min-h-[80vh] from-[#bdcbf12a] to-[#feecea3b]">
      <div className="container page-with-padding">
        <PageHeader title={t('cartPage.title')} itemCount={itemsCount} t={t} />

        <div className="grid grid-cols-1 lg:grid-cols-3 md:gap-8 gap-4">
          <div className="lg:col-span-2 space-y-4 bg-white rounded-[16px] px-1 py-2 lg:p-4 mb-5">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                onSaveForLater={saveForLater}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            <CartSummary
              subtotal={subtotal}
              totalDiscount={totalDiscount}
              promoDiscount={promoDiscount}
              promoCode={promoCode}
              deliveryFee={deliveryFee}
              total={total}
              onApplyPromoCode={applyPromoCode}
              onRemovePromoCode={removePromoCode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const PageHeader = ({ title, itemCount, t }: { title: string; itemCount: number; t: any }) => (
  <div className="mb-8">
    <h1 className="text-lg lg:text-xl font-bold text-gray-800">{title}</h1>
    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
      <Link href="/" className="hover:text-[#23A6F0]">{t('cartPage.home')}</Link>
      <ChevronRight className="w-4 h-4" />
      <span className="text-[#23A6F0]">{title}</span>
      <span className="text-gray-400">({itemCount} {t('cartPage.products')})</span>
    </div>
  </div>
);
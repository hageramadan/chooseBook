"use client";

import { MapPin, Truck } from "lucide-react";
import { DeliveryMethodFormProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";

export default function DeliveryMethodForm({ 
  deliveryMethod, 
  onDeliveryMethodChange 
}: DeliveryMethodFormProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        {t('checkout.deliveryMethod')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label
          className={`flex items-center gap-3 p-4 border rounded-[8px] cursor-pointer transition ${
            deliveryMethod === "pickup"
              ? "border-[#23A6F0] bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            checked={deliveryMethod === "pickup"}
            onChange={() => onDeliveryMethodChange("pickup")}
            className="w-4 h-4 text-[#23A6F0] focus:ring-[#23A6F0]"
          />
          <MapPin className="w-5 h-5 text-gray-600" />
          <div>
            <p className="font-medium text-gray-800">{t('checkout.pickup')}</p>
          </div>
        </label>
        
        <label
          className={`flex items-center gap-3 p-4 border rounded-[8px] cursor-pointer transition ${
            deliveryMethod === "delivery"
              ? "border-[#23A6F0] bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            checked={deliveryMethod === "delivery"}
            onChange={() => onDeliveryMethodChange("delivery")}
            className="w-4 h-4 text-[#23A6F0] focus:ring-[#23A6F0]"
          />
          <Truck className="w-5 h-5 text-gray-600" />
          <div>
            <p className="font-medium text-gray-800">{t('checkout.delivery')}</p>
          </div>
        </label>
      </div>
    </div>
  );
}
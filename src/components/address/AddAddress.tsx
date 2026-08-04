"use client";

import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import toast, { Toaster } from "react-hot-toast";
import { FaHome, FaBriefcase, FaMapMarkerAlt } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationMap from "./LocationMap";
import { Address } from "@/types/address";
import { useTranslation } from "@/hooks/useTranslation";
import { getHeaders } from "@/services/api";

// تعريف نوع العنوان باللغة الإنجليزية
type AddressTypeValue = "home" | "work" | "other";

interface AddAddressProps {
  onClose: () => void;
  onSave: (address: any) => void;
  initialData?: Address;
  isEditing?: boolean;
}

interface Governorate {
  id: string;
  name: string;
  provider: string;
}

interface City {
  id: string;
  name: string;
  provider: string;
  delivery_fee: number;
}

export default function AddAddress({
  onClose,
  onSave,
  initialData,
  isEditing,
}: AddAddressProps) {
  const { t } = useTranslation();
  
  // تحويل القيمة المخزنة من العربية إلى الإنجليزية إذا وجدت
  const getInitialAddressType = (type?: string): AddressTypeValue => {
    if (type === "home" || type === "work" || type === "other")
      return type as AddressTypeValue;
    if (type === "المنزل") return "home";
    if (type === "الدوام" || type === "العمل") return "work";
    if (type === "اخرى") return "other";
    return "home";
  };

  // إعداد البيانات الأولية من initialData (بيانات التعديل)
  const getInitialFormData = () => {
    if (initialData && isEditing) {
      return {
        street: initialData.street || "",
        city: initialData.city?.name || "",
        cityId: initialData.city?.id?.toString() || "",
        governorateId: initialData.city?.governate?.id?.toString() || "",
        governorate: initialData.city?.governate?.name || "",
        building: initialData.building || "",
        apartmentNumber: initialData.apartment || "",
        floor: initialData.floor || "",
        addressType: getInitialAddressType(initialData.type),
        saveForFuture: true,
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      };
    }
    return {
      street: "",
      city: "",
      cityId: "",
      governorateId: "",
      governorate: "",
      building: "",
      apartmentNumber: "",
      floor: "",
      addressType: "home" as AddressTypeValue,
      saveForFuture: true,
      latitude: null,
      longitude: null,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState<{
    street?: string;
    city?: string;
    governorate?: string;
    building?: string;
    apartment?: string;
    floor?: string;
    addressType?: string;
  }>({});

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    city?: string;
    governorate?: string;
  } | null>(
    initialData?.latitude && initialData?.longitude && isEditing
      ? {
          lat: parseFloat(initialData.latitude),
          lng: parseFloat(initialData.longitude),
          address: initialData.street || "",
          city: initialData.city?.name,
          governorate: initialData.city?.governate?.name,
        }
      : null,
  );

  const [isExtracting, setIsExtracting] = useState(false);

  // --- حالات جديدة للـ API ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const API_URL = "https://alfareed.admin.t-carts.com/api";

  // --- جلب المحافظات من الـ API ---
  useEffect(() => {
    const fetchGovernorates = async () => {
      setIsLoadingGovernorates(true);
      try {
        const token = localStorage.getItem("auth_token");

        const response = await fetch(`${API_URL}/governates`, {
          headers: getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (
          result.result === true &&
          result.data &&
          Array.isArray(result.data.governates)
        ) {
          setGovernorates(result.data.governates);
        } else {
          setGovernorates([]);
        }
      } catch (error) {
        console.error("❌ خطأ في جلب المحافظات:", error);
        toast.error(t('address.errorLoadingGovernorates'));
      } finally {
        setIsLoadingGovernorates(false);
      }
    };

    fetchGovernorates();
  }, [t]);

  // --- جلب المدن عند اختيار المحافظة ---
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.governorateId) {
        setCities([]);
        return;
      }

      setIsLoadingCities(true);
      try {
        const token = localStorage.getItem("auth_token");

        const response = await fetch(`${API_URL}/governates/${formData.governorateId}/cities`, {
          headers: getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.result === true && Array.isArray(result.data)) {
          setCities(result.data);
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error("❌ خطأ في جلب المدن:", error);
        toast.error(t('address.errorLoadingCities'));
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, [formData.governorateId, t]);

  //  عند التعديل، تعيين المحافظة والمدينة المناسبة (مع التحقق من وجود governate)
  useEffect(() => {
    if (isEditing && initialData?.city) {
      const updates: any = {};
      
      if (initialData.city.id) {
        updates.cityId = initialData.city.id.toString();
        updates.city = initialData.city.name || "";
      }
      
      if (initialData.city.governate) {
        updates.governorateId = initialData.city.governate.id?.toString() || "";
        updates.governorate = initialData.city.governate.name || "";
      }
      
      updates.street = initialData.street || "";
      updates.building = initialData.building || "";
      updates.apartmentNumber = initialData.apartment || "";
      updates.floor = initialData.floor || "";
      updates.addressType = getInitialAddressType(initialData.type);
      updates.latitude = initialData.latitude;
      updates.longitude = initialData.longitude;
      
      setFormData(prev => ({
        ...prev,
        ...updates,
      }));
    }
  }, [isEditing, initialData]);

  // دالة لعرض النص العربي للمستخدم
  const getAddressTypeDisplay = (type: AddressTypeValue): string => {
    switch (type) {
      case "home":
        return t('address.home');
      case "work":
        return t('address.work');
      case "other":
        return t('address.other');
      default:
        return t('address.home');
    }
  };

  // دالة للحصول على الأيقونة المناسبة
  const getAddressTypeIcon = (type: AddressTypeValue) => {
    switch (type) {
      case "home":
        return <FaHome className="inline ml-1" />;
      case "work":
        return <FaBriefcase className="inline ml-1" />;
      case "other":
        return <FaMapMarkerAlt className="inline ml-1" />;
      default:
        return <FaHome className="inline ml-1" />;
    }
  };

  // دالة التحقق من صحة الحقول
  const validateForm = (): boolean => {
    const newErrors: {
      street?: string;
      city?: string;
      governorate?: string;
      building?: string;
      apartment?: string;
      floor?: string;
      addressType?: string;
    } = {};

    if (!formData.street.trim()) {
      newErrors.street = t('address.streetRequired');
    } else if (formData.street.trim().length < 5) {
      newErrors.street = t('address.streetTooShort');
    }

    if (!formData.governorateId) {
      newErrors.governorate = t('address.selectGovernorate');
    }

    if (!formData.cityId) {
      newErrors.city = t('address.selectCity');
    }

    if (!formData.building.trim()) {
      newErrors.building = t('address.buildingRequired');
    }

    if (!formData.apartmentNumber.trim()) {
      newErrors.apartment = t('address.apartmentRequired');
    }

    if (!formData.floor.trim()) {
      newErrors.floor = t('address.floorRequired');
    }

    if (!formData.addressType) {
      newErrors.addressType = t('address.addressTypeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLocationSelect = async (location: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    setIsExtracting(true);

    const { city, governorate } = await reverseGeocode(
      location.lat,
      location.lng,
    );
    setIsExtracting(false);

    const foundGovernorate = governorates.find(
      (gov) => gov.name === governorate
    );
    const foundCity = cities.find(
      (c) => c.name === city
    );

    setSelectedLocation({
      ...location,
      city,
      governorate,
    });

    setFormData((prev) => ({
      ...prev,
      street: location.address,
      latitude: location.lat.toString(),
      longitude: location.lng.toString(),
      city: city || prev.city,
      cityId: foundCity?.id?.toString() || prev.cityId,
      governorate: governorate || prev.governorate,
      governorateId: foundGovernorate?.id?.toString() || prev.governorateId,
    }));
  };

  const reverseGeocode = async (
    lat: number,
    lng: number,
  ): Promise<{ city: string; governorate: string }> => {
    let city = "";
    let governorate = "";

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`,
      );
      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        if (address.state) governorate = address.state;
        else if (address.province) governorate = address.province;
        else if (address.region) governorate = address.region;

        if (address.city) city = address.city;
        else if (address.town) city = address.town;
        else if (address.village) city = address.village;
        else if (address.suburb) city = address.suburb;

        governorate = governorate.replace("محافظة ", "");
        city = city.replace("مدينة ", "");
      }
    } catch (error) {
      console.error("❌ خطأ في استخراج الموقع:", error);
    }

    return { city, governorate };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }

    setIsSubmitting(true);

    try {
      const addressData = {
        city_id: formData.cityId,
        street: formData.street,
        building: formData.building,
        floor: formData.floor,
        apartment: formData.apartmentNumber,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        type: formData.addressType,
      };

      const token = localStorage.getItem("auth_token");

      let url = `${API_URL}/addresses`;
      let method = "POST";

      if (isEditing && initialData?.id) {
        url = `${API_URL}/addresses/${initialData.id}/update`;
        method = "POST";
        (addressData as any)._method = "put";
      }

      const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(addressData),
      });

      const result = await response.json();

      if (result.result === true) {
        toast.success(
          isEditing ? t('address.addressUpdated') : t('address.addressAdded'),
        );
        onSave(result.data);
        onClose();
      } else {
        if (result.errNum === 422 && result.data) {
          const errorMessages = Object.values(result.data).flat();
          throw new Error(errorMessages.join(", "));
        }
        throw new Error(result.message || t('address.saveError'));
      }
    } catch (error) {
      console.error("❌ خطأ في حفظ العنوان:", error);
      toast.error(
        error instanceof Error ? error.message : t('address.saveError'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingGovernorates) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('address.loadingGovernorates')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? t('address.editAddress') : t('address.addNewAddress')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
            >
              <IoClose size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-1/2 space-y-5 order-2 md:order-1">
                {/* عنوان التوصيل */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    {t('address.streetLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => {
                      setFormData({ ...formData, street: e.target.value });
                      clearFieldError("street");
                    }}
                    placeholder={t('address.streetPlaceholder')}
                    className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none ${
                      errors.street ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.street && (
                    <p className="text-red-500 text-xs mt-1">{errors.street}</p>
                  )}
                </div>

                {/* المحافظة والمدينة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      {t('address.governorate')} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.governorateId || ""}
                      onValueChange={(value) => {
                        const selectedValue = value || "";
                        const selectedGov = governorates.find(
                          (gov) => gov.id.toString() === selectedValue
                        );
                        setFormData({
                          ...formData,
                          governorateId: selectedValue,
                          governorate: selectedGov?.name || "",
                          cityId: "",
                          city: "",
                        });
                        clearFieldError("governorate");
                      }}
                    >
                      <SelectTrigger
                        className={`w-full ${errors.governorate ? "border-red-500" : ""}`}
                      >
                        <SelectValue>
                          {formData.governorate || t('address.selectGovernorate')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {governorates.map((gov) => (
                          <SelectItem key={gov.id} value={gov.id.toString()}>
                            {gov.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.governorate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.governorate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      {t('address.city')} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.cityId || ""}
                      onValueChange={(value) => {
                        const selectedValue = value || "";
                        const selectedCity = cities.find(
                          (city) => city.id.toString() === selectedValue
                        );
                        setFormData({
                          ...formData,
                          cityId: selectedValue,
                          city: selectedCity?.name || "",
                        });
                        clearFieldError("city");
                      }}
                      disabled={!formData.governorateId || isLoadingCities}
                    >
                      <SelectTrigger
                        className={`w-full ${errors.city ? "border-red-500" : ""}`}
                      >
                        <SelectValue>
                          {formData.city || (
                            !formData.governorateId
                              ? t('address.selectGovernorateFirst')
                              : isLoadingCities
                              ? t('address.loading')
                              : t('address.selectCity')
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCities ? (
                          <div className="p-4 text-center text-gray-500">
                            {t('address.loadingCities')}
                          </div>
                        ) : cities.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            {t('address.noCitiesAvailable')}
                          </div>
                        ) : (
                          cities.map((city) => (
                            <SelectItem key={city.id} value={city.id.toString()}>
                              <div className="flex justify-between items-center w-full">
                                <span>{city.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>
                </div>

                {/* اسم المبنى */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    {t('address.building')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => {
                      setFormData({ ...formData, building: e.target.value });
                      clearFieldError("building");
                    }}
                    placeholder={t('address.buildingPlaceholder')}
                    className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none ${
                      errors.building ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.building && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.building}
                    </p>
                  )}
                </div>

                {/* رقم الشقة ورقم الدور */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      {t('address.apartment')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.apartmentNumber}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          apartmentNumber: e.target.value,
                        });
                        clearFieldError("apartment");
                      }}
                      placeholder={t('address.apartmentPlaceholder')}
                      className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none ${
                        errors.apartment ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.apartment && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.apartment}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      {t('address.floor')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.floor}
                      onChange={(e) => {
                        setFormData({ ...formData, floor: e.target.value });
                        clearFieldError("floor");
                      }}
                      placeholder={t('address.floorPlaceholder')}
                      className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-black focus:border-black outline-none ${
                        errors.floor ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.floor && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.floor}
                      </p>
                    )}
                  </div>
                </div>

                {/* تصنيف العنوان */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    {t('address.addressType')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {(["home", "work", "other"] as AddressTypeValue[]).map(
                      (typeValue) => (
                        <button
                          key={typeValue}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              addressType: typeValue,
                            });
                            clearFieldError("addressType");
                          }}
                          className={`flex items-center gap-2 p-2 md:px-5 md:py-3 border font-semibold rounded-[8px] cursor-pointer ${
                            formData.addressType === typeValue
                              ? "border-black bg-[#D2D6DB3D]"
                              : "border-gray-300"
                          }`}
                        >
                          <span
                            className={
                              formData.addressType === typeValue
                                ? "text-black"
                                : "text-gray-700"
                            }
                          >
                            {getAddressTypeIcon(typeValue)}
                            {getAddressTypeDisplay(typeValue)}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                  {errors.addressType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.addressType}
                    </p>
                  )}
                </div>

                {/* Save for future */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.saveForFuture}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saveForFuture: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-black bg-black rounded"
                  />
                  <span className="text-gray-700">
                    {t('address.saveForFuture')}
                  </span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-[8px] hover:bg-gray-50 transition"
                    disabled={isSubmitting}
                  >
                    {t('address.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-[#23A6F0] text-white rounded-[8px] hover:bg-[#23A6F0] transition disabled:opacity-50"
                  >
                    {isSubmitting
                      ? t('address.saving')
                      : isEditing
                        ? t('address.update')
                        : t('address.save')}
                  </button>
                </div>
              </div>

              {/* الخريطة */}
              <div className="lg:w-1/2 order-1 md:order-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                  <FaLocationDot className="text-red-500" />
                  {t('address.selectOnMap')}
                </label>
                <LocationMap
                  onLocationSelect={handleLocationSelect}
                  initialLocation={
                    formData.latitude && formData.longitude
                      ? {
                          lat: parseFloat(formData.latitude),
                          lng: parseFloat(formData.longitude),
                        }
                      : undefined
                  }
                />
                {isExtracting && (
                  <div className="mt-2 text-center text-sm text-blue-600">
                    {t('address.extractingLocation')}
                  </div>
                )}
                {selectedLocation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-green-200 rounded-[8px]">
                    <p className="text-sm text-green-800 font-medium">
                      {t('address.selectedFromMap')}:
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {selectedLocation.address}
                    </p>
                    {selectedLocation.city && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('address.cityLabel')}: {selectedLocation.city}
                      </p>
                    )}
                    {selectedLocation.governorate && (
                      <p className="text-xs text-gray-500">
                        {t('address.governorateLabel')}: {selectedLocation.governorate}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
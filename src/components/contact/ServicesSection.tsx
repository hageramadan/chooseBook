// components/contact/ServicesSection.tsx
"use client";
import { useState, useEffect } from "react";
import { FaRegEnvelope } from "react-icons/fa";
import { RiCustomerService2Line } from "react-icons/ri";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import SocialLinks from "./SocialLinks";

// خريطة لتحديد الأيقونة المناسبة حسب نوع الخدمة
const iconMap: Record<string, React.ElementType> = {
  email: FaRegEnvelope,
  phone: RiCustomerService2Line,
  whatsapp: IoChatbubbleEllipsesOutline,
  // يمكنك إضافة المزيد حسب الحاجة
};

// النوع الافتراضي للأيقونة
const defaultIcon = IoChatbubbleEllipsesOutline;

interface ServiceItem {
  id: number;
  type: string;
  title: string;
  description: string;
  value: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export default function ServicesSection() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchServices = async () => {
    try {
      const response = await fetch('https://ekhtarktabak.t-carts.com/api/contact-cards');
      
      if (!response.ok) {
        // يمكنك التعامل مع الخطأ هنا
        throw new Error('فشل في جلب البيانات');
      }
      
      const result = await response.json();
      
      if (result.result && result.data) {
        // البيانات موجودة مباشرة في result.data
        const activeServices = result.data
          .filter((item: ServiceItem) => item.is_active)
          .sort((a: ServiceItem, b: ServiceItem) => a.sort_order - b.sort_order);
        setServices(activeServices);
      } else {
        throw new Error(result.message || 'حدث خطأ في جلب البيانات');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchServices();
}, []);

  // دالة للحصول على الأيقونة المناسبة
  const getIcon = (type: string): React.ElementType => {
    return iconMap[type] || defaultIcon;
  };

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="bg-[#102637] rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm mb-5">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E4F0FA]"></div>
        </div>
      </div>
    );
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <></>
    );
  }

  // عرض الرسالة في حال عدم وجود بيانات
  if (services.length === 0) {
    return (
     <></>
    );
  }

  return (
    <div>
      { services.length > 0 &&( <div className="bg-[#102637] rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm mb-5">
      <div className="grid grid-cols-1 gap-3 md:gap-6">
        {services.map((service) => {
          const Icon = getIcon(service.type);
          return (
            <div
              key={service.id}
              className="flex md:flex-row flex-col gap-5 p-6 rounded-[8px] transition-all duration-300 bg-[#112B40] border-[0.2px] border-[#f2f8fd4f] shadow-sm"
            >
              {/* الأيقونة */}
              <div className="hidden md:flex w-16 h-16 px-3.5 bg-[#E4F0FA] items-center justify-center rounded-full p-3">
                <Icon className="w-8 h-8 text-[#195073]" />
              </div>

              <div>
                {/* العنوان */}
                <h2 className="text-lg font-bold text-white mb-2">
                  {service.title}
                </h2>

                {/* الوصف */}
                <p className="text-gray-100 text-sm leading-relaxed">
                  {service.description}
                </p>
                
               
              </div>
            </div>
          );
        })}
      </div>
      <div className="w-full h-[1px] mt-7 bg-white/40"></div>
      <SocialLinks />
    </div>)}
    </div>
   
  );
}
// components/contact/SocialLinks.tsx

'use client'
import Link from "next/link";
import { BsInstagram, BsLinkedin, BsTwitter } from "react-icons/bs";
import { FaFacebook, FaFacebookF } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IoLogoTiktok } from "react-icons/io5";
import { FaSnapchatGhost } from "react-icons/fa";
import { useState, useEffect } from "react";
import { getSettings } from "@/services/settingsApi";
import { useLanguage } from "@/contexts/LanguageContext";

//  دالة للحصول على الترجمات حسب اللغة
const getTranslations = (lang: string) => {
  if (lang === 'en') {
    return {
      loading: "Loading...",
      followUs: "Follow Us",
      phone: "Phone",
      email: "Email",
      // ترجمة أسماء منصات التواصل
      socialLabels: {
        twitter: "Twitter",
        facebook: "Facebook",
        tiktok: "TikTok",
        instagram: "Instagram",
        snapchat: "Snapchat",
        linkedin: "LinkedIn",
        whatsapp: "WhatsApp",
      }
    };
  }
  // Arabic (default)
  return {
    loading: "جاري التحميل...",
    followUs: "تواصل معنا",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    // ترجمة أسماء منصات التواصل
    socialLabels: {
      twitter: "تويتر",
      facebook: "فيسبوك",
      tiktok: "تيك توك",
      instagram: "انستغرام",
      snapchat: "سناب شات",
      linkedin: "لينكد إن",
      whatsapp: "واتساب",
    }
  };
};

interface Settings {
  linkedin: string;
  twitter: string;
  facebook: string;
  snapchat: string;
  instagram: string;
  whatsapp: string;
  email: string;
  phone: string;
}

export default function SocialLinks() {
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        setSettings(data.setting);
      } catch (error) {
        console.error('Error fetching social settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // روابط التواصل الاجتماعي من الـ API
  const socialLinks = [
    { 
      icon: FaXTwitter, 
      href: settings?.twitter || "https://x.com/tcartsofficial", 
      labelKey: "twitter" 
    },
    { 
      icon: FaFacebookF, 
      href: settings?.facebook || "https://www.facebook.com/tcarstofficial/", 
      labelKey: "facebook" 
    },
    { 
      icon: IoLogoTiktok, 
      href: "#", 
      labelKey: "tiktok" 
    },
    { 
      icon: BsInstagram, 
      href: settings?.instagram || "https://www.instagram.com/tcarstofficial/", 
      labelKey: "instagram" 
    },
    { 
      icon: FaSnapchatGhost, 
      href: settings?.snapchat || "https://www.snapchat.com/@tcartofficial", 
      labelKey: "snapchat" 
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-bold text-white my-4 text-center md:text-start">
        {loading ? t.loading : t.followUs}
      </h3>
      <div className="flex gap-3 md:gap-6 mt-6 justify-center md:justify-start">
        {loading ? (
          // عرض حالة التحميل
          Array(5).fill(0).map((_, index) => (
            <div key={index} className="w-5 h-5 bg-gray-600 rounded-full animate-pulse"></div>
          ))
        ) : (
          socialLinks.map((social, index) => (
            <Link
              key={index}
              href={social.href}
              aria-label={t.socialLabels[social.labelKey as keyof typeof t.socialLabels]}
              className="hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <social.icon className="w-5 h-5 text-white hover:text-primary transition-colors" />
            </Link>
          ))
        )}
      </div>
      
      {/* عرض معلومات الاتصال من API */}
      {!loading && settings && (
        <div className="mt-4 text-center md:text-start space-y-1">
          {/* {settings.phone && (
            <p className="text-sm text-gray-400">
              <span className="font-semibold">{t.phone}:</span>{' '}
              <span dir="ltr" className="text-white">{settings.phone}</span>
            </p>
          )} */}
          {/* {settings.email && (
            <p className="text-sm text-gray-400">
              <span className="font-semibold">{t.email}:</span>{' '}
              <span className="text-white">{settings.email}</span>
            </p>
          )} */}
        </div>
      )}
    </div>
  );
}
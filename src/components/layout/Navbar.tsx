"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PiSquaresFourLight as MenuIcon } from "react-icons/pi";
import {
  Heart,
  ShoppingCart,
  User,
  Search,
  X,
  ChevronDown,
  LogOut,
  HeartIcon,
  Package,
  RotateCcw,
  UserCircle,
  Home,
  RefreshCw,
  Globe,
} from "lucide-react";
import { useCartContext } from "@/contexts/CartContext";
import { PiUserBold } from "react-icons/pi";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { getCategories } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

interface Category {
  id: number;
  name: string;
  href: string;
}

//  دالة للحصول على الترجمات حسب اللغة
const getTranslations = (lang: string) => {
  if (lang === "en") {
    return {
      home: "Home",
      categories: "Categories",
      contact: "Contact Us",
      favorites: "Favorites",
      cart: "Cart",
      account: "Account",
      login: "Login",
      logout: "Logout",
      search: "Search for products...",
      orders: "Orders",
      returns: "Returns",
      profile: "Profile",
      allCategories: "All Categories",
      guestCart: "Guest Cart",
      wishlist: "Wishlist",
      loading: "Loading categories...",
      noCategories: "No categories available",
    };
  }
  // Arabic (default)
  return {
    home: "الرئيسية",
    categories: "الفئات",
    contact: "تواصل معنا",
    favorites: "المفضلة",
    cart: "السلة",
    account: "حسابي",
    login: "تسجيل دخول",
    logout: "تسجيل الخروج",
    search: "ابحث عن منتج...",
    orders: "الطلبات",
    returns: "المرتجعات",
    profile: "الملف الشخصي",
    allCategories: "جميع الفئات",
    guestCart: "سلة الضيف",
    wishlist: "المفضلة",
    loading: "جاري تحميل الفئات...",
    noCategories: "لا توجد فئات متاحة",
  };
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, isGuest } = useCartContext();
  const { isAuthenticated, user, logoutUser, loading } = useAuth();
  const { total: favoritesCount } = useFavorites();
  const { language, setLanguage, updateUserLocale } = useLanguage();

  //  الحصول على الترجمات حسب اللغة الحالية
  const t = getTranslations(language);

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showMobileCategoriesSheet, setShowMobileCategoriesSheet] =
    useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showMobileLanguageDropdown, setShowMobileLanguageDropdown] =
    useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const mobileLanguageDropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const itemsCount = cart?.items?.length || 0;

  // التحقق من أن الصفحة الحالية هي الهوم
  const isHomePage = pathname === "/";

  //  استمع لتغيرات اللغة وقم بتحديث الـ HTML
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("user_language", language);
  }, [language]);

  // جلب الفئات من API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await getCategories();

        const transformedCategories: Category[] = categoriesData.map((cat) => ({
          id: cat.id,
          name: cat.name,
          href: `/products?categories=[${cat.id}]`,
        }));

        setCategories(transformedCategories);
      } catch (error) {
        console.error("Error fetching categories for navbar:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle scroll event
  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  // Focus on search input when shown (Desktop)
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearchInput]);

  // Close search input when clicking outside (Desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSearchInput &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        // لا نغلق البحث تلقائياً، نترك المستخدم يقرر الإغلاق
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchInput]);

  // Close categories dropdown when clicking outside (Desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showCategoriesDropdown &&
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target as Node)
      ) {
        setShowCategoriesDropdown(false);
      }
      if (
        showUserDropdown &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
      if (
        showLanguageDropdown &&
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
      if (
        showMobileLanguageDropdown &&
        mobileLanguageDropdownRef.current &&
        !mobileLanguageDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMobileLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    showCategoriesDropdown,
    showUserDropdown,
    showLanguageDropdown,
    showMobileLanguageDropdown,
  ]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSearchInput) {
        setShowSearchInput(false);
        setSearchQuery("");
      }
      if (e.key === "Escape" && showCategoriesDropdown) {
        setShowCategoriesDropdown(false);
      }
      if (e.key === "Escape" && showMobileCategoriesSheet) {
        setShowMobileCategoriesSheet(false);
      }
      if (e.key === "Escape" && showUserDropdown) {
        setShowUserDropdown(false);
      }
      if (e.key === "Escape" && showLanguageDropdown) {
        setShowLanguageDropdown(false);
      }
      if (e.key === "Escape" && showMobileLanguageDropdown) {
        setShowMobileLanguageDropdown(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [
    showSearchInput,
    showCategoriesDropdown,
    showMobileCategoriesSheet,
    showUserDropdown,
    showLanguageDropdown,
    showMobileLanguageDropdown,
  ]);

  //  دالة تغيير اللغة
  const handleLanguageChange = async (locale: string) => {
    try {
      localStorage.setItem("user_language", locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
      setLanguage(locale);

      if (isAuthenticated) {
        await updateUserLocale(locale);
      }

      setShowLanguageDropdown(false);
      setShowMobileLanguageDropdown(false);
      localStorage.setItem("user_language", locale);
      window.location.reload();
    } catch (error) {
      console.error("Error changing language:", error);
      const savedLanguage = localStorage.getItem("user_language") || "ar";
      setLanguage(savedLanguage);
      toast.error(
        locale === "ar" ? "❌ فشل تغيير اللغة" : "❌ Failed to change language",
      );
    }
  };

  //  دالة البحث الرئيسية
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchInput(false);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  //  دالة لإظهار/إخفاء البحث في الموبايل
  const toggleMobileSearch = () => {
    setShowSearchInput(!showSearchInput);
    if (!showSearchInput) {
      setTimeout(() => {
        if (mobileSearchInputRef.current) {
          mobileSearchInputRef.current.focus();
        }
      }, 100);
    }
  };

  //  دالة لإغلاق البحث في الموبايل
  const closeMobileSearch = () => {
    setShowSearchInput(false);
    setSearchQuery("");
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    await logoutUser();
    setShowUserDropdown(false);
    setMobileMenuOpen(false);
    router.push("/");
    window.location.reload();
  };

  // الحرف الأول من اسم المستخدم
  const getUserInitial = () => {
    if (!user) return "";
    return user.name
      ? user.name.charAt(0).toUpperCase()
      : user.email?.charAt(0).toUpperCase() || "U";
  };

  // تحديد ألوان الناف بار
  const getNavbarStyles = () => {
    if (isHomePage) {
      return {
        backgroundColor: isScrolled ? "#FFFFFF" : "transparent",
        shadow: isScrolled ? "shadow-md" : "shadow-none",
        textColor: isScrolled ? "#112B40" : "#FFFFFF",
        logoColor: isScrolled ?  'var(--main-color)' : "#FFFFFF",
      };
    } else {
      return {
        backgroundColor: "#FFFFFF",
        shadow: "shadow-md",
        textColor: "#112B40",
        logocolor: "#195073",
      };
    }
  };

  const styles = getNavbarStyles();

  // عرض شاشة تحميل مؤقتة
  if (loading) {
    return (
      <header className="hidden md:block sticky top-0 z-30 w-full shadow-md bg-white">
        <div className="container-custom">
          <div className="flex h-20 items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Desktop Navigation */}
      <header
        className="hidden md:block sticky top-0 z-30 w-full shadow-md bg-white"
        style={{ backgroundColor: styles.backgroundColor }}
      >
        <div className="container-custom">
          <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="text-[32px] font-bold transition-colors shrink-0 text-primary" 
            >
               <Image
                src="/logo.png"
                alt="Logo"
                width={1000}
                height={700}
                className="object-contain w-32 h-32"
              />
              {/* Logo */}
            </Link>

            {/* Desktop Navigation Links -  استخدام الترجمات */}
            <nav className="flex items-center gap-6 flex-1 justify-center">
              <Link
                href="/"
                className="text-[16px] transition-colors hover:text-primary"
                style={{
                  color: pathname === "/" ? "var(--main-color)" : "#112B40",
                  fontWeight: pathname === "/" ? "700" : "400",
                }}
              >
                {t.home}
              </Link>

              <div className="relative" ref={categoriesRef}>
                <button
                  aria-label="categories"
                  className="flex items-center gap-1 text-[16px] transition-colors hover:text-primary"
                  style={{
                    color: pathname.startsWith("/categories")
                      ? "var(--main-color)"
                      : "#112B40",
                    fontWeight: pathname.startsWith("/categories")
                      ? "700"
                      : "400",
                  }}
                  onClick={() =>
                    setShowCategoriesDropdown(!showCategoriesDropdown)
                  }
                  onMouseEnter={() => setShowCategoriesDropdown(true)}
                >
                  {t.categories}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${showCategoriesDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Categories Dropdown - Desktop */}
                {showCategoriesDropdown && (
                  <div
                    className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg border shadow-xl z-30 animate-in fade-in zoom-in-95 duration-200"
                    style={{ borderColor: "#e2e8f0" }}
                    onMouseLeave={() => setShowCategoriesDropdown(false)}
                  >
                    <div className="py-2">
                      {loadingCategories ? (
                        <div className="px-4 py-3 text-center">
                          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                          <p className="text-xs text-gray-500 mt-1">
                            {t.loading}
                          </p>
                        </div>
                      ) : categories.length > 0 ? (
                        categories.map((category) => (
                          <Link
                            key={category.id}
                            href={category.href}
                            className="block px-4 py-2 text-[14px] transition-colors hover:bg-gray-50"
                            style={{ color: "#112B40" }}
                            onClick={() => setShowCategoriesDropdown(false)}
                            onMouseEnter={(e) =>
                               (e.currentTarget.style.color = 'var(--main-color)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "#112B40")
                            }
                          >
                            {category.name}
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center">
                          <p className="text-xs text-gray-500">
                            {t.noCategories}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/contact"
                className="text-[16px] transition-colors hover:text-primary"
                style={{
                  color: pathname === "/contact" ? "var(--main-color)" : "#112B40",
                  fontWeight: pathname === "/contact" ? "700" : "400",
                }}
              >
                {t.contact}
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Search Button - Desktop */}
              <div className="relative" ref={searchContainerRef}>
                {!showSearchInput ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="search"
                    onClick={() => setShowSearchInput(true)}
                    className="relative z-10 hover:bg-gray-100 rounded-[10px]"
                    style={{ color: "#195073" }}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                ) : (
                  <div className="relative">
                    <form onSubmit={handleSearch} className="flex items-center">
                      <div className="relative">
                        <Input
                          ref={searchInputRef}
                          type="search"
                          placeholder={t.search}
                          className="w-64 h-10 ps-9 pe-9 border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                          style={{ color: "#195073" }}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black hover:text-white transition-colors"
                          aria-label="بحث"
                        >
                          <Search className="h-4 w-4 text-gray-500 hover:text-white" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSearchInput(false);
                          setSearchQuery("");
                        }}
                        className="mr-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="إغلاق البحث"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Favorites */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="relative hover:bg-gray-100 rounded-[10px]"
                style={{ color: "#195073" }}
              >
                <Link href="/account/wishlist">
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-main text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {favoritesCount > 99 ? "99+" : favoritesCount}
                    </span>
                  )}
                  <Heart className="h-[20px] w-[20px]" />
                </Link>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="relative hover:bg-gray-100 rounded-[10px] group"
                style={{ color: "#195073" }}
              >
                <Link href="/cart">
                  {itemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-main text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {itemsCount > 99 ? "99+" : itemsCount}
                    </span>
                  )}
                  <ShoppingCart className="h-5 w-5" />
                  {isGuest && itemsCount > 0 && (
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {t.guestCart}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Language Selector - Desktop */}
              {/* <div className="relative" ref={languageDropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="relative z-10 hover:bg-gray-100 rounded-[10px]"
                  style={{ color: "#195073" }}
                  aria-label="تغيير اللغة"
                >
                  <Globe className="h-5 w-5" />
                  <span className="absolute -bottom-1 text-[10px] font-bold">
                    {language === "ar" ? "ع" : "EN"}
                  </span>
                </Button>

                {showLanguageDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg border shadow-xl z-30">
                    <div className="py-2">
                      <button
                        onClick={() => handleLanguageChange("ar")}
                        className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          language === "ar"
                            ? "text-primary font-bold"
                            : ""
                        }`}
                      >
                        <span className="text-lg">🇸🇦</span>
                        العربية
                        {language === "ar" && (
                          <span className="mr-auto text-primary">✓</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleLanguageChange("en")}
                        className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          language === "en"
                            ? "text-primary font-bold"
                            : ""
                        }`}
                      >
                        <span className="text-lg">🇬🇧</span>
                        English
                        {language === "en" && (
                          <span className="mr-auto text-primary">✓</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div> */}

              {/* User / Login -  استخدام الترجمات */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-main flex items-center justify-center text-white font-bold text-sm">
                      {getUserInitial()}
                    </div>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        showUserDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg border shadow-xl z-30">
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-primary">
                            {user.name || "مستخدم"}
                          </p>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                              <span dir="ltr">
                                {" "}
                                {user.country_code || " "} <></>
                                {user.phone}
                              </span>
                            </div>
                          )}
                        </div>
                        <Link
                          href="/account/wishlist"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <HeartIcon className="h-4 w-4" />
                          <span>{t.wishlist}</span>
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <Package className="h-4 w-4" />
                          <span>{t.orders}</span>
                        </Link>
                        <Link
                          href="/account/returns"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>{t.returns}</span>
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <UserCircle className="h-4 w-4" />
                          <span>{t.profile}</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 border-t border-gray-100 mt-1 text-red-500"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t.logout}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  className=" text-white rounded-[16px] bg-main hover:bg-main-dark/10 gap-2"
                >
                  <Link href="/auth/login">
                    <PiUserBold className="h-5 w-5 text-[#fff]" />
                    <span className="text-[14px] font-bold text-[#fff]">
                      {t.login}
                    </span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========== MOBILE VIEW ========== */}

      {/* الشريط العلوي للموبايل */}
      <div className="md:hidden sticky top-0 z-30 w-full bg-white shadow-md">
        <div className="px-2 flex items-center justify-between ">
          <Link href="/" className="shrink-0 text-primary font-semibold text-lg">
              <Image
              src="/logo.png"
              alt="Logo"
              width={2000}
              height={500}
              className="object-contain w-20 h-20"
            />
            {/* Logo */}
          </Link>

          {!showSearchInput ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileSearch}
                className="hover:bg-gray-100 rounded-full"
                aria-label="بحث"
              >
                <Search className="h-5 w-5 text-primary" />
              </Button>

              {/* Language Selector - Mobile */}
              {/* <div className="relative" ref={mobileLanguageDropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setShowMobileLanguageDropdown(!showMobileLanguageDropdown)
                  }
                  className="hover:bg-gray-100 rounded-full relative"
                  aria-label="تغيير اللغة"
                >
                  <Globe className="h-5 w-5 text-primary" />
                  <span className="absolute -bottom-1 text-[8px] font-bold text-primary">
                    {language === "ar" ? "ع" : "EN"}
                  </span>
                </Button>

                {showMobileLanguageDropdown && (
                  <div
                    className={`absolute top-full mt-2 w-40 bg-white rounded-lg border shadow-xl z-30 ${
                      language === "en" ? "right-0" : "left-0"
                    }`}
                  >
                    <div className="py-2">
                      <button
                        onClick={() => handleLanguageChange("ar")}
                        className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          language === "ar"
                            ? "text-primary font-bold"
                            : ""
                        }`}
                      >
                        <span className="text-lg">🇸🇦</span>
                        العربية
                        {language === "ar" && (
                          <span className="mr-auto text-primary">✓</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleLanguageChange("en")}
                        className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          language === "en"
                            ? "text-primary font-bold"
                            : ""
                        }`}
                      >
                        <span className="text-lg">🇬🇧</span>
                        English
                        {language === "en" && (
                          <span className="mr-auto text-primary">✓</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div> */}

              {/* <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hover:bg-gray-100 rounded-full"
                aria-label="القائمة"
              >
                <MenuIcon className="h-6 w-6 text-primary" />
              </Button> */}
            </div>
          ) : (
            <div
              className="relative flex-1 mx-2"
              ref={mobileSearchContainerRef}
            >
              <form onSubmit={handleSearch} className="relative">
                <Input
                  ref={mobileSearchInputRef}
                  type="search"
                  placeholder={t.search}
                  className="w-full h-10 ps-9 pe-9 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-primary"
                  style={{ color: "#195073" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black hover:text-white transition-colors"
                  aria-label="بحث"
                >
                  <Search className="h-4 w-4 text-gray-500 hover:text-white" />
                </button>
                <button
                  type="button"
                  onClick={closeMobileSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  aria-label="إغلاق البحث"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu -  استخدام الترجمات */}
        {/* {mobileMenuOpen && (
          <div
            className="border-t py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 bg-white"
            style={{ borderColor: "#e2e8f0" }}
          >
            <form onSubmit={handleSearch} className="relative px-3">
              <Search
                className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "#94a3b8" }}
              />
              <Input
                type="search"
                placeholder={t.search}
                className="w-full h-10 ps-9 bg-gray-50"
                style={{
                  color: "#112B40",
                  borderColor: "#e2e8f0",
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="flex items-center justify-around px-3 py-2 border-b border-gray-100">
              <Link
                href="/account/wishlist"
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors relative"
                onClick={() => setMobileMenuOpen(false)}
              >
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-main text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {favoritesCount > 99 ? "99+" : favoritesCount}
                  </span>
                )}
                <Heart className="h-5 w-5" style={{ color: "#195073" }} />
                <span className="text-xs" style={{ color: "#195073" }}>
                  {t.favorites}
                </span>
              </Link>

              <Link
                href="/cart"
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors relative"
                onClick={() => setMobileMenuOpen(false)}
              >
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-main text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {itemsCount > 99 ? "99+" : itemsCount}
                  </span>
                )}
                <ShoppingCart
                  className="h-5 w-5"
                  style={{ color: "#195073" }}
                />
                <span className="text-xs" style={{ color: "#195073" }}>
                  {t.cart} {isGuest && itemsCount > 0 && "(Guest)"}
                </span>
              </Link>

              {isAuthenticated && user ? (
                <div className="flex flex-col items-center gap-1 p-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#23A6F0] to-[#f0278f] flex items-center justify-center text-white font-bold text-sm">
                    {getUserInitial()}
                  </div>
                  <span className="text-xs" style={{ color: "#195073" }}>
                    {t.account}
                  </span>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" style={{ color: "#195073" }} />
                  <span className="text-xs" style={{ color: "#195073" }}>
                    {t.login}
                  </span>
                </Link>
              )}
            </div>

            {isAuthenticated && user && (
              <div className="px-3 space-y-1 border-b border-gray-100 pb-3">
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
                  style={{ color: "#112B40" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package className="h-4 w-4" />
                  <span>{t.orders}</span>
                </Link>
                <Link
                  href="/account/returns"
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
                  style={{ color: "#112B40" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{t.returns}</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
                  style={{ color: "#195073" }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.logout}</span>
                </button>
              </div>
            )}

            {isGuest && itemsCount > 0 && (
              <div className="px-3 py-2 bg-main border border-blue-200 rounded-lg mx-3">
                <p className="text-xs text-blue-700 text-center">
                  🛒 {t.guestCart} - {t.login} {t.account}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className="px-3 py-3 text-[16px] font-medium rounded-md transition-colors hover:bg-gray-50"
                style={{ color: "#112B40" }}
                onClick={() => setMobileMenuOpen(false)}
                onMouseEnter={(e) =>  (e.currentTarget.style.color = 'var(--main-color)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#112B40")}
              >
                {t.home}
              </Link>

              <div className="space-y-2">
                <button
                  aria-label="categories"
                  className="px-3 py-3 text-[16px] font-medium rounded-md transition-colors hover:bg-gray-50 flex items-center justify-between w-full"
                  style={{ color: "#112B40" }}
                  onClick={() =>
                    setShowMobileCategoriesSheet(!showMobileCategoriesSheet)
                  }
                >
                  {t.categories}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showMobileCategoriesSheet ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showMobileCategoriesSheet && (
                  <div className="mr-4 space-y-1">
                    {loadingCategories ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {t.loading}
                      </div>
                    ) : (
                      categories.map((category) => (
                        <Link
                          key={category.id}
                          href={category.href}
                          className="block px-3 py-2 text-[14px] rounded-md transition-colors hover:bg-gray-50"
                          style={{ color: "#112B40" }}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setShowMobileCategoriesSheet(false);
                          }}
                          onMouseEnter={(e) =>
                             (e.currentTarget.style.color = 'var(--main-color)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#112B40")
                          }
                        >
                          {category.name}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/contact"
                className="px-3 py-3 text-[16px] font-medium rounded-md transition-colors hover:bg-gray-50"
                style={{ color: "#112B40" }}
                onClick={() => setMobileMenuOpen(false)}
                onMouseEnter={(e) =>  (e.currentTarget.style.color = 'var(--main-color)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#112B40")}
              >
                {t.contact}
              </Link>
            </div>
          </div>
        )} */}
      </div>

      {/* القائمة السفلية للموبايل (Bottom Navigation Bar) -  استخدام الترجمات */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg"
        style={{ borderColor: "#e2e8f0" }}
      >
        <div className="flex items-center justify-around py-2">
          {/* Home */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileCategoriesSheet(false);
            }}
          >
            <Home
              className="h-5 w-5"
              style={{ color: pathname === "/" ? "var(--main-color)" : "#666" }}
            />
            <span
              className="text-[10px]"
              style={{ color: pathname === "/" ? "var(--main-color)" : "#666" }}
            >
              {t.home}
            </span>
          </Link>

          {/* Categories */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileCategoriesSheet(true);
            }}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors"
          >
            <MenuIcon
              className="h-5 w-5"
              style={{
                color: pathname.startsWith("/categories") ? "var(--main-color)" : "#666",
              }}
            />
            <span
              className="text-[10px]"
              style={{
                color: pathname.startsWith("/categories") ? "var(--main-color)" : "#666",
              }}
            >
              {t.categories}
            </span>
          </button>

          {/* Favorites */}
          <Link
            href="/account/wishlist"
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileCategoriesSheet(false);
            }}
          >
            <div className="relative">
              <Heart
                className="h-5 w-5"
                style={{
                  color:
                    pathname === "/account/wishlist" ? "var(--main-color)" : "#666",
                }}
              />
              {favoritesCount > 0 && (
                <span className="absolute -top-2 -right-2 text-[9px] font-bold bg-main text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {favoritesCount > 99 ? "99+" : favoritesCount}
                </span>
              )}
            </div>
            <span
              className="text-[10px]"
              style={{
                color:
                  pathname === "/account/wishlist" ? "var(--main-color)" : "#666",
              }}
            >
              {t.favorites}
            </span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileCategoriesSheet(false);
            }}
          >
            <div className="relative">
              <ShoppingCart
                className="h-5 w-5"
                style={{ color: pathname === "/cart" ? "var(--main-color)" : "#666" }}
              />
              {itemsCount > 0 && (
                <span className="absolute -top-2 -right-2 text-[9px] font-bold bg-main text-white rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {itemsCount > 99 ? "99+" : itemsCount}
                </span>
              )}
            </div>
            <span
              className="text-[10px]"
              style={{ color: pathname === "/cart" ? "var(--main-color)" : "#666" }}
            >
              {t.cart}
            </span>
          </Link>

          {/* Account */}
          {isAuthenticated && user ? (
            <Link
              href="/account"
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileCategoriesSheet(false);
              }}
            >
              <div className="w-5 h-5 rounded-full bg-main flex items-center justify-center text-white font-bold text-[10px]">
                {getUserInitial()}
              </div>
              <span
                className="text-[10px]"
                style={{ color: pathname === "/account" ? "var(--main-color)" : "#666" }}
              >
                {t.account}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors"
              
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileCategoriesSheet(false);
              }}
            >
              <User className="h-5 w-5" style={{ color: "#666" }} />
              <span className="text-[10px]" style={{ color: "#666" }}>
                {t.login}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Sheet / Modal للفئات في الموبايل */}
      {showMobileCategoriesSheet && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
            onClick={() => setShowMobileCategoriesSheet(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: "#112B40" }}>
                {t.allCategories}
              </h3>
              <button
                onClick={() => setShowMobileCategoriesSheet(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" style={{ color: "#666" }} />
              </button>
            </div>
            <div className="p-4">
              {loadingCategories ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="text-sm text-gray-500 mt-2">{t.loading}</p>
                </div>
              ) : categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={category.href}
                      className="block px-4 py-3  text-[15px] rounded-lg transition-colors hover:bg-gray-50 border-b border-gray-100"
                      style={{ color: "#112B40" }}
                      onClick={() => setShowMobileCategoriesSheet(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">{t.noCategories}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
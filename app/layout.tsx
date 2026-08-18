import type { Metadata } from "next";
import { Almarai } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubNavbar } from "@/components/layout/SubNavbar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { getSettings } from "@/services/settingsApi";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
});

// export const metadata: Metadata = {
//   title: "متجري - منتجات مميزة",
//   description: "أفضل المنتجات في مكان واحد",
// };
const defaultTitle = "متجر فاشون | أحدث صيحات الموضة والأزياء العصرية أونلاين";
const defaultDescription =
  "تسوقي وتسوّق أحدث تشكيلات الملابس والأزياء العصرية بجودة عالية وأفضل الأسعار. شحن سريع، عروض متجددة، وتجربة تسوق مرنة تناسب إطلالتك اليومية.";

// دالة لجلب البيانات ديناميكياً
async function getMetadata(): Promise<{ title: string; description: string }> {
  try {
    const settings = await getSettings();

    // استخدام القيم من الـ API إذا كانت موجودة، وإلا استخدام القيم الافتراضية
    const title = settings.setting.meta?.meta_title || "";
    const description = settings.setting.meta?.meta_description || "";

    return { title, description };
  } catch (error) {
    console.error("Failed to fetch settings for metadata:", error);
    // في حالة الخطأ، استخدام القيم الافتراضية
    return {
      title: defaultTitle,
      description: defaultDescription,
    };
  }
}

// استيراد البيانات في metadata
export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getMetadata();

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: "website",
      locale: "ar_EG",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    },
    icons: {
      icon: [
        { url: "/logo.png", type: "image/png" }
      ],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className={almarai.className}>
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              <AuthProvider>
                <FavoritesProvider>
                  <SubNavbar />
                  <Navbar />
                  <main>{children}</main>
                  <Toaster
                    position="top-center" // مكان ظهور الإشعار
                    reverseOrder={false}
                  />
                  <Footer />
                </FavoritesProvider>
              </AuthProvider>
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

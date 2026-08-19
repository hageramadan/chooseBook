// app/terms/page.tsx
"use client";

import Link from "next/link";
import { ChevronRight, Home, ShoppingBag, Phone, Mail, MapPin } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="bg-gradient-to-l min-h-screen from-[#bdcbf12a] to-[#feecea3b]">
      <div className="container mx-auto px-4 py-6 md:py-8">
        
        {/* Breadcrumbs */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition flex items-center gap-1">
              <Home className="w-4 h-4" />
              الرئيسية
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary font-medium">الشروط والأحكام</span>
          </div>
        </div>

        <div className="grid grid-cols-1 ">
        

          {/* Main Content - Left Side */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-8 pb-4 border-b border-gray-100">
                <h1 className="text-xl md:text-xl font-bold text-gray-800 mb-3">الشروط والأحكام</h1>
                <p className="text-gray-500 text-sm">
                  باستخدامك لموقع <span className="font-semibold text-gray-700">******</span>، فإنك توافق على الشروط والأحكام التالية. 
                  يرجى قراءتها بعناية قبل إتمام أي عملية شراء.
                </p>
              </div>

              <div className="space-y-8">
                {/* 1. التعريفات */}
                <Section title="التعريفات">
                  <p><strong className="text-gray-800">******/ نحن / الشركة:</strong> تشير إلى متجر****** الإلكتروني لتوصيل المنتجات.</p>
                  <p><strong className="text-gray-800">العميل / المستخدم / أنت:</strong> يشير إلى أي شخص يستخدم الموقع أو التطبيق أو يقوم بعملية شراء.</p>
                  <p><strong className="text-gray-800">الخدمة:</strong> تشمل بيع وتوصيل المنتجات عبر الموقع الإلكتروني وتطبيق الجوال.</p>
                </Section>

                {/* 2. الأهلية */}
                <Section title=" الأهلية">
                  <p>يجب أن يكون عمر المستخدم 18 سنة أو أكثر لإنشاء حساب وإجراء عمليات الشراء. بإتمام عملية الشراء، يقر المستخدم بأنه مؤهل قانونياً للتعاقد.</p>
                </Section>

                {/* 3. المنتجات والأسعار */}
                <Section title=" المنتجات والأسعار">
                  <p>جميع المنتجات المعروضة تخضع للتوفر. نبذل أقصى جهد لعرض صور دقيقة وأوصاف صحيحة. الأسعار المعروضة بالريال السعودي (ر.س) وتشمل جميع الضرائب المطبقة. نحتفظ بحق تعديل الأسعار في أي وقت دون إشعار مسبق، لكن الأسعار المؤكدة عند تقديم الطلب لن تتغير.</p>
                </Section>

                {/* 4. الطلب والدفع */}
                <Section title=" الطلب والدفع">
                  <p>الحد الأدنى للطلب هو 3.000 ر.س. يتم قبول الدفع عبر بوابة حسابي (Hesabi) والتي تشمل فيزا وماستركارد وأبل باي.</p>
                  <p>تأكيد الطلب يعتبر عقداً ملزماً بين الطرفين. نحتفظ بحق رفض أو إلغاء أي طلب في حال عدم توفر المنتج أو وجود خطأ في الأسعار أو معلومات الطلب.</p>
                </Section>

                {/* 5. التوصيل */}
                <Section title=" التوصيل">
                  <p>نوصل لجميع مناطق السعودية من الساعة 10:00 صباحاً حتى 10:00 مساءً. أوقات التوصيل المذكورة تقديرية وقد تتأثر بالظروف الجوية أو الازدحام أو ظروف أخرى خارجة عن إرادتنا.</p>
                  <p>العميل مسؤول عن تقديم عنوان توصيل صحيح ورقم هاتف فعال. في حال تعذر التوصيل بسبب معلومات خاطئة من العميل، قد يتحمل العميل رسوم توصيل إضافية.</p>
                </Section>

                {/* 6. الاسترجاع والاستبدال */}
                <Section title=" الاسترجاع والاستبدال">
                  <p>تخضع عمليات الاسترجاع والاستبدال لسياسة الاسترجاع والاستبدال المنشورة على موقعنا. يجب تقديم طلب الاسترجاع أو الاستبدال خلال 24 ساعة من استلام الطلب.</p>
                </Section>

                {/* 7. حساب المستخدم */}
                <Section title=" حساب المستخدم">
                  <p>المستخدم مسؤول عن الحفاظ على سرية بيانات حسابه وكلمة المرور. أي نشاط يتم عبر حسابك يعتبر مسؤوليتك. يجب إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابك.</p>
                </Section>

                {/* 8. الملكية الفكرية */}
                <Section title=" الملكية الفكرية">
                  <p>جميع المحتويات المعروضة على الموقع والتطبيق بما في ذلك الشعار والتصاميم والنصوص والصور هي ملكية خاصة لـ <strong>******</strong> ومحمية بموجب قوانين الملكية الفكرية. يُمنع نسخ أو استخدام أي محتوى بدون إذن كتابي مسبق.</p>
                </Section>

                {/* 9. تحديد المسؤولية */}
                <Section title=" تحديد المسؤولية">
                  <p>لا نتحمل المسؤولية عن أي أضرار غير مباشرة ناتجة عن استخدام خدماتنا. مسؤوليتنا القصوى لا تتجاوز قيمة الطلب المعني.</p>
                </Section>

                {/* 10. القانون الواجب التطبيق */}
                <Section title=" القانون الواجب التطبيق">
                  <p>تخضع هذه الشروط والأحكام لقوانين دولة السعودية. أي نزاع ينشأ عن استخدام خدماتنا يخضع للاختصاص القضائي لمحاكم دولة السعودية.</p>
                </Section>

                {/* 11. التعديلات */}
                <Section title="  التعديلات">
                  <p>نحتفظ بحق تعديل هذه الشروط والأحكام في أي وقت. التعديلات تصبح سارية فور نشرها على الموقع. استمرارك في استخدام خدماتنا بعد التعديل يعتبر موافقة على الشروط المحدثة.</p>
                </Section>
              </div>

            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// مكون القسم
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-black rounded-full"></span>
        {title}
      </h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-2  ps-2">
        {children}
      </div>
    </div>
  );
}
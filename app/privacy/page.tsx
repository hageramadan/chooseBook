// app/privacy/page.tsx
"use client";

import Link from "next/link";
import { ChevronRight, Home, ShoppingBag, Phone, Mail, MapPin, Shield, Database, Eye, Cookie } from "lucide-react";

export default function PrivacyPage() {
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
            <span className="text-primary font-medium">سياسة الخصوصية</span>
          </div>
        </div>

        <div className="grid grid-cols-1 ">
        

          {/* Main Content - Left Side */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-8 pb-4 border-b border-gray-100">
                <h1 className="text-xl md:text-xl font-bold text-gray-800 mb-3">سياسة الخصوصية</h1>
                <p className="text-gray-500 text-sm">
                  نحن في <span className="font-semibold text-gray-700">******</span> نقدّر خصوصية عملائنا ونلتزم بحماية بياناتهم الشخصية. 
                  توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات التي نحصل عليها من خلال موقعنا الإلكتروني وتطبيق الجوال.
                </p>
              </div>

              <div className="space-y-8">
                {/* 1. البيانات التي نجمعها */}
                <Section title="البيانات التي نجمعها" >
                  <p><strong className="text-gray-800">المعلومات الشخصية:</strong> نجمع المعلومات التالية عند التسجيل أو تقديم طلب: الاسم الكامل، رقم الهاتف، عنوان التوصيل، البريد الإلكتروني (اختياري)، وتفاصيل الطلبات السابقة.</p>
                  <p><strong className="text-gray-800">البيانات التقنية:</strong> كما نقوم بجمع بيانات تقنية بشكل تلقائي مثل: نوع الجهاز والمتصفح، عنوان IP، وبيانات الاستخدام والتصفح لتحسين تجربة المستخدم.</p>
                </Section>

                {/* 2. كيف نستخدم بياناتك */}
                <Section title="كيف نستخدم بياناتك" >
                  <p>نستخدم بياناتك للأغراض التالية:</p>
                  <ul className="list-disc  ps-5 space-y-1 mt-2">
                    <li>معالجة وتوصيل طلباتك</li>
                    <li>التواصل معك بخصوص طلباتك وحسابك</li>
                    <li>إرسال العروض والتحديثات (يمكنك إلغاء الاشتراك في أي وقت)</li>
                    <li>تحسين منتجاتنا وخدماتنا</li>
                  </ul>
                </Section>

                {/* 3. حماية البيانات */}
                <Section title="حماية البيانات" >
                  <p>نتخذ إجراءات أمنية مناسبة لحماية بياناتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. جميع عمليات الدفع تتم عبر بوابة حسابي (Hesabi) المؤمنة ولا نقوم بتخزين بيانات البطاقات البنكية على خوادمنا.</p>
                </Section>

                {/* 4. مشاركة البيانات مع أطراف ثالثة */}
                <Section title=" مشاركة البيانات مع أطراف ثالثة">
                  <p>لا نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث. قد نشارك بعض البيانات مع مزودي الخدمات الذين يساعدوننا في تشغيل أعمالنا مثل شركات التوصيل وبوابات الدفع، وذلك فقط بالقدر اللازم لتقديم الخدمة.</p>
                </Section>

                {/* 5. ملفات تعريف الارتباط (Cookies) */}
                <Section title=" ملفات تعريف الارتباط (Cookies)" >
                  <p>نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح وتذكر تفضيلاتك. يمكنك تعطيل ملفات تعريف الارتباط من إعدادات المتصفح، لكن هذا قد يؤثر على بعض وظائف الموقع.</p>
                </Section>

                {/* 6. حقوقك */}
                <Section title="حقوقك">
                  <p>يحق لك في أي وقت:</p>
                  <ul className="list-disc  ps-5 space-y-1 mt-2">
                    <li>طلب الاطلاع على بياناتك الشخصية المخزنة لدينا</li>
                    <li>طلب تصحيح أو تحديث بياناتك</li>
                    <li>طلب حذف حسابك وبياناتك الشخصية</li>
                    <li>إلغاء الاشتراك في الرسائل التسويقية</li>
                  </ul>
                  <p className="mt-3">لممارسة أي من هذه الحقوق، يرجى التواصل معنا عبر الواتساب.</p>
                </Section>

                {/* 7. تعديل سياسة الخصوصية */}
                <Section title="تعديل سياسة الخصوصية">
                  <p>نحتفظ بحق تعديل هذه السياسة في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة مع تحديث تاريخ آخر تعديل. ننصح بمراجعة هذه السياسة بشكل دوري.</p>
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
function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="pb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-black rounded-full"></span>
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-2  ps-2">
        {children}
      </div>
    </div>
  );
}
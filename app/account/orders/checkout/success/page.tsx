// app/account/orders/checkout/success/page.tsx
import { Suspense } from "react";
import CheckoutSuccessContent from "./CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#23A6F0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          {/* <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري التحميل...</h2> */}
          {/* <p className="text-gray-500">يرجى الانتظار</p> */}
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
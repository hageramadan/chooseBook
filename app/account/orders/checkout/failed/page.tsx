// app/account/orders/checkout/failed/page.tsx
import { Suspense } from "react";
import CheckoutFailedContent from "./CheckoutFailedContent";

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          {/* <p className="mt-4 text-gray-600">جاري التحميل...</p> */}
        </div>
      </div>
    }>
      <CheckoutFailedContent />
    </Suspense>
  );
}
// app/auth/login/page.tsx
import { Suspense } from "react";
import LoginWithEmail from "@/components/Auth/login/login_with_email";
import LoginWithPhone from "@/components/Auth/login/login_with_phone";

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginWithPhone />
    </Suspense>
  );
}
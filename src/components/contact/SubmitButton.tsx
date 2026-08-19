// components/contact/SubmitButton.tsx
"use client";

import { Send } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface SubmitButtonProps {
  isSubmitting: boolean;
}

export default function SubmitButton({ isSubmitting }: SubmitButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full bg-main text-white py-3 rounded-full font-medium hover:bg-main-dark transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isSubmitting ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {t('contact.sending')}
        </>
      ) : (
        <>
          {t('contact.send')}
          <Send className="w-5 h-5" />
        </>
      )}
    </button>
  );
}
"use client";

import { NotesFormProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";

export default function NotesForm({ notes, onNotesChange }: NotesFormProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        {t('checkout.notes')}
      </h2>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={3}
        placeholder={t('checkout.notesPlaceholder')}
        className="w-full px-4 py-3 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#23A6F0] focus:border-[#23A6F0] transition resize-none"
      />
    </div>
  );
}
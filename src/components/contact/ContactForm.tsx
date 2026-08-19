// components/contact/ContactForm.tsx
"use client";

import { useState } from "react";
import FormInput from "./FormInput";
import PhoneInput from "./PhoneInput";
import SubmitButton from "./SubmitButton";
import { useTranslation } from "@/hooks/useTranslation";
import { getHeaders } from "@/services/api";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  country_code: string;
  message: string;
}

export default function ContactForm() {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    country_code: "+20",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (phone: string, countryCode: string) => {
    setFormData((prev) => ({
      ...prev,
      phone: phone,
      country_code: countryCode,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        country_code: formData.country_code,
        message: formData.message,
      };

      const response = await fetch("https://admin.ekhtarktabak.com/api/contact-us", {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.result === true) {
        setIsSubmitted(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          country_code: "+20",
          message: "",
        });
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        setErrorMessage(data.message || t('contact.error'));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage(t('contact.serverError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm h-fit">
      <h2 className="text-2xl font-bold text-[#191C1F] mb-6">
        {t('contact.title')}
      </h2>

      {isSubmitted && (
        <div className="mb-6 p-4 bg-main-light border border-green-200 rounded-[8px] text-green-700 text-sm">
          {t('contact.success')}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-main-light border border-red-200 rounded-[8px] text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormInput
          label={t('contact.name')}
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder={t('contact.namePlaceholder')}
          required
        />

        <FormInput
          label={t('contact.email')}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={t('contact.emailPlaceholder')}
          required
        />

        <PhoneInput
          value={`${formData.country_code} ${formData.phone}`}
          onChange={handlePhoneChange}
          required
        />

        <FormInput
          label={t('contact.message')}
          name="message"
          type="textarea"
          value={formData.message}
          onChange={handleChange}
          placeholder={t('contact.messagePlaceholder')}
          rows={5}
          required
        />

        <SubmitButton isSubmitting={isSubmitting} />
      </form>
    </div>
  );
}
"use client";

import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { getHeaders } from "@/services/api";

export default function WalletPage() {
  const { t } = useTranslation();
  // حالات البيانات
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("$");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // دالة لجلب الرصيد من الـ API
  const fetchWalletBalance = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error(t('account.noToken'));
      }

      const apiUrl = "https://admin.ekhtarktabak.com/api";
      const response = await fetch(`${apiUrl}/wallet`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (data.result === true && data.errNum === 200) {
        const balanceString = data.data.balance;
        const [currencyPart, balancePart] = balanceString.split(" ");
        
        setCurrency(currencyPart || "Egp");
        setBalance(parseFloat(balancePart) || 0);
      } else {
        throw new Error(data.message || t('account.fetchBalanceError'));
      }
    } catch (err: any) {
      console.error("Error fetching wallet balance:", err);
      setError(err.message || t('account.serverError'));
    } finally {
      setLoading(false);
    }
  };

  // جلب الرصيد عند تحميل الصفحة
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('account.loadingWallet')}</p>
        </div>
      </div>
    );
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
        <div className="container mx-auto pb-4">
          <div className="mb-6">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition mb-4"
            >
              <FaChevronRight className="w-4 h-4" />
              <span>{t('account.backToAccount')}</span>
            </Link>
          </div>
          <div className="bg-main-light border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchWalletBalance}
              className="px-4 py-2 bg-main text-white rounded-[8px] hover:bg-main-dark transition"
            >
              {t('account.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // عرض الصفحة مع الرصيد الحقيقي
  return (
    <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
      <div className="container mx-auto pb-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition mb-4"
          >
            <FaChevronRight className="w-4 h-4" />
            <span>{t('account.backToAccount')}</span>
          </Link>
          <h1 className="text-xl font-bold text-[#180100]">{t('account.wallet')}</h1>
        </div>

        {/* بطاقة الرصيد - Wallet Card */}
        <div className="space-y-3 mb-6">
          <div className="relative overflow-hidden bg-card-wallet rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-2 w-fit">
                  <Image
                    src="/images/wallet.png"
                    alt="Wallet"
                    width={28}
                    height={28}
                    className="brightness-0 invert opacity-90"
                  />
                </div>
                <p className="text-white text-lg md:text-xl font-medium">
                  {t('account.wallet')}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-white text-xl font-medium">
                  {t('account.currentBalance')}
                </span>

                <div className="mb-6">
                  <span className="text-white text-xl md:text-xl font-black tracking-tight">
                    {currency} {balance !== null ? balance.toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
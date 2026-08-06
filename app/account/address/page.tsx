// app/account/address/page.tsx
"use client";

import { useState, useEffect } from "react";
import SavedAddresses from "@/components/address/SavedAddresses";
import AddAddress from "@/components/address/AddAddress";
import { BsFillPlusCircleFill } from "react-icons/bs";
import toast, { Toaster } from "react-hot-toast";
import { Address } from "@/types/address";
import { useTranslation } from "@/hooks/useTranslation";
import { getHeaders } from "@/services/api";

export default function AddressPage() {
  const { t } = useTranslation();
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = 'https://admin.ekhtarktabak.com/api';

  // جلب جميع العناوين
  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/addresses`, {
        headers: getHeaders(),
      });
      const result = await response.json();
      
      if (result.result === true && Array.isArray(result.data)) {
        setAddresses(result.data);
      } else {
        throw new Error(t('address.fetchError'));
      }
    } catch (error) {
      console.error("❌ خطأ في جلب العناوين:", error);
      toast.error(t('address.fetchError'));
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (newAddress: Address) => {
    await fetchAddresses();
    setShowAddAddress(false);
    setEditingAddress(null);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddAddress(true);
  };

  const handleUpdateAddress = async (updatedAddress: Address) => {
    await fetchAddresses();
    setShowAddAddress(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/addresses/${id}/delete`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      const result = await response.json();
      
      if (result.result === true) {
        toast.success(t('address.deleteSuccess'));
        await fetchAddresses();
      } else {
        throw new Error(result.message || t('address.deleteError'));
      }
    } catch (error) {
      console.error("❌ خطأ في حذف العنوان:", error);
      toast.error(error instanceof Error ? error.message : t('address.deleteError'));
    }
  };

  const handleCloseModal = () => {
    setShowAddAddress(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('address.loadingAddresses')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-l from-[#bdcbf12a] to-[#feecea3b] page-with-padding">
      <div className="container mx-auto">
        <div className="mb-3">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-[#180100]">
              {t('address.savedAddresses')}
            </h1>
          </div>

          <SavedAddresses
            addresses={addresses}
            onDelete={handleDeleteAddress}
            onEdit={handleEditAddress}
          />

          <div className="flex justify-end mt-6">
            <button
              onClick={() => {
                setEditingAddress(null);
                setShowAddAddress(true);
              }}
              className="flex items-center gap-2 text-[#23A6F0] hover:text-[#fa7d10] transition-colors"
              aria-label={t('address.addNew')}
            >
              <BsFillPlusCircleFill className="w-10 h-10" />
            </button>
          </div>

          {showAddAddress && (
            <AddAddress
              key={editingAddress?.id || "new"}
              onClose={handleCloseModal}
              onSave={editingAddress ? handleUpdateAddress : handleAddAddress}
              initialData={editingAddress || undefined}
              isEditing={!!editingAddress}
            />
          )}
        </div>
      </div>
    </div>
  );
}
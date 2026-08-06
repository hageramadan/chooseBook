// services/reviews.ts
import { getHeaders } from './api';

const API_URL = "https://admin.ekhtarktabak.com/api";

export interface ReviewData {
  rating: number;
  comment: string;
  product_id: number;
}

export interface ReviewResponse {
  result: boolean;
  errNum: number;
  message?: string;
  data?: any;
}

/**
 * إرسال تقييم لمنتج
 * @param reviewData بيانات التقييم
 * @returns استجابة من السيرفر
 */
export const submitReview = async (reviewData: ReviewData): Promise<ReviewResponse> => {
  try {
    console.log("📤 Sending review with product_id:", reviewData);
    
    const response = await fetch(`${API_URL}/reviews/store`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(reviewData),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      }
      throw new Error("UNAUTHORIZED");
    }

    const data = await response.json();
    console.log("📥 Review response:", data);
    
    if (data.result === true) {
      return {
        result: true,
        errNum: data.errNum || 200,
        message: data.message || "تم إضافة التقييم بنجاح",
        data: data.data,
      };
    } else {
      return {
        result: false,
        errNum: data.errNum || 400,
        message: data.message || "حدث خطأ في إضافة التقييم",
        data: data.data,
      };
    }
  } catch (error) {
    console.error("❌ Error submitting review:", error);
    
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      throw error;
    }
    
    return {
      result: false,
      errNum: 500,
      message: "حدث خطأ في الاتصال بالخادم",
    };
  }
};
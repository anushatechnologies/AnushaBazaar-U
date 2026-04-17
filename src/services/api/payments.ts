import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.PAYMENT;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/* ================= RAZORPAY INTEGRATION ================= */

export interface RazorpayInitResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  receipt: string;
  keyId: string;
}

/**
 * POST /api/payment/initiate
 * Initiate a Razorpay payment after placing an online order.
 */
export const initiateRazorpayPayment = async (
  token: string,
  orderId: number | string
): Promise<RazorpayInitResponse> => {
  const response = await fetchWithTimeout(`${API_BASE}/initiate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      orderId: Number(orderId),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[initiateRazorpayPayment] FAILED ${response.status}: ${errorText}`);
    throw new Error(errorText || `Request failed with error code ${response.status}`);
  }

  return await response.json();
};

export interface RazorpayVerifyPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  receipt: string;
}

/**
 * POST /api/payment/verify
 * Verify Razorpay payment signature after successful checkout.
 */
export const verifyRazorpayPayment = async (
  token: string,
  payload: RazorpayVerifyPayload
): Promise<{ success: boolean; message?: string }> => {
  const response = await fetchWithTimeout(`${API_BASE}/verify`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[verifyRazorpayPayment] FAILED ${response.status}: ${errorText}`);
    throw new Error(errorText || `Verification failed with error code ${response.status}`);
  }

  return await response.json();
};

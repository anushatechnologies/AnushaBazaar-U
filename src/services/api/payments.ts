import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.PAYMENT;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface InitiateOnlinePaymentResponse {
  success?: boolean;
  access_key: string;
  [key: string]: unknown;
}

export const initiateOnlinePayment = async (
  token: string,
  orderId: number | string
): Promise<InitiateOnlinePaymentResponse> => {
  const response = await fetchWithTimeout(`${API_BASE}/initiate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      orderId: Number(orderId),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[initiateOnlinePayment] FAILED ${response.status}: ${errorText}`);
    throw new Error(errorText || `Request failed with error code ${response.status}`);
  }

  const data = await response.json();
  const accessKey = data?.access_key || data?.accessKey;

  if (!accessKey) {
    throw new Error("Payment initiation succeeded but no Easebuzz access key was returned.");
  }

  return {
    ...data,
    access_key: accessKey,
  };
};

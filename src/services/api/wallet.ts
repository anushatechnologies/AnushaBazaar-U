import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.WALLET;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface WalletBalance {
  balance: number;
  currency?: string;
}

export interface WalletTransaction {
  id: number | string;
  amount: number;
  type: string;          // "CREDIT" | "DEBIT"
  description?: string;
  createdAt?: string;
  orderId?: number | string;
}

/**
 * GET /api/wallet/balance/{useMainId}
 * Returns the wallet balance for the given user.
 */
export const getWalletBalance = async (
  token: string,
  userId: number | string
): Promise<WalletBalance> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/balance/${userId}`, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.error(`[getWalletBalance] FAILED ${response.status}: ${API_BASE}/balance/${userId}`);
      return { balance: 0 };
    }
    const data = await response.json();

    // Handle various shapes
    if (typeof data === "number") return { balance: data };
    return {
      balance: data?.balance ?? data?.amount ?? data?.walletBalance ?? 0,
      currency: data?.currency || "INR",
    };
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return { balance: 0 };
  }
};

/**
 * GET /api/wallet/history/{useMainId}
 * Returns wallet transaction history.
 */
export const getWalletHistory = async (
  token: string,
  userId: number | string
): Promise<WalletTransaction[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/history/${userId}`, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.error(`[getWalletHistory] FAILED ${response.status}: ${API_BASE}/history/${userId}`);
      return [];
    }
    const data = await response.json();

    // Handle various response shapes
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.transactions && Array.isArray(data.transactions)) return data.transactions;
    if (data?.history && Array.isArray(data.history)) return data.history;
    if (data?.content && Array.isArray(data.content)) return data.content;
    return [];
  } catch (error) {
    console.error("Error fetching wallet history:", error);
    return [];
  }
};

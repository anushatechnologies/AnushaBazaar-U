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
    const response = await fetchWithTimeout(`${API_BASE}/balance/${userId}?t=${Date.now()}`, {
      headers: authHeaders(token),
      cache: "no-store",
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
    const response = await fetchWithTimeout(`${API_BASE}/history/${userId}?t=${Date.now()}`, {
      headers: authHeaders(token),
      cache: "no-store",
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

/**
 * POST /api/wallet/add
 * Add money to wallet.
 */
export const addWalletMoney = async (
  token: string,
  userMainId: number | string,
  amount: number,
  description: string = "Wallet topup"
): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/add`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        userMainId: Number(userMainId),
        amount,
        description,
      }),
    });
    
    if (!response.ok) {
      console.error(`[addWalletMoney] FAILED ${response.status}: ${API_BASE}/add`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error adding wallet money:", error);
    return false;
  }
};

/**
 * POST /api/wallet/spend or /api/wallet/debit
 * Deduct money from wallet.
 */
export const spendWalletMoney = async (
  token: string,
  userMainId: number | string,
  amount: number,
  description: string = "Payment for order"
): Promise<boolean> => {
  try {
    // Attempt /debit, then /spend, then /deduct based on backend API conventions.
    const payload = {
      userMainId: Number(userMainId),
      customerId: Number(userMainId), // Fallback safety
      userId: Number(userMainId), // Fallback safety
      amount,
      description,
    };

    let response = await fetchWithTimeout(`${API_BASE}/debit`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.warn(`[spendWalletMoney] /debit failed (${response.status}). Trying /spend...`);
      response = await fetchWithTimeout(`${API_BASE}/spend`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
         console.warn(`[spendWalletMoney] /spend failed (${response.status}). Trying /deduct...`);
         response = await fetchWithTimeout(`${API_BASE}/deduct`, {
           method: "POST",
           headers: authHeaders(token),
           body: JSON.stringify(payload),
         });
      }
    }
    
    if (!response.ok) {
      console.error(`[spendWalletMoney] ALL endpoints failed with status ${response.status}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error spending wallet money:", error);
    return false;
  }
};

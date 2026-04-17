import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.POLICIES;

export type PolicyType = "PRIVACY_POLICY" | "TERMS_CONDITIONS" | "RETURNS_REFUNDS";

export interface PolicyResponse {
  id: number;
  type: string;
  content: string;
  updatedAt: string;
}

/**
 * Fetch a specific policy by its type.
 * GET /api/policies/{type}
 */
export const getPolicy = async (type: PolicyType): Promise<PolicyResponse | null> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${type}`);
    if (!response.ok) {
      console.error(`[getPolicy] FAILED ${response.status}: ${API_BASE}/${type}`);
      return null;
    }
    const data = await response.json();
    return data?.policy || data; // Backend might wrap it in { success: true, policy: {...} }
  } catch (error) {
    console.error(`Error fetching policy ${type}:`, error);
    return null;
  }
};

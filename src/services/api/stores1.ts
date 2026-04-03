import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.STORES1;

/**
 * Section 17.1: Get All Stores1 (Paginated)
 * URL: /api/stores1?page=0&size=10&search=hyd
 */
export const getStores1 = async (params: { page?: number; size?: number; search?: string } = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", String(params.page));
    if (params.size !== undefined) queryParams.append("size", String(params.size));
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`[getStores1] FAILED ${response.status}: ${url}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching stores1:", error);
    return { content: [], totalElements: 0 };
  }
};

/**
 * Section 17.2: Get Stores1 by ID
 * URL: /api/stores1/{id}
 */
export const getStore1ById = async (id: number | string) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${id}`);
    if (!response.ok) {
      console.error(`[getStore1ById] FAILED ${response.status}: ${API_BASE}/${id}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching store1 ${id}:`, error);
    return null;
  }
};

import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.STORES;

/**
 * Section 9.1: Get All Stores (Paginated)
 * URL: /api/stores?page=0&size=10&name=grocery
 */
export const getStores = async (params: { page?: number; size?: number; name?: string } = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", String(params.page));
    if (params.size !== undefined) queryParams.append("size", String(params.size));
    if (params.name) queryParams.append("name", params.name);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`[getStores] FAILED ${response.status}: ${url}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching stores:", error);
    return { content: [], totalElements: 0 };
  }
};

/**
 * Section 9.2: Get Store by ID
 * URL: /api/stores/{id}
 */
export const getStoreById = async (id: number | string) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${id}`);
    if (!response.ok) {
      console.error(`[getStoreById] FAILED ${response.status}: ${API_BASE}/${id}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching store ${id}:`, error);
    return null;
  }
};

/**
 * Section 9.3: Suggest Stores (Autocomplete)
 * URL: /api/stores/suggest?q=anush
 */
export const suggestStores = async (query: string) => {
  try {
    const url = `${API_BASE}/suggest?q=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`[suggestStores] FAILED ${response.status}: ${url}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error suggesting stores:", error);
    return [];
  }
};

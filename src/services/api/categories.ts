import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.CATEGORIES;

export const getCategories = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}`);
    if (!response.ok) {
      console.error(`[getCategories] FAILED ${response.status}: ${API_BASE}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const getCategoryById = async (id: string | number) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${id}`);
    if (!response.ok) {
      console.error(`[getCategoryById] FAILED ${response.status}: ${API_BASE}/${id}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    return null;
  }
};

export const searchCategories = async (keyword: string) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}`);
    if (!response.ok) {
      console.error(`[searchCategories] FAILED ${response.status}: ${API_BASE}/search?keyword=${keyword}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error searching categories:", error);
    return [];
  }
};

export const getDiscountCategories = async (discount: number) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/filter/discount?minDiscount=${discount}`);
    if (!response.ok) {
      console.error(`[getDiscountCategories] FAILED ${response.status}: ${API_BASE}/filter/discount?minDiscount=${discount}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching discount categories:", error);
    return [];
  }
};

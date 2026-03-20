import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.SUBCATEGORIES;
export const getAllSubcategories = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}`);
    if (!response.ok) {
      console.error(`[getAllSubcategories] FAILED ${response.status}: ${API_BASE}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching all subcategories:", error);
    return [];
  }
};

export const getSubcategoriesByCategory = async (categoryId: string | number) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${categoryId}`);
    if (!response.ok) {
      console.error(`[getSubcategoriesByCategory] FAILED ${response.status}: ${API_BASE}/${categoryId}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching subcategories for category ${categoryId}:`, error);
    return [];
  }
};

export const getSubcategoryById = async (id: string | number) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/detail/${id}`);
    if (!response.ok) {
      console.error(`[getSubcategoryById] FAILED ${response.status}: ${API_BASE}/detail/${id}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching subcategory ${id}:`, error);
    return null;
  }
};

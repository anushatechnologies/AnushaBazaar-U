import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.BANNERS;

export interface Banner {
  id: string | number;
  image: string;
  tag?: string;
  title?: string;
  subtitle?: string;
  tagBg?: string;
}

export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const response = await fetchWithTimeout(API_BASE);
    if (!response.ok) {
      console.error(`[getActiveBanners] FAILED ${response.status}: ${API_BASE}`);
      return [];
    }
    const json = await response.json();
    const items = Array.isArray(json) ? json : json.value || json.data || [];
    
    return items.map((item: any) => ({
      id: item.id || item._id,
      image: item.image || item.imageUrl,
      tag: item.tag || "SALE",
      title: item.title || "",
      subtitle: item.subtitle || "",
      tagBg: item.tagBg || "#0A8754",
    }));
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
};

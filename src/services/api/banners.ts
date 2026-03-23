import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.BANNERS;

export interface Banner {
  id: string | number;
  name?: string;
  image: string;
  videoUrl?: string | null;
  targetUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  
  // Legacy fields (kept for backward compatibility with UI components)
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
      name: item.name || "",
      image: item.imageUrl || item.image || "",
      videoUrl: item.videoUrl || null,
      targetUrl: item.targetUrl || null,
      displayOrder: item.displayOrder || 0,
      isActive: item.isActive !== undefined ? item.isActive : true,
    }));
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
};

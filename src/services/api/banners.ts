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
    console.log("[getActiveBanners] Raw Response Type:", typeof json, Array.isArray(json) ? "Array" : "Object");
    
    // Handle JHipster/Spring style pagination in 'content' or 'data' or 'value'
    let rawItems = [];
    if (Array.isArray(json)) {
      rawItems = json;
    } else if (json.content && Array.isArray(json.content)) {
      rawItems = json.content;
    } else if (json.data && Array.isArray(json.data)) {
      rawItems = json.data;
    } else if (json.value && Array.isArray(json.value)) {
      rawItems = json.value;
    } else if (json.banners && Array.isArray(json.banners)) {
      rawItems = json.banners;
    }

    console.log(`[getActiveBanners] Found ${rawItems.length} potential banners`);
    
    return rawItems.map((item: any) => ({
      id: item.id || item._id,
      name: item.name || item.title || "",
      // Support multiple image field name variations
      image: item.imageUrl || item.image || item.bannerImage || item.path || "",
      videoUrl: item.videoUrl || null,
      targetUrl: item.targetUrl || item.link || null,
      displayOrder: item.displayOrder || item.order || 0,
      isActive: item.isActive !== undefined ? item.isActive : true,
    })).filter((b: Banner) => b.image); // Only return banners that actually have an image
    
  } catch (error) {
    console.error("[getActiveBanners] Exception:", error);
    return [];
  }
};

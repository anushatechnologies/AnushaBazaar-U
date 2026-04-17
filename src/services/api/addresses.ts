import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.ADDRESSES;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface AddressPayload {
  customerId?: number | string;
  addressType?: string;       // "HOME" | "WORK" | "OTHER"
  type?: string;              // Backend may use "type" instead of "addressType"
  addressLine1?: string;
  street?: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state?: string;
  postalCode?: string;
  pincode?: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
}

/**
 * GET /api/addresses/customer/{customerId} – fetch all saved addresses
 * Falls back to GET /api/addresses if customerId is not available
 */
export const getAddresses = async (token: string, _customerId?: number | string) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      console.error(`[getAddresses] FAILED ${response.status}: ${API_BASE}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
};

/**
 * POST /api/addresses – add a new address
 * Body: { customerId, street, city, pincode, type, ... }
 */
export const addAddress = async (token: string, data: AddressPayload) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[addAddress] FAILED ${response.status}: ${API_BASE}`, errorText);
      return null;
    }
    if (response.status === 204 || response.status === 201) {
      // Try to read body if present, otherwise treat as success
      const text = await response.text().catch(() => "");
      if (!text || text.trim().length === 0) return true;
      try { return JSON.parse(text); } catch { return true; }
    }
    const text = await response.text();
    if (!text || text.trim().length === 0) return true;
    try { return JSON.parse(text); } catch { return true; }
  } catch (error) {
    console.error("Error adding address:", error);
    return null;
  }
};

/** PUT /api/addresses/{id} – update an existing address */
export const updateAddress = async (
  token: string,
  id: number | string,
  data: Partial<AddressPayload>
) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[updateAddress] FAILED ${response.status}: ${API_BASE}/${id}`, errorText);
      return null;
    }
    // 204 No Content = success with no body
    if (response.status === 204) return true;
    // Try to parse JSON; if the body is empty or not JSON, still treat as success
    const text = await response.text();
    if (!text || text.trim().length === 0) return true;
    try {
      return JSON.parse(text);
    } catch {
      // Non-JSON body but status was OK — still a success
      return true;
    }
  } catch (error) {
    console.error("Error updating address:", error);
    return null;
  }
};

/** DELETE /api/addresses/{id} – delete an address */
export const deleteAddress = async (token: string, id: number | string) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (response.status === 204) return true;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error("Error deleting address:", error);
    return false;
  }
};

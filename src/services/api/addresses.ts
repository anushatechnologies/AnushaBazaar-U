import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";

const API_BASE = API_CONFIG.ENDPOINTS.ADDRESSES;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface AddressPayload {
  addressType: string;       // "home" | "work" | "other"
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

/** GET /api/addresses – fetch all saved addresses */
export const getAddresses = async (token: string) => {
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

/** POST /api/addresses – add a new address */
export const addAddress = async (token: string, data: AddressPayload) => {
  try {
    const response = await fetchWithTimeout(API_BASE, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error(`[addAddress] FAILED ${response.status}: ${API_BASE}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
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
      console.error(`[updateAddress] FAILED ${response.status}: ${API_BASE}/${id}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
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

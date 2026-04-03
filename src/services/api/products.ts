import { API_CONFIG, fetchWithTimeout } from "@/config/api.config";
import { normalizeImageUrl } from "@/utils/image";
import { getProductPackLabel } from "@/utils/product";

const API_BASE = API_CONFIG.ENDPOINTS.PRODUCTS;
const CUSTOMER_BASE = API_CONFIG.ENDPOINTS.CUSTOMER;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const readErrorMessage = async (response: Response) => {
  try {
    const text = await response.text();
    if (!text) return `HTTP ${response.status}`;

    try {
      const parsed = JSON.parse(text);
      return parsed.message || parsed.error || text;
    } catch {
      return text;
    }
  } catch {
    return `HTTP ${response.status}`;
  }
};

const normalizeRatingsList = (payload: any) => {
  const base =
    Array.isArray(payload)
      ? payload
      : payload?.data ||
        payload?.ratings ||
        payload?.content ||
        payload?.value ||
        payload?.result ||
        [];

  const list = Array.isArray(base) ? base : [];

  return list.map((entry: any) => ({
    ...entry,
    rating: Number(entry?.rating ?? entry?.stars ?? 0),
    comment: entry?.comment ?? entry?.review ?? "",
  }));
};

export interface Variant {
  id: string | number;
  name?: string;
  variantName?: string;
  price: number;
  sellingPrice: number;
  mrp: number;
  discountPrice?: number;
  unit?: string;
  quantity?: string | number;
}

export interface Product {
  id: string;
  name: string;
  title?: string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  price: number;
  originalPrice?: number;
  mrp?: number;
  unit?: string;
  quantity?: string | number;
  productVariants: Variant[];
  variantId?: string | number;
  minPrice?: number;
}

const mapProducts = (json: any): Product[] => {
  const items = Array.isArray(json) ? json : json.value || json.data || [];
  const list = items.content ? items.content : items;
  return (Array.isArray(list) ? list : []).map((p: any) => {
    const variants = p.variants || p.productVariants || [];
    const normalizedVariants: Variant[] = variants.map((v: any) => {
      // The backend sends:
      //   v.price = MRP (original price)
      //   v.sellingPrice = the actual selling price customers pay
      //   v.discountPrice = the discount AMOUNT (how much is saved)
      // We must ALWAYS use v.sellingPrice as the selling price.
      // Only fall back to v.price (MRP) if sellingPrice is truly missing.
      const resolvedSellingPrice = v.sellingPrice ?? v.price ?? 0;
      const resolvedMrp = v.mrp ?? v.price ?? resolvedSellingPrice;

      return {
        ...v,
        variantName: v.name || v.variantName,
        sellingPrice: resolvedSellingPrice,
        mrp: resolvedMrp,
        unit: getProductPackLabel(v) || v.unit || v.unitName,
        quantity: v.quantity ?? v.qty ?? v.packQuantity ?? v.netQuantity,
      };
    });
    const firstVariant = normalizedVariants[0];

    // Normalize gallery images: handle string[] or {imageUrl: string}[]
    const galleryItems = Array.isArray(p.images) 
      ? p.images.map((img: any) => {
          if (typeof img === 'string') return normalizeImageUrl(img);
          if (img && typeof img === 'object' && img.imageUrl) return normalizeImageUrl(img.imageUrl);
          return null;
        }).filter(Boolean)
      : [];

    const primaryImage =
      normalizeImageUrl(
        p.imageUrl ||
          p.image ||
          p.thumbnail ||
          p.productImage ||
          p.icon ||
          (galleryItems.length > 0 ? galleryItems[0] : "")
      ) || "";

    return {
      ...p,
      id: String(p.id || p._id),
      image: primaryImage,
      imageUrl: primaryImage,
      gallery: galleryItems,
      images: galleryItems,
      thumbnail: normalizeImageUrl(p.thumbnail) || primaryImage,
      productVariants: normalizedVariants,
      variantId: firstVariant?.id,
      unit: getProductPackLabel(p, firstVariant) || p.unit || p.unitName || firstVariant?.unit,
      quantity: p.quantity ?? p.qty ?? p.packQuantity ?? p.netQuantity ?? firstVariant?.quantity,
      price: firstVariant ? firstVariant.sellingPrice : (p.minPrice || p.price || 0),
    };
  });
};

export const getProducts = async (storeId?: string | number): Promise<Product[]> => {
  try {
    const url = storeId ? `${API_BASE}?storeId=${storeId}` : `${API_BASE}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`[getProducts] FAILED ${response.status}: ${url}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return mapProducts(json);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getProductById = async (id: string | number): Promise<Product | null> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/${id}`);
    if (!response.ok) {
      console.error(`[getProductById] FAILED ${response.status}: ${API_BASE}/${id}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    // If it's a single object, wrap it in an array to use the mapper, then pick the first
    const mapped = mapProducts(json);
    return mapped.length > 0 ? mapped[0] : (json.id ? mapProducts([json])[0] : null);
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
};

export const searchProducts = async (keyword: string): Promise<Product[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}`);
    if (!response.ok) {
      console.error(`[searchProducts] FAILED ${response.status}: ${API_BASE}/search?keyword=${keyword}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return mapProducts(json);
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
};

export const getTrendingProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/trending`);
    
    if (!response.ok) {
      console.error(`[getTrendingProducts] FAILED ${response.status}: ${API_BASE}/trending`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return mapProducts(json);
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
};

interface FilterProductParams {
  categoryId?: string | number;
  subCategoryId?: string | number;
  storeId?: string | number;
  minPrice?: number;
  maxPrice?: number;
  trending?: boolean;
  keyword?: string;
}

export const filterProducts = async (params: FilterProductParams): Promise<Product[]> => {
  try {
    // Construct query string dynamically
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE}/filter?${queryString}` : `${API_BASE}/filter`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`[filterProducts] FAILED ${response.status}: ${url}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return mapProducts(json);
  } catch (error) {
    console.error("Error filtering products:", error);
    return [];
  }
};

export const getBestSellerProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/bestseller`);
    if (!response.ok) {
      console.error(`[getBestSellerProducts] FAILED ${response.status}: ${API_BASE}/bestseller`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return mapProducts(json);
  } catch (error) {
    console.error("Error fetching best seller products:", error);
    return [];
  }
};

export const getProductsBySubcategory = async (subCategoryId: string | number): Promise<Product[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/filter?subCategoryId=${subCategoryId}`);
    if (!response.ok) {
      console.error(`[getProductsBySubcategory] FAILED ${response.status}: ${API_BASE}/filter?subCategoryId=${subCategoryId}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return mapProducts(json);
  } catch (error) {
    console.error(`Error fetching products for subcategory ${subCategoryId}:`, error);
    return [];
  }
};

/* ================= RATINGS & WISHLIST ================= */

export const submitProductRating = async (
  token: string,
  data: {
    customerId?: number | string;
    productId: number | string;
    rating: number;
    comment: string;
  }
): Promise<{ ok: boolean; status?: number; message?: string }> => {
  try {
    const body = {
      productId: Number(data.productId),
      rating: Number(data.rating),
      comment: data.comment.trim(),
    };

    const response = await fetchWithTimeout(`${CUSTOMER_BASE}/products/rating`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: await readErrorMessage(response),
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("Error submitting rating:", error);
    return { ok: false, message: "Could not submit rating right now." };
  }
};

export const getProductRatings = async (productId: string | number): Promise<any[]> => {
  try {
    const response = await fetchWithTimeout(`${CUSTOMER_BASE}/products/${productId}/ratings`);
    if (!response.ok) return [];
    const json = await response.json();
    return normalizeRatingsList(json);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return [];
  }
};

export const addToWishlistApi = async (
  token: string,
  productId: number | string,
  _customerId?: number | string
): Promise<boolean> => {
  try {
    const body = { productId: Number(productId) };

    const response = await fetchWithTimeout(`${CUSTOMER_BASE}/products/wishlist`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return false;
  }
};

export const removeFromWishlistApi = async (
  token: string,
  productId: number | string,
  _customerId?: number | string
): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(`${CUSTOMER_BASE}/products/wishlist?productId=${productId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return response.ok;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }
};

export const mergeWishlistApi = async (
  token: string,
  productIds: (number | string)[]
): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(`${CUSTOMER_BASE}/products/wishlist/merge`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        productIds: productIds.map((id) => Number(id)),
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error merging wishlist:", error);
    return false;
  }
};

export const getWishlistApi = async (
  token: string,
  _customerId?: number | string
): Promise<Product[]> => {
  try {
    const response = await fetchWithTimeout(`${CUSTOMER_BASE}/products/wishlist`, {
      headers: authHeaders(token),
    });

    if (!response.ok) return [];

    const json = await response.json();
    return mapProducts(json);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }
};

import { API_CONFIG } from "@/config/api.config";

const API_ORIGIN = (() => {
  try {
    return new URL(API_CONFIG.BASE_URL).origin;
  } catch {
    return "";
  }
})();

const LOCAL_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|10\.0\.2\.2|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/i;

const isLocalHost = (host: string) => LOCAL_HOST_PATTERN.test(host);

export const normalizeImageUrl = (value?: unknown): string | null => {
  if (typeof value !== "string") return null;

  let raw = value.trim();
  if (!raw) return null;

  // Normalize windows-style paths returned by some backends.
  raw = raw.replace(/\\/g, "/");

  if (raw.startsWith("data:image/")) {
    return raw;
  }

  if (raw.startsWith("//")) {
    raw = `https:${raw}`;
  }

  const hasProtocol = /^https?:\/\//i.test(raw);
  const isRelative = raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../");

  try {
    if (hasProtocol) {
      const parsed = new URL(raw);
      if (parsed.protocol === "http:" && !isLocalHost(parsed.hostname)) {
        parsed.protocol = "https:";
      }
      return encodeURI(parsed.toString());
    }

    if (API_ORIGIN) {
      const normalizedPath = isRelative ? raw.replace(/^\.?\//, "/") : `/${raw}`;
      return encodeURI(`${API_ORIGIN}${normalizedPath}`);
    }
  } catch (error) {
    console.log("[normalizeImageUrl] Failed to parse image URL:", raw, error);
  }

  return null;
};

export const resolveImageSource = (value?: unknown) => {
  if (typeof value === "number") {
    return value;
  }

  const normalized = normalizeImageUrl(value);
  return normalized ? { uri: normalized } : null;
};

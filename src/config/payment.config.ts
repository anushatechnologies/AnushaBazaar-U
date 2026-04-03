const normalizeEasebuzzPayMode = (value?: string): "test" | "production" => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "test" ? "test" : "production";
};

export const PAYMENT_CONFIG = {
  EASEBUZZ_PAY_MODE: normalizeEasebuzzPayMode(process.env.EXPO_PUBLIC_EASEBUZZ_PAY_MODE),
};

export default PAYMENT_CONFIG;

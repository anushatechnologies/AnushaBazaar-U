export const PAYMENT_CONFIG = {
  // Only the key_id is needed client-side for Razorpay checkout.
  // The secret must NEVER be shipped in the app bundle — the backend handles signature verification.
  RAZORPAY_KEY_ID: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_SbM0kquPy1mbuq",
};

export default PAYMENT_CONFIG;

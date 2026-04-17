import RazorpayCheckout from "react-native-razorpay";
import PAYMENT_CONFIG from "@/config/payment.config";

export interface RazorpayCheckoutOptions {
  description?: string;
  image?: string;
  currency?: string;
  key: string;
  amount: number; // in paise (e.g. ₹100 = 10000)
  name: string;
  order_id: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
    method?: string;
  };
  theme?: {
    color?: string;
  };
  notes?: Record<string, string>;
  config?: {
    display?: {
      blocks?: Record<string, any>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  code: number;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

/**
 * Check if Razorpay is available (always true with react-native-razorpay)
 */
export const isRazorpayAvailable = (): boolean => {
  return typeof RazorpayCheckout?.open === "function";
};

/**
 * Open the Razorpay checkout and return the payment result.
 */
export const startRazorpayCheckout = async (
  options: RazorpayCheckoutOptions
): Promise<RazorpaySuccessResponse> => {
  if (!isRazorpayAvailable()) {
    throw new Error(
      "Razorpay native module is not available. Rebuild the app with react-native-razorpay."
    );
  }

  const result = await RazorpayCheckout.open(options);
  return result as RazorpaySuccessResponse;
};

/**
 * Build the standard Razorpay checkout options.
 */
export const buildRazorpayOptions = (params: {
  razorpayOrderId: string;
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  key?: string;
}): RazorpayCheckoutOptions => {
  return {
    key: params.key || PAYMENT_CONFIG.RAZORPAY_KEY_ID,
    amount: Math.round(Number(params.amount || 0)),
    currency: params.currency || "INR",
    name: "Anusha Bazaar",
    description: `Order ${params.receipt || ""}`.trim(),
    image: "https://api.anushatechnologies.com/favicon.ico",
    order_id: params.razorpayOrderId,
    prefill: {
      email: params.userEmail || "",
      contact: params.userPhone || "",
      name: params.userName || "",
      method: "upi",
    },
    theme: {
      color: "#0A8754",
    },
    config: {
      display: {
        blocks: {
          upi: {
            name: "Pay using UPI",
            instruments: [
              { method: "upi", flows: ["intent", "collect", "qr"] },
            ],
          },
          other: {
            name: "Other Payment Methods",
            instruments: [
              { method: "card" },
              { method: "netbanking" },
              { method: "wallet" },
            ],
          },
        },
        sequence: ["block.upi", "block.other"],
        preferences: {
          show_default_blocks: false,
        },
      },
    },
  };
};

/**
 * Get a user-friendly message from a Razorpay error.
 */
export const getRazorpayErrorMessage = (error: any): string => {
  if (typeof error === "object" && error?.description) {
    return error.description;
  }
  if (typeof error === "object" && error?.error?.description) {
    return error.error.description;
  }
  if (error?.message) {
    return error.message;
  }
  return "Payment could not be completed. Please try again.";
};

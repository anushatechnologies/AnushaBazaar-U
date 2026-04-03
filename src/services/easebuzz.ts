import { NativeModules, Platform } from "react-native";
import PAYMENT_CONFIG from "@/config/payment.config";

const MODULE_NAME = "EasebuzzCheckout";

type EasebuzzNativeModule = {
  open(accessKey: string, payMode: string): Promise<{
    result?: string;
    paymentResponse?: string | null;
  }>;
};

const nativeEasebuzzModule = NativeModules[MODULE_NAME] as EasebuzzNativeModule | undefined;

export const EASEBUZZ_RESULTS = {
  SUCCESS: "payment_successfull",
  FAILED: "payment_failed",
  TIMEOUT: "txn_session_timeout",
  BACK_PRESSED: "back_pressed",
  USER_CANCELLED: "user_cancelled",
  SERVER_ERROR: "error_server_error",
  NO_RETRY: "error_noretry",
  INVALID_INPUT: "invalid_input_data",
  RETRY_FAILED: "retry_fail_error",
  TXN_NOT_ALLOWED: "trxn_not_allowed",
  BANK_BACK_PRESSED: "bank_back_pressed",
  NO_DATA: "no_data",
} as const;

export interface EasebuzzCheckoutResult {
  result: string;
  paymentResponse: Record<string, unknown> | null;
  paymentResponseRaw: string | null;
}

const RESULT_MESSAGES: Record<string, string> = {
  [EASEBUZZ_RESULTS.SUCCESS]: "Payment completed successfully.",
  [EASEBUZZ_RESULTS.FAILED]: "The bank reported the payment as failed.",
  [EASEBUZZ_RESULTS.TIMEOUT]: "The payment session timed out before completion.",
  [EASEBUZZ_RESULTS.BACK_PRESSED]: "The payment flow was closed using the back button.",
  [EASEBUZZ_RESULTS.USER_CANCELLED]: "The payment was cancelled before completion.",
  [EASEBUZZ_RESULTS.SERVER_ERROR]: "Easebuzz reported a server-side payment error.",
  [EASEBUZZ_RESULTS.NO_RETRY]: "The payment could not be retried and is marked as failed.",
  [EASEBUZZ_RESULTS.INVALID_INPUT]: "Easebuzz rejected the payment request details.",
  [EASEBUZZ_RESULTS.RETRY_FAILED]: "A payment retry was attempted but still failed.",
  [EASEBUZZ_RESULTS.TXN_NOT_ALLOWED]: "The bank did not allow this transaction.",
  [EASEBUZZ_RESULTS.BANK_BACK_PRESSED]: "The bank page was closed before the payment finished.",
  [EASEBUZZ_RESULTS.NO_DATA]: "The payment screen closed before a final result was returned.",
};

export const isEasebuzzAvailable = () =>
  Platform.OS === "android" && typeof nativeEasebuzzModule?.open === "function";

export const isEasebuzzSuccess = (result: string) => result === EASEBUZZ_RESULTS.SUCCESS;

export const getEasebuzzResultMessage = (result: string) =>
  RESULT_MESSAGES[result] || "The payment could not be completed.";

export const startEasebuzzCheckout = async (
  accessKey: string
): Promise<EasebuzzCheckoutResult> => {
  if (Platform.OS !== "android") {
    throw new Error("Easebuzz checkout is currently available only on Android.");
  }

  if (!nativeEasebuzzModule?.open) {
    throw new Error("Easebuzz native module is not available. Rebuild the Android app to enable online payments.");
  }

  const response = await nativeEasebuzzModule.open(
    accessKey,
    PAYMENT_CONFIG.EASEBUZZ_PAY_MODE
  );

  const paymentResponseRaw = response?.paymentResponse ?? null;
  let paymentResponse: Record<string, unknown> | null = null;

  if (paymentResponseRaw) {
    try {
      paymentResponse = JSON.parse(paymentResponseRaw) as Record<string, unknown>;
    } catch (error) {
      console.warn("Failed to parse Easebuzz payment response:", error);
    }
  }

  return {
    result: response?.result || EASEBUZZ_RESULTS.NO_DATA,
    paymentResponse,
    paymentResponseRaw,
  };
};

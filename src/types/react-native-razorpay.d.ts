declare module "react-native-razorpay" {
  interface RazorpayCheckout {
    open(options: Record<string, any>): Promise<{
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }>;
  }

  const RazorpayCheckout: RazorpayCheckout;
  export default RazorpayCheckout;
}

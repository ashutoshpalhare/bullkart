import { useServerFn } from "@tanstack/react-start";
import { createRazorpayOrder, markPaymentFailed, verifyRazorpayPayment } from "@/lib/payments.functions";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void; on: (event: string, cb: (e: unknown) => void) => void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

async function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") throw new Error("Payments run in the browser only.");
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Couldn't load the payment window.")), {
      once: true,
    });
    if (!existing) document.body.appendChild(script);
  });
  if (!window.Razorpay) throw new Error("Couldn't load the payment window.");
}

export type PayerDetails = { name?: string; email?: string; phone?: string };

/**
 * Opens Razorpay Checkout for an order that already exists in the database.
 * Every amount and signature is decided server-side; this only drives the UI.
 */
export function useRazorpayCheckout() {
  const createOrder = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);
  const fail = useServerFn(markPaymentFailed);

  return async (orderId: string, payer: PayerDetails = {}): Promise<void> => {
    const session = await createOrder({ data: { orderId } });
    await loadCheckoutScript();

    await new Promise<void>((resolve, reject) => {
      const rzp = new window.Razorpay!({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        name: "BullKart",
        description: `Order ${session.orderNumber}`,
        order_id: session.providerOrderId,
        prefill: { name: payer.name ?? "", email: payer.email ?? "", contact: payer.phone ?? "" },
        theme: { color: "#2E7D32" },
        modal: {
          ondismiss: () => {
            void fail({ data: { orderId, reason: "Payment window closed" } });
            reject(new Error("Payment was cancelled."));
          },
        },
        handler: (response: RazorpayResponse) => {
          verify({
            data: {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
          })
            .then(() => resolve())
            .catch(reject);
        },
      });
      rzp.on("payment.failed", (event: unknown) => {
        const description =
          (event as { error?: { description?: string } })?.error?.description ?? "Payment failed";
        void fail({ data: { orderId, reason: description } });
        reject(new Error(description));
      });
      rzp.open();
    });
  };
}

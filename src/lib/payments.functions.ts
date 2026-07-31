import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RAZORPAY_API = "https://api.razorpay.com/v1";

const createSchema = z.object({ orderId: z.string().uuid() });
const verifySchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(6).max(64),
  razorpayPaymentId: z.string().min(6).max(64),
  razorpaySignature: z.string().min(16).max(256),
});
const refundSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000).optional(),
  reason: z.string().trim().max(300).optional(),
});

export type RazorpayOrderPayload = {
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
};

/**
 * Creates a Razorpay order for an existing BullKart order.
 * Amount is read from the database, never from the client.
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }): Promise<RazorpayOrderPayload> => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) {
      throw new Error("Online payments aren't configured yet. Please choose Cash on Delivery.");
    }

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total, payment_status, user_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw error;
    if (!order || order.user_id !== context.userId) throw new Error("Order not found.");
    if (order.payment_status === "paid") throw new Error("This order is already paid.");

    const amountPaise = Math.round(Number(order.total) * 100);
    if (amountPaise <= 0) throw new Error("Nothing left to pay on this order.");

    const response = await fetch(`${RAZORPAY_API}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: order.order_number,
        notes: { bullkart_order_id: order.id },
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Razorpay order create failed [${response.status}]: ${body}`);
      throw new Error("We couldn't start the payment. Please try again.");
    }
    const created = (await response.json()) as { id: string; amount: number; currency: string };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("payments")
      .update({ provider: "razorpay", method: "razorpay", provider_order_id: created.id })
      .eq("order_id", order.id);

    return {
      keyId,
      providerOrderId: created.id,
      amount: created.amount,
      currency: created.currency,
      orderNumber: order.order_number,
    };
  });

/** Verifies the Razorpay signature server-side and marks the order paid. */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("Online payments aren't configured yet.");

    const { createHmac, timingSafeEqual } = await import("node:crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");
    const provided = Buffer.from(data.razorpaySignature);
    const expectedBuf = Buffer.from(expected);
    const valid = provided.length === expectedBuf.length && timingSafeEqual(provided, expectedBuf);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, order_number")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Order not found.");

    if (!valid) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          error_code: "SIGNATURE_MISMATCH",
          error_message: "Payment signature verification failed",
          provider_payment_id: data.razorpayPaymentId,
        })
        .eq("order_id", order.id);
      throw new Error("We couldn't verify that payment. You have not been charged twice — contact support.");
    }

    await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        provider_payment_id: data.razorpayPaymentId,
        provider_signature: data.razorpaySignature,
      })
      .eq("order_id", order.id);

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", payment_ref: data.razorpayPaymentId, status: "confirmed" })
      .eq("id", order.id);

    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id,
      type: "order",
      title: "Payment received ✅",
      body: `We've confirmed payment for ${order.order_number}.`,
      link: "/orders",
    });

    return { ok: true };
  });

/** Marks a payment failed so the shopper can retry from the order screen. */
export const markPaymentFailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ orderId: z.string().uuid(), reason: z.string().trim().max(300).optional() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Order not found.");

    await supabaseAdmin
      .from("payments")
      .update({ status: "failed", error_message: data.reason ?? "Payment cancelled by user" })
      .eq("order_id", order.id);
    await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    return { ok: true };
  });

/** Admin-only refund. Calls Razorpay when the payment went through the gateway. */
export const refundOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => refundSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true; refundId: string | null }> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin", {
      _uid: context.userId,
    });
    if (roleError) throw roleError;
    if (!isAdmin) throw new Error("Only admins can issue refunds.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, amount, refunded_amount, provider, provider_payment_id, status")
      .eq("order_id", data.orderId)
      .maybeSingle();
    if (!payment) throw new Error("No payment found for this order.");

    const remaining = Number(payment.amount) - Number(payment.refunded_amount);
    const amount = Math.min(data.amount ?? remaining, remaining);
    if (amount <= 0) throw new Error("This payment is already fully refunded.");

    let providerRefundId: string | null = null;
    if (payment.provider === "razorpay" && payment.provider_payment_id) {
      const keyId = process.env["RAZORPAY_KEY_ID"];
      const keySecret = process.env["RAZORPAY_KEY_SECRET"];
      if (!keyId || !keySecret) throw new Error("Online payments aren't configured yet.");
      const response = await fetch(`${RAZORPAY_API}/payments/${payment.provider_payment_id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        },
        body: JSON.stringify({ amount: Math.round(amount * 100), notes: { reason: data.reason ?? "" } }),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error(`Razorpay refund failed [${response.status}]: ${body}`);
        throw new Error("The payment provider rejected the refund. Please retry.");
      }
      providerRefundId = ((await response.json()) as { id: string }).id;
    }

    await supabaseAdmin.from("refunds").insert({
      payment_id: payment.id,
      order_id: data.orderId,
      amount,
      status: providerRefundId ? "processed" : "pending",
      reason: data.reason ?? null,
      provider_refund_id: providerRefundId,
    });
    await supabaseAdmin
      .from("payments")
      .update({
        refunded_amount: Number(payment.refunded_amount) + amount,
        status: amount >= remaining ? "refunded" : payment.status,
      })
      .eq("id", payment.id);
    await supabaseAdmin.from("orders").update({ payment_status: "refunded" }).eq("id", data.orderId);

    return { ok: true, refundId: providerRefundId };
  });

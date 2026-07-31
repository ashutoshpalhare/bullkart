import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const eventSchema = z.object({
  event: z.string().max(64),
  payload: z.object({
    payment: z
      .object({
        entity: z.object({
          id: z.string().max(64),
          order_id: z.string().max(64).nullable().optional(),
          amount: z.number().nonnegative(),
          status: z.string().max(32),
          error_code: z.string().max(64).nullable().optional(),
          error_description: z.string().max(300).nullable().optional(),
          notes: z.record(z.string(), z.string()).optional(),
        }),
      })
      .optional(),
    refund: z
      .object({
        entity: z.object({
          id: z.string().max(64),
          payment_id: z.string().max(64),
          amount: z.number().nonnegative(),
          status: z.string().max(32),
        }),
      })
      .optional(),
  }),
});

/**
 * Razorpay webhook. Verifies the HMAC signature over the raw body before
 * touching any data, then reconciles payment state server-side. Configure the
 * endpoint in the Razorpay dashboard and store the shared secret as
 * RAZORPAY_WEBHOOK_SECRET.
 */
export const Route = createFileRoute("/api/public/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const raw = await request.text();

        const { createHmac, timingSafeEqual } = await import("node:crypto");
        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const parsed = eventSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return new Response("Bad payload", { status: 400 });
        const { event, payload } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (payload.payment) {
          const p = payload.payment.entity;
          const orderId = p.notes?.["bullkart_order_id"];
          const match = supabaseAdmin.from("payments").select("id, order_id");
          const { data: row } = orderId
            ? await match.eq("order_id", orderId).maybeSingle()
            : await match.eq("provider_order_id", p.order_id ?? "").maybeSingle();

          if (row) {
            if (event === "payment.captured" || event === "order.paid") {
              await supabaseAdmin
                .from("payments")
                .update({ status: "paid", provider_payment_id: p.id, raw: parsed.data })
                .eq("id", row.id);
              await supabaseAdmin
                .from("orders")
                .update({ payment_status: "paid", payment_ref: p.id, status: "confirmed" })
                .eq("id", row.order_id);
            } else if (event === "payment.failed") {
              await supabaseAdmin
                .from("payments")
                .update({
                  status: "failed",
                  provider_payment_id: p.id,
                  error_code: p.error_code ?? null,
                  error_message: p.error_description ?? null,
                  raw: parsed.data,
                })
                .eq("id", row.id);
              await supabaseAdmin
                .from("orders")
                .update({ payment_status: "failed" })
                .eq("id", row.order_id);
            }
          }
        }

        if (payload.refund && event.startsWith("refund.")) {
          const r = payload.refund.entity;
          await supabaseAdmin
            .from("refunds")
            .update({ status: r.status })
            .eq("provider_refund_id", r.id);
        }

        return Response.json({ received: true });
      },
    },
  },
});

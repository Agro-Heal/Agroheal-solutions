import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // ── Handle preflight ──────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reference, userId, orderId, slotQuantity, totalPrice } =
      await req.json();

    if (!reference || !userId || !orderId) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        },
      },
    );

    const paystackData = await paystackRes.json();
    console.log("Paystack response:", JSON.stringify(paystackData));

    if (
      paystackData.status !== true ||
      paystackData.data?.status !== "success"
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment verification failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const amount = paystackData.data.amount / 100;

    const { error: checkoutError } = await supabase
      .from("checkout")
      .update({ status: "paid", transaction_ref: reference })
      .eq("id", orderId);

    if (checkoutError) throw checkoutError;

    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

    const { error: subError } = await supabase
      .from("slot_subscriptions")
      .insert([
        {
          user_id: userId,
          checkout_id: Number(orderId),
          amount,
          slotprice: totalPrice,
          status: "active",
          slots: slotQuantity,
          last_payment_date: new Date().toISOString(),
          next_payment_date: nextPaymentDate.toISOString(),
        },
      ]);

    if (subError) throw subError;

    try {
      await supabase.from("payment_logs").insert({
        user_id: userId,
        reference,
        provider: "paystack",
        amount,
        status: "success",
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("Payment log failed (non-critical):", logErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Slot payment activated" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

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
    const {
      reference,
      provider = "paystack", // default to paystack so existing calls don't break
      userId,
      orderId,
      slotQuantity,
      totalPrice,
    } = await req.json();

    if (!reference || !userId || !orderId) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let isVerified = false;
    let amount = 0;

    // ── Verify with Paystack ──────────────────────────────
    if (provider === "paystack") {
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
        paystackData.status === true &&
        paystackData.data?.status === "success"
      ) {
        isVerified = true;
        amount = paystackData.data.amount / 100; // convert from kobo
      }
    }

    // ── Verify with Flutterwave ───────────────────────────
    // NOTE: reference here must be the numeric transaction_id from Flutterwave
    if (provider === "flutterwave") {
      const flwRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${reference}/verify`,
        {
          headers: {
            Authorization: `Bearer ${Deno.env.get("FLUTTERWAVE_SECRET_KEY")}`,
          },
        },
      );

      const flwData = await flwRes.json();
      console.log("Flutterwave response:", JSON.stringify(flwData));

      if (
        flwData.status === "success" &&
        (flwData.data?.status === "successful" ||
          flwData.data?.status === "completed")
      ) {
        isVerified = true;
        amount = flwData.data.amount; // already in Naira, no conversion needed
      }
    }

    // ── Reject if verification failed ────────────────────
    if (!isVerified) {
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

    // ── Update checkout row ───────────────────────────────
    const { error: checkoutError } = await supabase
      .from("checkout")
      .update({ status: "paid", transaction_ref: reference })
      .eq("id", Number(orderId));

    if (checkoutError) throw checkoutError;

    // ── Create slot subscription ──────────────────────────
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

    // ── Log the payment (non-critical) ────────────────────
    try {
      await supabase.from("payment_logs").insert({
        user_id: userId,
        reference,
        provider,
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

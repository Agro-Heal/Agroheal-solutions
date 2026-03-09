// supabase/functions/verify-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reference, provider, userId } = await req.json();

    if (!reference || !provider || !userId) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

      if (
        paystackData.status === true &&
        paystackData.data?.status === "success"
      ) {
        isVerified = true;
        amount = paystackData.data.amount / 100; // convert from kobo
      }
    }

    // ── Verify with Flutterwave ───────────────────────────
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

      if (
        flwData.status === "success" &&
        (flwData.data?.status === "successful" ||
          flwData.data?.status === "completed")
      ) {
        isVerified = true;
        amount = flwData.data.amount;
      }
    }

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

    // ── Create subscription in DB ─────────────────────────
    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + 365);

    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan: "platform",
        status: "active",
        started_at: now.toISOString(),
        expires_at: expires.toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (subError) throw subError;

    // ── Log the payment ───────────────────────────────────
    await supabase.from("payment_logs").insert({
      user_id: userId,
      reference,
      provider,
      amount,
      status: "success",
      created_at: now.toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Subscription activated" }),
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

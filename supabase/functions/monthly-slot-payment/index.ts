import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY")!;

  // verify signature
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature !== expectedSig) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event !== "charge.success") {
    return new Response("OK", { status: 200 }); // ignore other events
  }

  const ref: string = event.data.reference;

  // only handle slot monthly payments
  if (!ref.startsWith("SLOT_")) {
    return new Response("OK", { status: 200 });
  }

  // extract subscription id: SLOT_{subscriptionId}_{timestamp}
  const subscriptionId = ref.split("_")[1];

  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

  // update slot subscription
  const { error: updateError } = await supabase
    .from("slot_subscriptions")
    .update({
      last_payment_date: new Date().toISOString(),
      next_payment_date: nextPaymentDate.toISOString(),
      status: "active",
    })
    .eq("id", subscriptionId);

  if (updateError) {
    console.error("Update error:", updateError);
    return new Response("Update failed", { status: 500 });
  }

  // log the payment
  const { data: sub } = await supabase
    .from("slot_subscriptions")
    .select("user_id")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (sub) {
    await supabase.from("subscription_payments").insert({
      subscription_id: subscriptionId,
      user_id: sub.user_id,
      amount: 1000,
      transaction_ref: ref,
      status: "paid",
    });
  }

  return new Response("OK", { status: 200 });
});

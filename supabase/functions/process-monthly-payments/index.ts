import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // verify this is called from cron, not public
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (authHeader !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = new Date().toISOString();

  // find all active subscriptions past due date by more than 3 days
  const gracePeriod = new Date();
  gracePeriod.setDate(gracePeriod.getDate() - 3);

  const { data: overdueSubscriptions, error } = await supabase
    .from("slot_subscriptions")
    .select("id, user_id, next_payment_date")
    .eq("status", "active")
    .lt("next_payment_date", gracePeriod.toISOString());

  if (error) {
    console.error("Fetch error:", error);
    return new Response("Error fetching subscriptions", { status: 500 });
  }

  if (!overdueSubscriptions?.length) {
    return new Response(
      JSON.stringify({ message: "No overdue subscriptions" }),
      { status: 200 },
    );
  }

  // suspend overdue subscriptions
  const ids = overdueSubscriptions.map((s) => s.id);

  const { error: suspendError } = await supabase
    .from("slot_subscriptions")
    .update({ status: "suspended" })
    .in("id", ids);

  if (suspendError) {
    console.error("Suspend error:", suspendError);
    return new Response("Error suspending subscriptions", { status: 500 });
  }

  console.log(`Suspended ${ids.length} overdue subscriptions`);

  return new Response(
    JSON.stringify({
      suspended: ids.length,
      ids,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

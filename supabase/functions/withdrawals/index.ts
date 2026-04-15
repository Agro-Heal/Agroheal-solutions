import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Action = "banks" | "resolve" | "withdraw" | "list";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeBankName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { _raw: text };
  }
}

function getFlutterwaveSecretKey() {
  const secret = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  return secret || null;
}

async function fetchFlutterwaveBanks(): Promise<Array<{ name: string; code: string }>> {
  const secret = getFlutterwaveSecretKey();
  if (!secret) throw new Error("Missing FLUTTERWAVE_SECRET_KEY");

  const res = await fetch("https://api.flutterwave.com/v3/banks/NG?include_provider_type=1", {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(
      `Flutterwave banks request failed (${res.status}): ${String(
        data?.message ?? data?._raw ?? "Unknown error",
      )}`,
    );
  }
  if (data?.status !== "success" || !Array.isArray(data?.data)) {
    throw new Error(
      `Flutterwave banks response invalid: ${String(
        data?.message ?? data?._raw ?? "Unknown error",
      )}`,
    );
  }

  const banks = data.data
    .map((b: any) => ({ name: String(b.name ?? ""), code: String(b.code ?? "") }))
    .filter((b: any) => b.name && b.code);

  const seen = new Set<string>();
  return banks.filter((b: any) => {
    const k = `${b.code}:${b.name}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function resolveBankCodeFromName(bankName: string) {
  const banks = await fetchFlutterwaveBanks();
  const wanted = normalizeBankName(bankName);
  const match = banks.find((b) => normalizeBankName(b.name) === wanted);
  return match?.code ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json(405, { success: false, message: "Method not allowed" });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const action = payload?.action as Action | undefined;

    if (!action) return json(400, { success: false, message: "Missing action" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json(500, {
        success: false,
        message:
          "Missing Supabase service role configuration (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    if (action === "banks") {
      const banks = await fetchFlutterwaveBanks();
      return json(200, { success: true, banks });
    }

    if (action === "resolve") {
      const bankName = String(payload?.bankName ?? "");
      const accountNumber = String(payload?.accountNumber ?? "");

      if (!bankName || !accountNumber) {
        return json(400, {
          success: false,
          message: "bankName and accountNumber are required",
        });
      }
      if (!/^\d{10}$/.test(accountNumber)) {
        return json(400, {
          success: false,
          message: "accountNumber must be 10 digits",
        });
      }

      const bankCode = await resolveBankCodeFromName(bankName);
      if (!bankCode) {
        return json(400, {
          success: false,
          message: "Unsupported bank name",
        });
      }

      const flwSecret = getFlutterwaveSecretKey();
      if (!flwSecret) {
        return json(500, {
          success: false,
          message: "Missing FLUTTERWAVE_SECRET_KEY",
        });
      }

      const res = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${flwSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber,
          account_bank: bankCode,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || data?.status !== "success" || !data?.data?.account_name) {
        return json(400, {
          success: false,
          message: data?.message || "Unable to resolve account",
        });
      }

      return json(200, {
        success: true,
        bankCode,
        accountName: String(data.data.account_name),
      });
    }

    if (action === "list") {
      const userId = String(payload?.userId ?? "");
      if (!userId) return json(400, { success: false, message: "userId is required" });

      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) throw error;

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("referral_earnings")
        .eq("id", userId)
        .maybeSingle();
      if (profileErr) throw profileErr;

      return json(200, {
        success: true,
        withdrawals: data ?? [],
        balance: Number(profile?.referral_earnings ?? 0),
      });
    }

    if (action === "withdraw") {
      const userId = String(payload?.userId ?? "");
      const bankName = String(payload?.bankName ?? "");
      const bankCode = String(payload?.bankCode ?? "");
      const accountNumber = String(payload?.accountNumber ?? "");
      const accountName = String(payload?.accountName ?? "");
      const amount = Number(payload?.amount ?? 0);

      if (
        !userId ||
        !bankName ||
        !bankCode ||
        !accountNumber ||
        !accountName ||
        !Number.isFinite(amount)
      ) {
        return json(400, {
          success: false,
          message:
            "userId, bankName, bankCode, accountNumber, accountName, amount are required",
        });
      }

      if (amount < 500) {
        return json(400, {
          success: false,
          message: "Minimum withdrawal amount is ₦500",
        });
      }
      if (!/^\d{10}$/.test(accountNumber)) {
        return json(400, {
          success: false,
          message: "accountNumber must be 10 digits",
        });
      }

      // Balance = referral_earnings (as shown in dashboard)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, referral_earnings")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      const balance = Number(profile?.referral_earnings ?? 0);
      if (amount > balance) {
        return json(400, {
          success: false,
          message: "Amount exceeds available balance",
          balance,
        });
      }

      const flwSecret = getFlutterwaveSecretKey();
      if (!flwSecret) {
        return json(500, {
          success: false,
          message: "Missing FLUTTERWAVE_SECRET_KEY",
        });
      }

      // Initiate the actual payout via Flutterwave (no extra confirmation step)
      const reference = `WDR_${crypto.randomUUID()}`;
      const flwRes = await fetch("https://api.flutterwave.com/v3/transfers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${flwSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_bank: bankCode,
          account_number: accountNumber,
          amount: Math.floor(amount),
          currency: "NGN",
          reference,
          narration: "Agroheal withdrawal",
          beneficiary: accountName,
        }),
      });
      const flwData = await safeJson(flwRes);

      if (!flwRes.ok || flwData?.status !== "success") {
        return json(400, {
          success: false,
          message: flwData?.message || "Transfer failed",
          providerResponse: flwData,
        });
      }

      const nowIso = new Date().toISOString();

      // Best-effort: write withdrawal record
      try {
        await supabase.from("withdrawals").insert({
          user_id: userId,
          reference,
          amount: Math.floor(amount),
          status: "queued",
          bank_name: bankName,
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName,
          provider: "flutterwave",
          created_at: nowIso,
        });
      } catch (err) {
        console.error("Withdrawals insert failed (non-blocking):", err);
      }

      // Deduct balance
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ referral_earnings: balance - Math.floor(amount) })
        .eq("id", userId);

      if (updateErr) {
        console.error("Balance update failed after transfer:", updateErr);
      }

      return json(200, {
        success: true,
        reference,
        accountName,
        bankCode,
        newBalance: balance - Math.floor(amount),
      });
    }

    return json(400, { success: false, message: "Unknown action" });
  } catch (err) {
    console.error("withdrawals edge function error:", err);
    return json(500, {
      success: false,
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
});


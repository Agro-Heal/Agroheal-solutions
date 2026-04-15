import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LoaderCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { supabaseANON, supabaseURL } from "@/config/Index";

type Bank = { name: string; code: string };
type Withdrawal = {
  id?: string;
  reference?: string;
  amount?: number;
  status?: string;
  bank_name?: string;
  account_name?: string;
  created_at?: string;
};

const MIN_WITHDRAWAL = 500;

function formatNaira(value: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

async function callWithdrawals<T>(payload: unknown): Promise<T> {
  const res = await fetch(`${supabaseURL}/functions/v1/withdrawals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseANON,
      Authorization: `Bearer ${supabaseANON}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore JSON parse errors
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Withdrawals function error (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export default function Withdrawals() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const [amount, setAmount] = useState("");
  const amountNumber = useMemo(() => {
    const n = Number(String(amount).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const maxAllowed = Math.max(0, Math.floor(balance));

  const canSubmit =
    !!userId &&
    !!bankName &&
    !!bankCode &&
    /^\d{10}$/.test(accountNumber) &&
    !!accountName &&
    amountNumber >= MIN_WITHDRAWAL &&
    amountNumber <= maxAllowed &&
    !resolving &&
    !submitting;

  async function loadPage(uid: string) {
    const [banksRes, listRes] = await Promise.all([
      callWithdrawals<{ banks: Bank[] }>({ action: "banks" }),
      callWithdrawals<{ withdrawals: Withdrawal[]; balance: number }>({
        action: "list",
        userId: uid,
      }),
    ]);

    const sortedBanks = Array.isArray(banksRes?.banks)
      ? [...banksRes.banks].sort((a, b) =>
          String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "en", {
            sensitivity: "base",
          }),
        )
      : [];
    setBanks(sortedBanks);
    setBalance(Number(listRes?.balance ?? 0));
    setWithdrawals(
      Array.isArray(listRes?.withdrawals) ? listRes.withdrawals : [],
    );
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);
        await loadPage(user.id);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Failed to load withdrawals");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setAccountName("");
    setBankCode("");
  }, [bankName]);

  useEffect(() => {
    if (!bankName) return;
    if (!/^\d{10}$/.test(accountNumber)) {
      setAccountName("");
      return;
    }

    const t = setTimeout(async () => {
      setResolving(true);
      try {
        const data = await callWithdrawals<{ accountName: string; bankCode: string }>({
          action: "resolve",
          bankName,
          accountNumber,
        });
        setAccountName(String(data?.accountName ?? ""));
        setBankCode(String(data?.bankCode ?? ""));
      } catch (e: any) {
        setAccountName("");
        setBankCode("");
        toast.error(e?.message || "Unable to verify account");
      } finally {
        setResolving(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [bankName, accountNumber]);

  async function refreshRecent() {
    if (!userId) return;
    try {
      const data = await callWithdrawals<{
        withdrawals: Withdrawal[];
        balance: number;
      }>({ action: "list", userId });
      setBalance(Number(data?.balance ?? balance));
      setWithdrawals(Array.isArray(data?.withdrawals) ? data.withdrawals : []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to refresh");
    }
  }

  async function handleWithdraw() {
    if (!userId) return;
    if (amountNumber < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${formatNaira(MIN_WITHDRAWAL)}`);
      return;
    }
    if (amountNumber > maxAllowed) {
      toast.error("Amount exceeds your available balance");
      return;
    }

    setSubmitting(true);
    try {
      const data = await callWithdrawals<{ newBalance: number }>({
        action: "withdraw",
        userId,
        bankName,
        bankCode,
        accountNumber,
        accountName,
        amount: Math.floor(amountNumber),
      });

      setBalance(Number(data?.newBalance ?? balance));
      setAmount("");
      toast.success("Withdrawal queued");
      await refreshRecent();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center bg-gray-50">
        <Toaster />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-800/10 flex items-center justify-center">
            <LoaderCircle className="animate-spin text-green-800" size={32} />
          </div>
          <p className="text-gray-500 text-sm font-medium">
            Loading withdrawals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      <div className="bg-green-800 px-4 md:px-8 pt-8 pb-12">
        <div className="max-w-[96%] mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Withdraw Earnings
          </h1>
          <p className="text-green-200 mt-1 text-sm">
            Transfer your earnings directly to your bank account
          </p>
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-6 pb-12 max-w-[96%] mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-4">
              Withdrawal Form
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block">
                  Bank
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
                >
                  <option value="">
                    {banks.length ? "Select a bank" : "No banks available"}
                  </option>
                  {banks.map((b, i) => (
                    <option key={`${b.code}:${b.name}:${i}`} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block">
                  Account Number
                </label>
                <input
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(
                      e.target.value.replace(/\\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="Enter your account number"
                  className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block">
                  Account Name
                </label>
                <div className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm flex items-center bg-gray-50">
                  {resolving ? (
                    <span className="text-gray-500 flex items-center gap-2">
                      <LoaderCircle className="animate-spin" size={16} />
                      Verifying...
                    </span>
                  ) : accountName ? (
                    <span className="text-gray-800 font-medium">
                      {accountName}
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      Auto-verified account name
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block">
                  Amount (NGN)
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Enter amount"
                  inputMode="numeric"
                  className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Available: {formatNaira(balance)}</span>
                  <span>Minimum: {formatNaira(MIN_WITHDRAWAL)}</span>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!canSubmit}
                className={`w-full h-11 rounded-xl text-sm font-semibold transition-colors ${
                  canSubmit
                    ? "bg-green-800 hover:bg-green-700 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {submitting ? "Processing..." : "Withdraw"}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Funds will be transferred within 24 hours
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Current Balance</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNaira(balance)}
              </p>
            </div>

            <div className="space-y-3 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Processing Time</span>
                <span className="text-gray-700">Within 24 hours</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum Amount</span>
                <span className="text-gray-700">
                  {formatNaira(MIN_WITHDRAWAL)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Supported Banks</span>
                <span className="text-gray-700">All Nigerian Banks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">
              Recent Withdrawals
            </h2>
            <button
              onClick={refreshRecent}
              className="text-xs font-semibold text-green-800 hover:text-green-700"
            >
              Refresh
            </button>
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <p className="text-sm font-medium">No withdrawals yet</p>
              <p className="text-xs mt-1">
                Your withdrawal history will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((w, idx) => (
                <div
                  key={w.reference || w.id || String(idx)}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {w.bank_name || "Bank"} • {w.account_name || "—"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {w.reference || "—"}{" "}
                      {w.created_at
                        ? `• ${new Date(w.created_at).toLocaleString("en-NG")}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatNaira(Number(w.amount ?? 0))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(w.status || "queued").toString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


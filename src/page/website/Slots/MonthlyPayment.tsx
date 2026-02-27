import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";
import Lottie from "lottie-react";
import NoDataFound from "../../../assets/Icon/searching.json";

interface Subscription {
  id: string;
  status: string;
  amount: number;
  next_payment_date: string;
  last_payment_date: string;
}

const MonthlyPayment = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (document.getElementById("paystack-script")) return;
    const script = document.createElement("script");
    script.id = "paystack-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("slot_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (error) console.error(error);
    setSubscription(data);
    setLoading(false);
  };

  // Check if payment is due (within 3 days of or past next_payment_date)
  const isPaymentDue = () => {
    if (!subscription) return false;
    const nextDate = new Date(subscription.next_payment_date);
    const today = new Date();
    const diffDays = Math.ceil(
      (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays <= 3; // show pay button 3 days before due
  };

  const daysUntilPayment = () => {
    if (!subscription) return 0;
    const nextDate = new Date(subscription.next_payment_date);
    const today = new Date();
    return Math.ceil(
      (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  const handleMonthlyPayment = async () => {
    if (!subscription) return;

    if (!(window as any).PaystackPop) {
      toast({
        title: "Payment Error",
        description: "Paystack is still loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setIsProcessing(true);

    // Get user email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    try {
      const config = {
        key: import.meta.env.VITE_PAYSTACK_KEYS,
        email: profile?.email || user.email,
        amount: 500 * 100,
        currency: "NGN",
        ref: `SUB_${subscription.id}_${Date.now()}`,
        callback: function (response: any) {
          const updateSubscription = async () => {
            try {
              const nextPaymentDate = new Date();
              nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

              const { error } = await supabase
                .from("slots_subscriptions")
                .update({
                  last_payment_date: new Date().toISOString(),
                  next_payment_date: nextPaymentDate.toISOString(),
                  status: "active",
                })
                .eq("id", subscription.id);

              if (error) throw error;

              // Also log the payment
              await supabase.from("subscription_payments").insert([
                {
                  subscription_id: subscription.id,
                  user_id: user.id,
                  amount: 500,
                  transaction_ref: response.reference,
                  status: "paid",
                },
              ]);

              toast({
                title: "Monthly payment successful",
                description: "Your subscription has been renewed for 30 days.",
              });

              fetchSubscription();
            } catch (err) {
              console.error(err);
              toast({
                title: "Warning",
                description: "Payment received but failed to update record.",
                variant: "destructive",
              });
            } finally {
              setIsProcessing(false);
            }
          };

          updateSubscription();
        },
        onClose: function () {
          toast({
            title: "Payment cancelled",
            description: "You closed the payment window.",
          });
          setIsProcessing(false);
        },
      };

      const handler = (window as any).PaystackPop.setup(config);
      handler.openIframe();
    } catch (error) {
      console.error(error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!subscription)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Lottie
            animationData={NoDataFound}
            width={250}
            height={250}
            loop={true}
          />
          <h1 className="mb-4 text-4xl font-bold">No active subscription</h1>
          <p className="mb-4 text-xl text-green-800">Purchase a slot</p>
          <a
            href="/dashboard/slots"
            className="text-green-900 underline hover:text-green-900/90"
          >
            Secure your Farm slot
          </a>
        </div>
      </div>
    );

  const days = daysUntilPayment();
  const isOverdue = days < 0;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container px-4">
        <h1 className="text-3xl font-bold mb-2">Monthly Subscription</h1>
        <p className="text-muted-foreground mb-8">
          Manage your farm slot subscription
        </p>

        <div className="bg-card rounded-2xl p-6 shadow-soft border border-border/50 space-y-6">
          {/* Status Banner */}
          <div
            className={`rounded-xl p-4 flex items-center gap-3 ${
              isOverdue
                ? "bg-red-50 border border-red-200"
                : isPaymentDue()
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-green-50 border border-green-200"
            }`}
          >
            {isOverdue ? (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            ) : isPaymentDue() ? (
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
            <div>
              <p
                className={`font-semibold text-sm ${
                  isOverdue
                    ? "text-red-700"
                    : isPaymentDue()
                      ? "text-yellow-700"
                      : "text-green-700"
                }`}
              >
                {isOverdue
                  ? `Payment overdue by ${Math.abs(days)} days`
                  : isPaymentDue()
                    ? `Payment due in ${days} days`
                    : `Active — next payment in ${days} days`}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Fee</span>
              <span className="font-semibold">₦500</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Payment</span>
              <span className="font-semibold">
                {new Date(subscription.last_payment_date).toLocaleDateString(
                  "en-NG",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  },
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next Payment Due</span>
              <span className="font-semibold">
                {new Date(subscription.next_payment_date).toLocaleDateString(
                  "en-NG",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  },
                )}
              </span>
            </div>
          </div>

          {/* Pay Button — only show when due or overdue */}
          {(isPaymentDue() || isOverdue) && (
            <Button
              onClick={handleMonthlyPayment}
              disabled={isProcessing}
              className="w-full h-12 bg-[#0BA4DB] hover:bg-[#0993c7] text-white font-semibold"
            >
              {isProcessing ? "Processing..." : "Pay ₦500 Monthly Fee"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyPayment;

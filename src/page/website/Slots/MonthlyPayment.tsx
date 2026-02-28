import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle,
  Calendar,
  CreditCard,
  Clock,
  Sprout,
  ArrowRight,
} from "lucide-react";
import Lottie from "lottie-react";
import NoDataFound from "../../../assets/Icon/searching.json";
import { motion } from "framer-motion";

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

  // const fetchSubscription = async () => {
  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser();
  //   if (!user) return;

  //   const { data, error } = await supabase
  //     .from("slot_subscriptions")
  //     .select("*")
  //     .eq("user_id", user.id)
  //     .eq("status", "active")
  //     .single();

  //   if (error) console.error(error);
  //   setSubscription(data);
  //   setLoading(false);
  // };

  const fetchSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("slot_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_payment_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) console.error(error);
    setSubscription(data);
    setLoading(false);
  };

  const isPaymentDue = () => {
    if (!subscription) return false;
    const nextDate = new Date(subscription.next_payment_date);
    const today = new Date();
    const diffDays = Math.ceil(
      (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays <= 3;
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
                .from("slot_subscriptions")
                .update({
                  last_payment_date: new Date().toISOString(),
                  next_payment_date: nextPaymentDate.toISOString(),
                  status: "active",
                })
                .eq("id", subscription.id);

              if (error) throw error;

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

              setTimeout(() => {
                window.location.href =
                  "https://chat.whatsapp.com/LlXB7iYXmTx8JpzKulzTvD";
              }, 2000);

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-800/10 flex items-center justify-center animate-pulse">
            <Sprout className="w-6 h-6 text-green-800" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Loading subscription...
          </p>
        </div>
      </div>
    );

  if (!subscription)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <Lottie
            animationData={NoDataFound}
            loop={true}
            className="w-52 h-52 mx-auto"
          />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No Active Subscription
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            You haven't secured a farm slot yet. Purchase one to get started.
          </p>
          <a
            href="/dashboard/slots"
            className="inline-flex items-center gap-2 bg-green-800 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            Secure your Farm Slot
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );

  const days = daysUntilPayment();
  const isOverdue = days < 0;
  const isDue = isPaymentDue();

  const statusConfig = isOverdue
    ? {
        bg: "bg-red-50",
        border: "border-red-200",
        iconColor: "text-red-500",
        textColor: "text-red-700",
        icon: AlertCircle,
        label: `Payment overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`,
        headerBg: "bg-red-600",
      }
    : isDue
      ? {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          iconColor: "text-yellow-500",
          textColor: "text-yellow-700",
          icon: AlertCircle,
          label: `Payment due in ${days} day${days !== 1 ? "s" : ""}`,
          headerBg: "bg-yellow-500",
        }
      : {
          bg: "bg-green-50",
          border: "border-green-200",
          iconColor: "text-green-600",
          textColor: "text-green-700",
          icon: CheckCircle,
          label: `Active — next payment in ${days} days`,
          headerBg: "bg-green-800",
        };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Banner */}
      <div className="bg-green-800 px-4 md:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">
            Slot Management
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Monthly Subscription
          </h1>
          <p className="text-green-200 mt-1 text-sm">
            Manage your farm slot monthly fee
          </p>
        </motion.div>
      </div>

      <div className="px-4 md:px-8 -mt-8 pb-12 max-w-2xl mx-auto">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4"
        >
          {/* Colored top strip */}
          <div
            className={`${statusConfig.headerBg} px-6 py-4 flex items-center gap-3`}
          >
            <StatusIcon className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-white font-semibold text-sm">
              {statusConfig.label}
            </p>
          </div>

          {/* Subscription summary */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <CreditCard className="w-4 h-4" />
                Monthly Fee
              </div>
              <span className="font-bold text-gray-900 text-base">₦500</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                Last Payment
              </div>
              <span className="font-semibold text-gray-900 text-sm">
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

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar className="w-4 h-4" />
                Next Payment Due
              </div>
              <span className="font-semibold text-gray-900 text-sm">
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
        </motion.div>

        {/* Progress bar — days remaining */}
        {!isOverdue && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cycle Progress
              </span>
              <span className="text-xs font-bold text-green-800">
                {30 - Math.min(days, 30)} / 30 days
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(((30 - days) / 30) * 100, 100)}%`,
                }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  isDue ? "bg-yellow-400" : "bg-green-600"
                }`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {days} day{days !== 1 ? "s" : ""} remaining in this cycle
            </p>
          </motion.div>
        )}

        {/* Pay Button */}
        {(isDue || isOverdue) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Button
              onClick={handleMonthlyPayment}
              disabled={isProcessing}
              className="w-full h-13 bg-green-800 hover:bg-green-700 text-white font-semibold rounded-2xl text-base py-4"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pay ₦500 Monthly Fee
                </span>
              )}
            </Button>
            {isOverdue && (
              <p className="text-xs text-red-500 text-center mt-2 font-medium">
                Your slot may be suspended if payment is not made soon.
              </p>
            )}
          </motion.div>
        )}

        {/* Info note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs text-gray-400 text-center mt-6 leading-relaxed"
        >
          Monthly fees cover farm rent and Agroheal oversight. Your slot remains
          active as long as payments are up to date.
        </motion.p>
      </div>
    </div>
  );
};

export default MonthlyPayment;

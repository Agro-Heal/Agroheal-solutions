import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { benefits, included } from "@/helpers/dashboard.helpers";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import * as Sentry from "@sentry/react";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const Subscribe = () => {
  const SubscribeFee = 1000;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
    };
    getUser();

    if (!document.getElementById("paystack-script")) {
      const script = document.createElement("script");
      script.id = "paystack-script";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [navigate]);

  const createSubscription = async (userId: string) => {
    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + 365);

    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: "platform",
          status: "active",
          started_at: now.toISOString(),
          expires_at: expires.toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select();

    if (error) {
      Sentry.captureException(error, {
        extra: {
          action: "subscribe",
        },
      });
      throw error;
    }
  };

  // ensure profile exists — creates it if missing
  const ensureProfile = async (userId: string, userMeta: any) => {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name: userMeta?.full_name || userMeta?.email || "",
            referral_code: Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase(),
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select();
    }
  };

  const handlePaystackPayment = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const paystackKey = import.meta.env.VITE_PAYSTACK_KEYS;
    if (!paystackKey) {
      alert("Paystack key missing.");
      return;
    }
    if (!window.PaystackPop) {
      alert("Payment is loading. Try again.");
      return;
    }

    setLoading(true);

    try {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: user.email,
        amount: SubscribeFee * 100,
        currency: "NGN",
        ref: `SUB_${Date.now()}_${user.id.slice(0, 8)}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: user.user_metadata?.full_name || user.email,
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id,
            },
            {
              display_name: "Plan",
              variable_name: "plan",
              value: "platform",
            },
          ],
        },
        onClose: () => setLoading(false),
        callback: function (response: any) {
          if (response.status === "success") {
            const run = async () => {
              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (!session) {
                alert("Session expired. Please log in and try again.");
                navigate("/login");
                return;
              }

              // create subscription + profile in parallel
              await Promise.all([
                createSubscription(session.user.id),
                ensureProfile(session.user.id, session.user.user_metadata),
              ]);

              handler.close();
              await supabase.auth.refreshSession();
              setShowSuccess(true); // ← show success modal, it handles redirect
            };

            run().catch((err) => {
              console.error("Payment post-processing failed:", err);
              setShowSuccess(true); // payment went through, show success anyway
            });
          } else {
            alert("Payment verification failed");
            setLoading(false);
          }
        },
      });

      handler.openIframe();
    } catch (error: any) {
      Sentry.captureException(error); // capture any error
      alert(`Failed to initialize payment: ${error.message}`);
      setLoading(false);
    }
  };

  const handlePayment = () => {
    handlePaystackPayment();
  };

  return (
    <>
      <PaymentSuccess
        isOpen={showSuccess}
        userName={user?.user_metadata?.full_name || user?.email}
      />
      <div className="min-h-screen bg-background">
        <main className="pt-10 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 text-[#d17547] font-semibold text-sm uppercase tracking-wider mb-4">
                <span
                  className="h-2 w-2 rounded-full bg-accent"
                  aria-hidden="true"
                />
                Platform Access
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Unlock Your Learning Journey
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Get full access to your personalized dashboard and start
                mastering organic farming today.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-md mx-auto mb-16"
            >
              <Card className="relative overflow-hidden border-2 border-primary/20 shadow-elevated">
                <div className="absolute top-0 right-0 bg-gradient-cta text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-bl-lg">
                  Yearly subscription Payment
                </div>

                <CardContent className="p-8 pt-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-6">
                    <Crown className="w-8 h-8 text-primary-foreground" />
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-muted-foreground text-sm mb-1">
                      Full Platform Access
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl md:text-5xl font-display font-bold text-foreground">
                        ₦1,000
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">
                      Yearly subscription
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {included.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 text-foreground"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-green-800 text-white hover:bg-green-900 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Get Started Now"
                    )}
                  </Button>

                  <p className="text-center text-muted-foreground text-xs mt-4">
                    Secure payment via Paystack
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
                What You'll Get
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  >
                    <Card className="h-full bg-card/70 backdrop-blur-sm border-border/50 shadow-soft hover:shadow-elevated transition-shadow duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-green-800/20 flex items-center justify-center mx-auto mb-4">
                          <benefit.icon className="w-6 h-6 text-green-800" />
                        </div>
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center mt-12"
            >
              <p className="text-muted-foreground">
                Have questions?{" "}
                <a
                  href="https://wa.link/5ff5ww"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Contact us
                </a>
              </p>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
};

interface PaymentSuccessProps {
  isOpen: boolean;
  userName?: string;
}

const PaymentSuccess = ({ isOpen, userName }: PaymentSuccessProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, navigate]);

  const handleGoNow = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Top green band */}
              <div className="relative bg-green-800 px-8 pt-10 pb-16 text-center overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
                  <div className="absolute top-4 left-1/3 w-2 h-2 rounded-full bg-white/20" />
                  <div className="absolute bottom-8 right-1/4 w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>

                {/* Sparkles */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center gap-2 mb-4"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <Sparkles className="w-3 h-3 text-yellow-200 mt-1" />
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>

                {/* Check icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.15,
                  }}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
                >
                  <CheckCircle className="w-11 h-11 text-green-700" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Payment Successful!
                  </h2>
                  <p className="text-green-200 text-sm">
                    Welcome to Agroheal
                    {userName ? `, ${userName.split(" ")[0]}` : ""}! 🌱
                  </p>
                </motion.div>
              </div>

              {/* Bottom card — overlaps green band */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="relative -mt-8 mx-4 bg-white rounded-2xl border border-gray-100 shadow-md p-5 mb-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Platform access activated
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your yearly subscription is now live. Explore courses,
                      manage your farm slot, and start earning with referrals.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Footer actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="px-6 pb-8 space-y-3"
              >
                <button
                  onClick={handleGoNow}
                  className="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs text-gray-400">
                  Redirecting automatically in{" "}
                  <span className="font-bold text-green-700">{countdown}s</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Subscribe;

import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { benefits, included } from "@/helpers/dashboard.helpers";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

declare global {
  // to be refactored later
  interface Window {
    PaystackPop: any;
    FlutterwaveCheckout: any;
  }
}

const Subscribe = () => {
  const SubscribeFee = 1000;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "paystack" | "flutterwave"
  >("paystack");
  const [scriptsLoaded, setScriptsLoaded] = useState({
    paystack: false,
    flutterwave: false,
  });

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("Please login to subscribe");
        navigate("/login");
        return;
      }

      setUser(user);
    };
    getUser();

    // Load Paystack
    const loadPaystack = () => {
      if (document.getElementById("paystack-script")) {
        setScriptsLoaded((prev) => ({ ...prev, paystack: true }));
        return;
      }
      const script = document.createElement("script");
      script.id = "paystack-script";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => {
        console.log("Paystack script loaded");
        setScriptsLoaded((prev) => ({ ...prev, paystack: true }));
      };
      script.onerror = () => {
        console.error("Failed to load Paystack script");
      };
      document.body.appendChild(script);
    };

    // Load Flutterwave
    const loadFlutterwave = () => {
      if (document.getElementById("flutterwave-script")) {
        setScriptsLoaded((prev) => ({ ...prev, flutterwave: true }));
        return;
      }
      const script = document.createElement("script");
      script.id = "flutterwave-script";
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      script.onload = () => {
        console.log("Flutterwave script loaded");
        setScriptsLoaded((prev) => ({ ...prev, flutterwave: true }));
      };
      script.onerror = () => {
        console.error("Failed to load Flutterwave script");
      };
      document.body.appendChild(script);
    };

    loadPaystack();
    loadFlutterwave();
  }, [navigate]);

  const createSubscription = async (userId: string) => {
    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + 365);

    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan: "platform",
      status: "active",
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
    });

    if (error) throw error;
  };

  const handlePaystackPayment = () => {
    console.log("=== PAYSTACK PAYMENT DEBUG ===");

    if (!user) {
      console.error("No user found");
      navigate("/login");
      return;
    }

    const paystackKey = import.meta.env.VITE_PAYSTACK_KEYS;

    if (!paystackKey) {
      alert("Payment configuration error. Paystack key is missing.");
      return;
    }

    if (!window.PaystackPop) {
      console.error("PaystackPop is not loaded yet");
      alert("Payment system is loading. Please try again in a moment.");
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
        onClose: function () {
          console.log("Payment modal closed");
          setLoading(false);
        },
        callback: function (response: any) {
          console.log("Payment callback triggered:", response);

          // Handle async operations inside the function
          if (response.status === "success") {
            console.log("Payment successful, creating subscription...");

            // Call async function but don't await it in the callback
            createSubscription(user.id)
              .then(() => {
                alert("Subscription activated successfully!");
                navigate("/dashboard");
              })
              .catch((error) => {
                console.error("Error creating subscription:", error);
                alert(
                  "Failed to activate subscription. Please contact support.",
                );
              })
              .finally(() => {
                setLoading(false);
              });
          } else {
            console.log("Payment failed:", response);
            alert("Payment verification failed");
            setLoading(false);
          }
        },
      });

      console.log("Handler created successfully");
      handler.openIframe();
    } catch (error: any) {
      console.error("FULL ERROR:", error);
      alert(`Failed to initialize payment: ${error.message}`);
      setLoading(false);
    }
  };

  const handleFlutterwavePayment = () => {
    if (!user) {
      console.log("Please login first");
      navigate("/login");
      return;
    }

    if (!window.FlutterwaveCheckout) {
      console.error("Flutterwave is not loaded yet");
      alert("Payment system is loading. Please try again in a moment.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      window.FlutterwaveCheckout({
        public_key: import.meta.env.VITE_FLUTTERWAVE_KEY,
        tx_ref: `SUB_${Date.now()}_${user.id.slice(0, 8)}`,
        amount: SubscribeFee,
        currency: "NGN",
        payment_options: "card,ussd,banktransfer",
        customer: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
        },
        customizations: {
          title: "Platform Subscription",
          description: "Monthly subscription payment",
          logo: "https://your-logo-url.com/logo.png", // Add your logo URL
        },
        callback: async function (data: any) {
          console.log("Payment response:", data);
          try {
            if (data.status === "successful") {
              // Create subscription in database
              await createSubscription(user.id);

              alert("Subscription activated successfully!");
              navigate("/dashboard");
            } else {
              alert("Payment verification failed");
            }
          } catch (error) {
            console.error("Error creating subscription:", error);
            alert("Failed to activate subscription. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        onclose: function () {
          setLoading(false);
          console.log("Payment cancelled");
        },
      });
    } catch (error) {
      console.error("Error initializing Flutterwave:", error);
      alert("Failed to initialize payment. Please try again.");
      setLoading(false);
    }
  };

  const handlePayment = () => {
    console.log("Payment method:", paymentMethod);
    console.log("Scripts loaded:", scriptsLoaded);
    console.log("User:", user);
    console.log("Paystack available:", !!window.PaystackPop);
    console.log("Flutterwave available:", !!window.FlutterwaveCheckout);

    if (paymentMethod === "paystack") {
      handlePaystackPayment();
    } else {
      handleFlutterwavePayment();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
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
              Get full access to your personalized dashboard and start mastering
              organic farming today.
            </p>
          </motion.div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-md mx-auto mb-16"
          >
            <Card className="relative overflow-hidden border-2 border-primary/20 shadow-elevated">
              {/* Badge */}
              <div className="absolute top-0 right-0 bg-gradient-cta text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-bl-lg">
                Yearly subscription Payment
              </div>

              <CardContent className="p-8 pt-12">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-6">
                  <Crown className="w-8 h-8 text-primary-foreground" />
                </div>

                {/* Price */}
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

                {/* Included List */}
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

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-3">
                    Choose Payment Method
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod("paystack")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === "paystack"
                          ? "border-green-800 bg-green-800/10"
                          : "border-border hover:border-green-800/50"
                      }`}
                    >
                      <p className="text-sm font-semibold">Paystack</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("flutterwave")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === "flutterwave"
                          ? "border-green-800 bg-green-800/10"
                          : "border-border hover:border-green-800/50"
                      }`}
                    >
                      <p className="text-sm font-semibold">Flutterwave</p>
                    </button>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-green-800 text-white hover:bg-green-900 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Get Started Now"}
                </Button>

                <p className="text-center text-muted-foreground text-xs mt-4">
                  Secure payment via{" "}
                  {paymentMethod === "paystack" ? "Paystack" : "Flutterwave"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Benefits Section */}
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

          {/* FAQ Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground">
              Have questions?{" "}
              <Link
                to="/about"
                className="text-primary hover:underline font-medium"
              >
                Contact us
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Subscribe;

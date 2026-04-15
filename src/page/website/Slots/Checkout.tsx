import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Minus,
  Plus,
  Shield,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import * as Sentry from "@sentry/react";

declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => { close: () => void };
  }
}

const Checkout = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [slotQuantity, setSlotQuantity] = useState(1);
  const slotPrice = 2000;
  const totalPrice = slotPrice * slotQuantity;
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  // ── Load Flutterwave script ───────────────────────────────────────────────
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    if (document.getElementById("flutterwave-script")) return;
    const script = document.createElement("script");
    script.id = "flutterwave-script";
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const incrementSlot = () => setSlotQuantity((q) => Math.min(q + 1, 100));
  const decrementSlot = () => setSlotQuantity((q) => Math.max(q - 1, 1));

  const isFormValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.phone.trim();

  const createCheckout = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login required",
        description: "You must be logged in to make payment.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("checkout")
      .insert([
        {
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          amount: totalPrice,
          payment_method: "flutterwave",
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      Sentry.captureException(error);
      toast({
        title: "Database Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    return data;
  };

  const handleFlutterwave = async () => {
    if (!isFormValid) {
      toast({
        title: "Please fill all fields",
        description: "All billing details are required.",
        variant: "destructive",
      });
      return;
    }

    if (!window.FlutterwaveCheckout) {
      toast({
        title: "Payment Error",
        description: "Flutterwave is still loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const flwKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
    if (!flwKey) {
      toast({
        title: "Payment Error",
        description: "Flutterwave key missing.",
        variant: "destructive",
      });
      return;
    }

    Sentry.metrics.count("payment_initiated", 1);
    setIsProcessing(true);

    const order = await createCheckout();
    if (!order) {
      setIsProcessing(false);
      return;
    }

    try {
      const txRef = `SLOT_${order.id}_${Date.now()}`;

      window.FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: txRef,
        amount: totalPrice,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: order.email,
          phone_number: order.phone,
          name: `${formData.firstName} ${formData.lastName}`,
        },
        meta: {
          user_id: order.user_id,
          order_id: order.id,
          plan: "slot",
        },
        customizations: {
          title: "Agroheal Farm Slot",
          description: `${slotQuantity} slot${slotQuantity > 1 ? "s" : ""} — ₦${totalPrice.toLocaleString()}`,
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZGE2NjM1ZS00NTAzLTRkZDktOTdmOS0zYWExY2Y5NzNiOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhZ3JvaGVhbC0gYnVja2V0cy9sb2dvLnBuZyIsImlhdCI6MTc3NDAwODY3OCwiZXhwIjo0OTI3NjA4Njc4fQ.fuwva3-hMj5KmMRqElcclgJqzA5d4aigxCIlHVHgMak",
        },
        onclose: () => {
          toast({
            title: "Payment cancelled",
            description: "You closed the payment window.",
          });
          setIsProcessing(false);
        },
        callback: function (response: any) {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            Sentry.metrics.count("payment_success", 1);

            const reference = `SUB_${Date.now()}_${user.id.slice(0, 8)}`;
            localStorage.setItem("pending_payment_ref", reference);
            localStorage.setItem("pending_payment_provider", "flutterwave");
            localStorage.setItem("pending_payment_userId", user.id);

            const run = async () => {
              const { data, error } = await supabase.functions.invoke(
                "verify-slot-payment",
                {
                  body: {
                    // Flutterwave uses transaction_id (numeric) for server-side verify
                    reference: response.transaction_id,
                    provider: "flutterwave",
                    userId: order.user_id,
                    orderId: order.id,
                    slotQuantity: slotQuantity,
                    totalPrice: totalPrice,
                  },
                },
              );

              if (error || !data?.success) {
                Sentry.captureException(error, {
                  extra: { action: "verify_slot_payment", orderId: order.id },
                });
                toast({
                  title: "Activation Error",
                  description:
                    "Payment received but activation failed. Please contact support.",
                  variant: "destructive",
                });
                return;
              }

              toast({
                title: "Payment successful",
                description: "Your slot has been secured!",
              });

              navigate("/dashboard/slots-subscription"); // navigate to slots details page
            };

            run()
              .catch((err) => {
                Sentry.captureException(err, {
                  extra: { action: "post_slot_payment", orderId: order.id },
                });
                toast({
                  title: "Warning",
                  description: "Payment received but failed to update record.",
                  variant: "destructive",
                });
              })
              .finally(() => setIsProcessing(false));
          } else {
            // Payment was not successful
            setIsProcessing(false);
          }
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: "Payment Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initialize payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-0 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/dashboard/slots"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Slots
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Secure Your Farm Slot
            </h1>
            <p className="text-muted-foreground mb-8">
              Pay securely via Flutterwave.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Billing Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft border border-border/50">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Billing Details
                </h2>

                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Slots</Label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={decrementSlot}
                        disabled={slotQuantity <= 1}
                        className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold text-foreground">
                          {slotQuantity}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {slotQuantity === 1 ? "slot" : "slots"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={incrementSlot}
                        disabled={slotQuantity >= 100}
                        className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {slotQuantity > 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3 mt-2"
                      >
                        <span className="text-sm text-green-700 font-medium">
                          {slotQuantity} × ₦{slotPrice.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-green-800">
                          = ₦{totalPrice.toLocaleString()}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Button
                    onClick={handleFlutterwave}
                    disabled={isProcessing}
                    className="w-full h-12 bg-green-800 hover:bg-green-900 text-white font-semibold"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Pay with Flutterwave"
                    )}
                  </Button>
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Your payment information is secure and encrypted.</span>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-card rounded-2xl overflow-hidden shadow-soft border border-border/50 sticky top-28">
                <div className="bg-gradient-hero p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-3">
                    <Sprout className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-primary-foreground">
                    Practicals Farm Slot
                  </h3>
                  <p className="text-primary-foreground/80 text-sm">
                    One growing season
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Farm Slot</span>
                    <span className="text-foreground">
                      ₦{slotPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between font-semibold">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground text-xl">
                        ₦{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <ul className="text-sm text-muted-foreground space-y-2 pt-4 border-t border-border">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Practice slot on an hectare farm
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Expert guidance throughout
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      WhatsApp group access
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;

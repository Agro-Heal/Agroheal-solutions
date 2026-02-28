import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Shield, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const Checkout = () => {
  const { toast } = useToast();
  const slotPrice = 100; // fixed price for the slot
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Load payment scripts on component mount
  useEffect(() => {
    // Load Paystack
    const loadPaystack = () => {
      if (document.getElementById("paystack-script")) return;
      const script = document.createElement("script");
      script.id = "paystack-script";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    };

    // Load Flutterwave
    const loadFlutterwave = () => {
      if (document.getElementById("flutterwave-script")) return;
      const script = document.createElement("script");
      script.id = "flutterwave-script";
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);
    };

    loadPaystack();
    loadFlutterwave();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createCheckout = async (paymentMethod: "paystack" | "flutterwave") => {
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
          amount: slotPrice,
          payment_method: paymentMethod,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      toast({
        title: "Database Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    return data;
  };

  const createSubscription = async (orderId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("No user found");
      return;
    }

    console.log("Creating subscription for order:", orderId, "user:", user.id);

    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

    const { data, error } = await supabase
      .from("slot_subscriptions")
      .insert([
        {
          user_id: user.id,
          checkout_id: Number(orderId),
          amount: 500,
          status: "active",
          last_payment_date: new Date().toISOString(),
          next_payment_date: nextPaymentDate.toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error(
        "Subscription creation error:",
        error.message,
        error.details,
        error.hint,
      );
    } else {
      console.log("Subscription created successfully:", data);
    }
  };

  const isFormValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.phone.trim();

  // --- Paystack Payment ---
  const handlePaystack = async () => {
    if (!isFormValid) {
      toast({
        title: "Please fill all fields",
        description: "All billing details are required.",
        variant: "destructive",
      });
      return;
    }

    // Check if Paystack is loaded
    if (!(window as any).PaystackPop) {
      toast({
        title: "Payment Error",
        description: "Paystack is still loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const order = await createCheckout("paystack");
    if (!order) {
      setIsProcessing(false);
      return;
    }

    try {
      const paystackKey = import.meta.env.VITE_PAYSTACK_KEYS;

      if (!paystackKey) {
        throw new Error("Paystack public key is missing");
      }

      if (!paystackKey.startsWith("pk_")) {
        throw new Error("Invalid Paystack public key format");
      }

      const config = {
        key: paystackKey,
        email: order.email,
        amount: Number(order.amount) * 100,
        currency: "NGN",
        ref: `SLOT_${order.id}_${Date.now()}`,
        callback: function (response: any) {
          console.log("Payment successful:", response);

          // Handle async operations separately
          const updatePaymentStatus = async () => {
            try {
              const { error: updateError } = await supabase
                .from("checkout")
                .update({
                  status: "paid",
                  transaction_ref: response.reference,
                })
                .eq("id", order.id);

              if (updateError) {
                console.error("Update error:", updateError);
                toast({
                  title: "Warning",
                  description: "Payment received but failed to update record.",
                  variant: "destructive",
                });
                return;
              }

              await createSubscription(order.id);

              toast({
                title: "Payment successful 🎉",
                description: "Your slot has been secured!",
              });

              setTimeout(() => {
                window.location.href = `https://chat.whatsapp.com/LlXB7iYXmTx8JpzKulzTvD`;
              }, 2000);
            } catch (error: any) {
              console.error("Update error:", error);
              toast({
                title: "Warning",
                description: "Payment received but failed to update record.",
                variant: "destructive",
              });
            }
          };

          updatePaymentStatus();
        },
        onClose: function () {
          console.log("Payment window closed");
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
      console.error("Paystack error:", error);
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

  // --- Flutterwave Payment ---
  const handleFlutterwave = async () => {
    if (!isFormValid) {
      toast({
        title: "Please fill all fields",
        description: "All billing details are required.",
        variant: "destructive",
      });
      return;
    }

    // Check if Flutterwave is loaded
    if (!(window as any).FlutterwaveCheckout) {
      toast({
        title: "Payment Error",
        description: "Flutterwave is still loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const order = await createCheckout("flutterwave");
    if (!order) {
      setIsProcessing(false);
      return;
    }

    try {
      (window as any).FlutterwaveCheckout({
        public_key: import.meta.env.VITE_FLUTTERWAVE_KEY,
        tx_ref: `SLOT_${order.id}_${Date.now()}`,
        amount: Number(order.amount),
        currency: "NGN",
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: order.email,
          name: `${order.first_name} ${order.last_name}`,
          phone_number: order.phone,
        },
        customizations: {
          title: "Farm Slot Payment",
          description: "Payment for practical farm slot",
          logo: "https://your-logo-url.com/logo.png", // Optional
        },
        callback: async function (response: any) {
          console.log("Payment successful:", response);

          if (response.status === "successful") {
            try {
              const { error: updateError } = await supabase
                .from("checkout")
                .update({
                  status: "paid",
                  transaction_ref: response.transaction_id,
                })
                .eq("id", order.id);

              if (updateError) throw updateError;

              await createSubscription(order.id);

              toast({
                title: "Payment successful 🎉",
                description: "Your slot has been secured!",
              });

              // Redirect after success
              setTimeout(() => {
                window.location.href = `https://chat.whatsapp.com/LlXB7iYXmTx8JpzKulzTvD`;
              }, 1000);
            } catch (error) {
              console.error("Update error:", error);
              toast({
                title: "Warning",
                description: "Payment received but failed to update record.",
                variant: "destructive",
              });
            }
          }

          setIsProcessing(false);
        },
        onclose: function () {
          console.log("Payment window closed");
          toast({
            title: "Payment cancelled",
            description: "You closed the payment window.",
          });
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Flutterwave error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
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
              pay with paystack oor flutterwave.
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
                </div>

                {/* Payment Buttons */}
                <div className="mt-8 space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred payment method:
                  </p>

                  <Button
                    onClick={handlePaystack}
                    // disabled={isProcessing}
                    disabled={true}
                    className="w-full h-12 bg-[#0BA4DB] hover:bg-[#0993c7] text-white font-semibold"
                  >
                    {isProcessing ? "Processing..." : "Pay with Paystack"}
                  </Button>

                  <Button
                    onClick={handleFlutterwave}
                    // disabled={isProcessing}
                    disabled={true}
                    className="w-full h-12 bg-[#F5A623] hover:bg-[#e09515] text-white font-semibold"
                  >
                    {isProcessing ? "Processing..." : "Pay with Flutterwave"}
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
                        ₦{slotPrice.toLocaleString()}
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

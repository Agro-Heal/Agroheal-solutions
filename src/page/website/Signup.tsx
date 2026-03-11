import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Mail, Lock, User, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import * as Sentry from "@sentry/react";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [referral, setReferral] = useState<string>(() => {
    return searchParams.get("ref") || "";
  });

  // console.log("ref param:", searchParams.get("ref"));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1️Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          referral_code: referral.trim().toUpperCase() || null,
        },
      },
    });

    setLoading(false);

    if (error) {
      Sentry.captureException(error, {
        extra: {
          action: "signup",
        },
      });

      toast.error(`${error.message}`, {
        duration: 5000,
        position: "top-right",
        icon: "📩",
        style: {
          background: "crimson",
          color: "#fff",
          borderRadius: "10px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      });
      return;
    }

    const user = data.user;
    if (!user) return;

    // 2️Handle referral code input
    // let referrerId: string | null = null;

    // if (referral) {
    //   // search for the referrer by referral code
    //   const { data: referrer } = await supabase
    //     .from("profiles")
    //     .select("id")
    //     .eq("referral_code", referral.toUpperCase())
    //     .maybeSingle();

    //   // if (referrer) referrerId = referrer.id;
    // }

    // Generate your own referral code
    // const myReferralCode = Math.random()
    //   .toString(36)
    //   .substring(2, 8)
    //   .toUpperCase();

    // Update the new user's profile
    // await supabase
    //   .from("profiles")
    //   .update({
    //     full_name: name,
    //     referral_code: myReferralCode,
    //     referred_by: referrerId,
    //   })
    //   .eq("id", user.id);

    // const { error: profileError } = await supabase.from("profiles").upsert(
    //   {
    //     id: user.id,
    //     full_name: name,
    //     referral_code: myReferralCode,
    //     referred_by: referrerId,
    //     created_at: new Date().toISOString(),
    //   },
    //   { onConflict: "id" },
    // );

    // if (profileError) {
    //   Sentry.captureException(profileError, {
    //     extra: {
    //       action: "profile_creation",
    //       userId: user.id,
    //     },
    //   });

    //   toast.error(
    //     "Account created but profile setup failed. Please contact support.",
    //     {
    //       duration: 5000,
    //       position: "top-right",
    //       style: {
    //         background: "crimson",
    //         color: "#fff",
    //         borderRadius: "10px",
    //         padding: "12px 16px",
    //         fontSize: "14px",
    //       },
    //     },
    //   );

    //   return;
    // }

    // Success toast
    toast.success(
      "Signup successful! An email has been sent to your registered mail acount, Please verify your email.",
      {
        duration: 5000,
        position: "top-right",
        icon: "📩",
        style: {
          background: "#065f46",
          color: "#fff",
          borderRadius: "10px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      },
    );

    Sentry.metrics.count("signup_completed", 1);
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-green-800 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-semibold">Agroheal</span>
        </Link>

        <div className="bg-card rounded-2xl shadow-elevated border border-border/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Create Your Account</h1>
            <p className="text-muted-foreground mt-2">
              Start your organic farming journey today
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSignup}>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral">Referral Code (Optional)</Label>
              <Input
                id="referral"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                type="text"
                disabled={referral.length > 10 ? true : false}
                placeholder="Enter referral code"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-green-800 hover:bg-green-800/90 text-white"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-green-800 font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Leaf,
  BookOpen,
  Sprout,
  Users,
  TrendingUp,
  Copy,
  ExternalLink,
  CheckCircle,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import toast, { Toaster } from "react-hot-toast";

// interface props

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const setupProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // get profile row
      let { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) return console.error(error);

      const updatedFields: any = {};

      // Save name if missing
      if (!profileData.full_name && user.user_metadata?.full_name) {
        updatedFields.full_name = user.user_metadata.full_name;
      }

      // Generate referral code if missing
      if (!profileData.referral_code) {
        updatedFields.referral_code = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
      }

      // UpdateDB only if needed
      if (Object.keys(updatedFields).length > 0) {
        await supabase.from("profiles").update(updatedFields).eq("id", user.id);

        profileData = { ...profileData, ...updatedFields };
      }

      const { count, error: countError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user.id);

      if (countError) console.error(countError);

      profileData.total_referrals = count || 0;
      // console.log(count);

      setProfile(profileData);
    };

    setupProfile();
  }, []);

  // handle copy
  const handleCopyReferralCode = async () => {
    const textCopy = `https://agroheal.solutions/signup#${profile?.referral_code}`;
    try {
      await navigator.clipboard.writeText(
        `You have been referred by ${profile?.full_name}, click their referral link and signup ${textCopy} or copy and paste the code ${profile?.referral_code}, click on this link https://agroheal.solutions/signup and paste the code as your referral code`,
      );
      toast.success(`${profile?.referral_code} copied to clipboard`, {
        duration: 3000,
        position: "top-right",
        icon: "📩",
        style: {
          background: "green",
          color: "#fff",
          borderRadius: "10px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      });
    } catch (err) {
      console.error("error:", err);
      toast.error(`Failed to copy${profile?.referral_code}`, {
        duration: 3000,
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
    }
  };

  if (!profile)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Toaster />
        <div className="flex flex-col items-center justify-center gap-4">
          <LoaderCircle
            className="animate animate-spin text-greem-800"
            size={48}
          />{" "}
          <p> Dashboard loading...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className=" text-3xl font-bold text-foreground">
              Welcome back, {profile?.full_name} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your farming journey.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: "Platform Status",
                // value: profile?.platformSubscription ? "Active" : "Inactive",
                value: "Active",
                icon: Leaf,
                // color: profile?.platformSubscription
                //   ? "text-primary"
                //   : "text-green-800",
                color: "text-green-800",
              },
              {
                label: "Total Courses",
                value: `${profile?.courses}`,
                icon: BookOpen,
                color: "text-[#d17547]",
              },
              {
                label: "Farm Slot",
                // value: profile?.slotSubscription ? "Secured" : "Not Secured",
                value: "Available",
                icon: Sprout,
                color: profile?.slotSubscription
                  ? "text-green-800"
                  : "text-green-800",
              },
              {
                label: "Total Referrals",
                value: profile?.total_referrals,
                icon: Users,
                color: "text-[#e8b130]",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-soft border border-border/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-green-800 text-sm">{stat.label}</span>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className=" text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Subscriptions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-2 bg-card rounded-xl p-6 shadow-soft border border-border/50"
            >
              <h2 className=" text-xl font-semibold text-foreground mb-6">
                Your Subscriptions
              </h2>

              <div className="space-y-4">
                {/* Platform Subscription */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border ">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-800/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Platform Subscription
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Access to all courses
                      </p>
                    </div>
                  </div>
                  {/* {profile?.platformSubscription ? (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="w-5 h-5 text-green-800" />
                      <span className="font-medium text-green-800">Active</span>
                    </div>
                  ) : (
                    <Button size="sm" asChild>
                      <Link to="/pricing">Subscribe</Link>
                    </Button>
                  )} */}
                </div>

                {/* Slot Subscription */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border ">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#d17547]/20 flex items-center justify-center">
                      <Sprout className="w-6 h-6 text-[#d17547]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Practical Farm Slot
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Hands-on farming experience
                      </p>
                    </div>
                  </div>
                  {profile?.slotSubscription ? (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Secured</span>
                    </div>
                  ) : (
                    <Button size="sm" className="bg-[#d17547] text-white">
                      <Link to="/dashboard/slots">Secure Slot</Link>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Affiliate Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-card rounded-xl p-6 shadow-soft border border-border/50 text-green-800"
            >
              <h2 className=" text-xl font-semibold text-foreground mb-6">
                Affiliate Program
              </h2>

              <div className="space-y-6">
                {/* Referral Link */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Your Referral Code
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-foreground font-mono text-sm">
                      {profile?.referral_code}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyReferralCode}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-800 text-sm">
                      Total Referrals
                    </span>
                    <span className="font-semibold text-foreground">
                      {profile?.total_referrals}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-800 text-sm">Earnings</span>
                    <span className="font-semibold text-foreground">
                      ₦{Number(profile?.total_referrals) * 500}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-green-800">
                    Earnings are calculated monthly. Withdrawals available in
                    future update.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <Button
              variant="outline"
              size="lg"
              asChild
              className="justify-start gap-3"
            >
              <Link to="/dashboard/courses">
                <BookOpen className="w-5 h-5 text-green-800" />
                Continue Learning
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="justify-start gap-3"
            >
              <Link to="/dashboard/slots">
                <Sprout className="w-5 h-5 text-[#d17547]" />
                View Farm Slots
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="justify-start gap-3"
            >
              <Link to="/dashboard/profile">
                <TrendingUp className="w-5 h-5 text-[#d17547]" />
                View Profile
                <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

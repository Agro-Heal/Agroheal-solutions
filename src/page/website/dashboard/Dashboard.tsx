import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Leaf,
  BookOpen,
  Sprout,
  Users,
  Copy,
  CheckCircle,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const setupProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) return console.error(error);

      const updatedFields: any = {};

      if (!profileData.full_name && user.user_metadata?.full_name) {
        updatedFields.full_name = user.user_metadata.full_name;
      }

      if (!profileData.referral_code) {
        updatedFields.referral_code = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
      }

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
      setProfile(profileData);
    };

    setupProfile();
  }, []);

  const handleCopyReferralCode = async () => {
    const textCopy = `
    https://agroheal.solutions/signup?ref=${profile?.referral_code}

Join Our Ginger & Pepper Group Farming Initiative!

Fun fact: The global Ginger Export market is worth over USD 4.1 billion, with a known preference for Nigerian ginger due to its high pungency and strong oleoresin oil content.   

•⁠  ⁠Unlock Double Profits with Pepper & Ginger Inter-crop!

•⁠  ⁠Better Land Use that Maximizes every inch of soil for more money in your pocket.

•⁠  ⁠Better Pest & Disease Balance to make life tough for pests and disease.

•⁠  ⁠Better Soil Health: Ginger's deep roots and pepper's canopy work together for healthier soil.

•⁠  ⁠Better Market access after harvest: Collective bargaining power for selling produce.

•⁠  ⁠Easy Access to inputs (pepper seeds, ginger rhizomes and compost) at reduced cost.

•⁠  ⁠Training, Access to land & Expert support provided.

With proper management, you can expect over 300% higher yield from super habanero pepper harvest from the 4th month and a lucrative ginger harvest of over 200% ROI by the 8th month!

"Come learn, collaborate, and grow your income!"

Date: March 1st 2026. 
Time: 4pm - 6pm. 
Venue: Private Telegram Group. 
Trainer: Saka Adesoji (Saka Organic Foods)

Session will be recorded and made available on user dashboards.

Click on the link above to join the learning platform with a registration fee of N1,000 only.`;

    try {
      await navigator.clipboard.writeText(`${textCopy} `);
      toast.success(`${profile?.referral_code} copied to clipboard`, {
        duration: 3000,
        position: "top-right",
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
      toast.error(`Failed to copy ${profile?.referral_code}`, {
        duration: 3000,
        position: "top-right",
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
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Toaster />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-800/10 flex items-center justify-center">
            <LoaderCircle className="animate-spin text-green-800" size={32} />
          </div>
          <p className="text-gray-500 text-sm font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );

  const stats = [
    {
      label: "Platform Status",
      value: "Active",
      icon: Leaf,
      bg: "bg-green-50",
      iconColor: "text-green-700",
      valueColor: "text-green-700",
      badge: true,
    },
    {
      label: "Total Courses",
      value: `${profile.courses ?? 0}`,
      icon: BookOpen,
      bg: "bg-orange-50",
      iconColor: "text-[#d17547]",
      valueColor: "text-gray-900",
      badge: false,
    },
    {
      label: "Farm Slot",
      value: "Available",
      icon: Sprout,
      bg: "bg-green-50",
      iconColor: "text-green-700",
      valueColor: "text-gray-900",
      badge: false,
    },
    {
      label: "Total Referrals",
      value: `${profile?.total_referrals}`,
      icon: Users,
      bg: "bg-yellow-50",
      iconColor: "text-[#e8b130]",
      valueColor: "text-gray-900",
      badge: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      {/* Top Hero Banner */}
      <div className="bg-green-800 px-4 md:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-green-300 text-sm font-medium mb-1">
            {new Date().toLocaleDateString("en-NG", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {profile?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-green-200 mt-1 text-sm">
            Here's an overview of your farming journey.
          </p>
        </motion.div>
      </div>

      <div className="px-4 md:px-8 -mt-8 pb-12 max-w-6xl mx-auto">
        {/* Stats Grid — overlaps the banner */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                {stat.badge && (
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mb-1">
                {stat.label}
              </p>
              <p className={`text-xl font-bold ${stat.valueColor}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Subscriptions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Your Subscriptions
              </h2>
              <span className="text-xs text-gray-400">2 services</span>
            </div>

            <div className="space-y-3">
              {/* Platform Subscription */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-800/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-800" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Platform Subscription
                    </h3>
                    <p className="text-xs text-gray-500">
                      Access to all courses
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Active</span>
                </div>
              </div>

              {/* Slot Subscription */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#d17547]/10 flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-[#d17547]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Practical Farm Slot
                    </h3>
                    <p className="text-xs text-gray-500">
                      Hands-on farming experience
                    </p>
                  </div>
                </div>
                {profile?.slotSubscription ? (
                  <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Secured</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="bg-[#d17547] hover:bg-[#d17547]/90 text-white text-xs rounded-xl h-8"
                    asChild
                  >
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
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Affiliate</h2>
              <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-5">
              {/* Referral Code */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block uppercase tracking-wider">
                  Your Referral Code
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl text-green-800 font-mono text-sm font-bold tracking-widest">
                    {profile?.referral_code}
                  </div>
                  <button
                    onClick={handleCopyReferralCode}
                    className="w-10 h-10 rounded-xl bg-green-800 flex items-center justify-center hover:bg-green-700 transition-colors flex-shrink-0"
                  >
                    <Copy className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Earnings */}
              <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-xl p-4 text-white">
                <p className="text-green-200 text-xs mb-1">Total Earnings</p>
                <p className="text-2xl font-bold">
                  ₦{Number(profile?.total_referrals) * 500}
                </p>
                <p className="text-green-300 text-xs mt-1">
                  {profile?.total_referrals} referral
                  {profile?.total_referrals !== 1 ? "s" : ""}
                </p>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Withdrawals available in a future update.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                to: "/dashboard/courses",
                icon: BookOpen,
                label: "Continue Learning",
                desc: "Pick up where you left off",
                iconBg: "bg-green-50",
                iconColor: "text-green-800",
              },
              {
                to: "/dashboard/slots",
                icon: Sprout,
                label: "View Farm Slots",
                desc: "Secure your farming spot",
                iconBg: "bg-orange-50",
                iconColor: "text-[#d17547]",
              },
              // {
              //   to: "/dashboard/profile",
              //   icon: TrendingUp,
              //   label: "View Profile",
              //   desc: "Manage your account",
              //   iconBg: "bg-yellow-50",
              //   iconColor: "text-[#e8b130]",
              // },
            ].map((action, i) => (
              <Link
                key={i}
                to={action.to}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center`}
                  >
                    <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-400">{action.desc}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-green-700 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

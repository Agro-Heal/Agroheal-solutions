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
import { Toaster } from "react-hot-toast";
import FarmingInitiativePopup from "./TelegramPopup";
import ShareReferralModal from "@/components/webComponents/shareModal";
import { X, Send, Bell } from "lucide-react";
import PhoneModal from "./PhoneModal";

interface referralProps {
  id: string;
  full_name: string;
  created_at: string;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [referralNumber, setReferralNumber] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("Profile fetch error:", selectError);
        setProfileError(true);
        return;
      }

      if (!profileData) {
        setProfileError(true);
        return;
      }

      if (!profileData.phone) {
        setShowPhoneModal(true);
      }

      const getReferrerName = async (referrerId: string) => {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", referrerId)
          .single();
        return data?.full_name || "Unknown";
      };

      // apply pending referral if not yet processed
      const pendingReferral = user.user_metadata?.referral_code;
      if (pendingReferral && !profileData.referred_by) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", pendingReferral)
          .maybeSingle();

        if (referrer) {
          await supabase
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", user.id);
          profileData.referred_by = referrer.id;
        }

        await supabase.auth.updateUser({ data: { referral_code: null } });
      }

      const { data: referrals } = await supabase
        .from("profiles")
        .select("id, full_name, phone, created_at")
        .eq("referred_by", user.id);

      profileData.referrals = referrals || [];

      if (profileData.referred_by) {
        const { data: referrerData } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .eq("id", profileData.referred_by)
          .single();

        profileData.referrer_phone = referrerData?.phone || null;
        profileData.referrer_name = referrerData?.full_name || "Unknown";
        setReferralNumber(profileData?.referrer_phone);
      }

      setProfile({ ...profileData });
    };

    fetchProfile();
  }, []);

  if (profileError)
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center justify-center gap-4 text-center px-4">
          <p className="text-gray-700 font-semibold">
            Failed to load your profile.
          </p>
          <p className="text-gray-500 text-sm">
            Please refresh the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );

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
      <FarmingInitiativePopup />
      {/* Top Hero Banner */}
      <div className="bg-green-800 px-4 md:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[96%] mx-auto"
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

      <div className="px-4 md:px-8 -mt-8 pb-12 max-w-[96%] mx-auto">
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

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
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
              <div>
                <NotificationCards />
              </div>
            </div>
          </motion.div>

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
              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block uppercase tracking-wider">
                  Your Referral Code
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl text-green-800 font-mono text-sm font-bold tracking-widest">
                    {profile?.referral_code}
                  </div>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-10 h-10 rounded-xl bg-green-800 flex items-center justify-center hover:bg-green-700 transition-colors flex-shrink-0"
                  >
                    <Copy className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-xl p-4 text-white">
                <p className="text-green-200 text-xs mb-1">Total Earnings</p>
                <p className="text-2xl font-bold">
                  ₦{Number(profile?.referral_earnings ?? 0).toLocaleString()}
                </p>
              </div>
              {profile?.referred_by && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Referred by
                  </p>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-800/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-800">
                          {profile?.referrer_name?.charAt(0)?.toUpperCase() ??
                            "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700">
                          {profile?.referrer_name ?? "Unknown referrer"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {profile?.referrer_phone ?? "No phone number"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {profile?.referrer_created_at
                        ? new Date(
                            profile.referrer_created_at,
                          ).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString(
                              "en-NG",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "No date"}
                    </span>
                  </div>
                </div>
              )}
              {profile?.referrals?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    People You Referred
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {profile.referrals.map((r: referralProps) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-7 h-7 rounded-full bg-green-800/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-green-800">
                              {r.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 block">
                              {r.full_name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {r.phone || "No Phone No."}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 leading-relaxed">
                Withdrawals available in a future update.
                {referralNumber.length <= 0 ? (
                  ""
                ) : (
                  <>
                    For Further information contact your referral - <br />
                    <a
                      className="text-green-800 font-bold"
                      href={`tel:${referralNumber}`}
                    >
                      Call: {referralNumber}
                    </a>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </div>

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
                to: "/dashboard/slots-subscription",
                icon: Sprout,
                label: "Slot Management",
                desc: "Manage secured farm slot",
                iconBg: "bg-orange-50",
                iconColor: "text-[#d17547]",
              },
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
      <ShareReferralModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        referralCode={profile?.referral_code}
      />
      {showPhoneModal && profile && (
        <PhoneModal
          userId={profile.id}
          onComplete={() => {
            setShowPhoneModal(false);
            setProfile((prev: any) => ({ ...prev, phone: true })); // suppress re-trigger
          }}
        />
      )}
    </div>
  );
};

const NotificationCards = () => {
  const [dismissed, setDismissed] = useState<number[]>([]);

  // notifications - training
  const notifications = [
    {
      id: 1,
      tag: "Training",
      title: "Join Our Ginger & Pepper Farming Initiative",
      body: "Join and unlock serious profits from intercropping",
      cta: "Join Telegram Group",
      ctaHref: "https://t.me/+8a7pjUluliZjNTg0",
      Icon: Sprout,
      ActionIcon: Send,
      tagStyle: "bg-green-100 text-green-800",
      accentBar: "bg-green-800",
      iconBg: "bg-green-50",
      iconColor: "text-green-800",
      ctaStyle: "bg-green-800 hover:bg-green-700 text-white",
      time: "",
    },
  ];

  const visible = notifications.filter((n) => !dismissed.includes(n.id));

  return (
    <div className="bg-gray-50 px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 leading-tight">
            Notifications
          </h2>
          {visible.length > 0 && (
            <p className="text-xs text-gray-400">
              {visible.length} unread message{visible.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">You're all caught up</p>
            <p className="text-xs mt-1">No new notifications right now</p>
          </div>
        ) : (
          visible.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Accent bar */}
              <div className={`h-1 w-full ${n.accentBar}`} />

              {/* Card body */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${n.tagStyle}`}
                    >
                      {n.tag}
                    </span>
                    <span className="text-xs text-gray-400">{n.time}</span>
                  </div>
                  <button
                    onClick={() => setDismissed((prev) => [...prev, n.id])}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Icon + content */}
                <div className="flex gap-3 sm:gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${n.iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    <n.Icon className={`w-5 h-5 ${n.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1.5">
                      {n.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-4 sm:mx-5 border-t border-gray-100" />

              {/* CTA footer */}
              <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
                <a
                  href={n.ctaHref}
                  target={n.ctaHref.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${n.ctaStyle}`}
                >
                  <n.ActionIcon className="w-4 h-4" />
                  {n.cta}
                </a>

                <button
                  onClick={() => setDismissed((prev) => [...prev, n.id])}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;

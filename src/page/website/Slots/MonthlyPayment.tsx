// import { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import {
//   AlertCircle,
//   CheckCircle,
//   Calendar,
//   CreditCard,
//   Clock,
//   Sprout,
//   ArrowRight,
//   LandPlot,
// } from "lucide-react";
// import Lottie from "lottie-react";
// import NoDataFound from "../../../assets/Icon/searching.json";
// import { motion } from "framer-motion";

// interface Subscription {
//   id: string;
//   status: string;
//   amount: number;
//   slotprice: number;
//   next_payment_date: string;
//   last_payment_date: string;
//   slots: string;
// }

// const MonthlyPayment = () => {
//   const { toast } = useToast();
//   const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
//   const [activeSubscription, setActiveSubscription] =
//     useState<Subscription | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [loading, setLoading] = useState(true);

//   const fetchSubscription = async () => {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     if (!user) return;

//     const { data, error } = await supabase
//       .from("slot_subscriptions")
//       .select("*")
//       .eq("user_id", user.id)
//       .order("last_payment_date", { ascending: false });

//     if (error) console.error(error);

//     const all = data || [];
//     setSubscriptions(all);

//     // Use most recent active slot, fallback to most recent
//     const active = all.find((s) => s.status === "active") || all[0] || null;
//     setActiveSubscription(active);
//     setLoading(false);
//   };

//   useEffect(() => {
//     const load = async () => {
//       await fetchSubscription();
//     };
//     load();
//   }, []);

//   useEffect(() => {
//     if (document.getElementById("paystack-script")) return;
//     const script = document.createElement("script");
//     script.id = "paystack-script";
//     script.src = "https://js.paystack.co/v1/inline.js";
//     script.async = true;
//     document.body.appendChild(script);
//   }, []);

//   const isPaymentDue = () => {
//     if (!activeSubscription) return false;
//     const nextDate = new Date(activeSubscription.next_payment_date);
//     const today = new Date();
//     const diffDays = Math.ceil(
//       (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
//     );
//     return diffDays <= 3;
//   };

//   const daysUntilPayment = () => {
//     if (!activeSubscription) return 0;
//     const nextDate = new Date(activeSubscription.next_payment_date);
//     const today = new Date();
//     return Math.ceil(
//       (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
//     );
//   };

//   const handleMonthlyPayment = async () => {
//     if (!activeSubscription) return;

//     if (!(window as any).PaystackPop) {
//       toast({
//         title: "Payment Error",
//         description: "Paystack is still loading. Please try again.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     if (!user) return;

//     setIsProcessing(true);

//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("email")
//       .eq("id", user.id)
//       .single();

//     try {
//       const config = {
//         key: import.meta.env.VITE_PAYSTACK_KEYS,
//         email: profile?.email || user.email,
//         amount: 1000 * 100,
//         currency: "NGN",
//         ref: `SLOT_${activeSubscription.id}_${Date.now()}`,
//         metadata: {
//           custom_fields: [
//             {
//               display_name: "Subscription ID",
//               variable_name: "subscription_id",
//               value: activeSubscription.id,
//             },
//             {
//               display_name: "User ID",
//               variable_name: "user_id",
//               value: user.id,
//             },
//           ],
//         },
//         callback: function (response: any) {
//           if (response.status === "success") {
//             toast({
//               title: "Payment successful",
//               description: "Your subscription has been renewed for 30 days.",
//             });
//             setTimeout(() => {
//               fetchSubscription();
//               setIsProcessing(false);
//             }, 3000);
//           } else {
//             toast({
//               title: "Payment failed",
//               description: "Please try again.",
//               variant: "destructive",
//             });
//             setIsProcessing(false);
//           }
//         },
//         onClose: function () {
//           toast({
//             title: "Payment cancelled",
//             description: "You closed the payment window.",
//           });
//           setIsProcessing(false);
//         },
//       };

//       const handler = (window as any).PaystackPop.setup(config);
//       handler.openIframe();
//     } catch (error) {
//       toast({
//         title: "Payment Error",
//         description: "Failed to initialize payment.",
//         variant: "destructive",
//       });
//       setIsProcessing(false);
//     }
//   };

//   function formatNumber(value: number | string): string {
//     const num = Number(value);
//     if (isNaN(num)) return String(value);
//     return num.toLocaleString("en-NG", {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 2,
//     });
//   }

//   if (loading)
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-12 h-12 rounded-2xl bg-green-800/10 flex items-center justify-center animate-pulse">
//             <Sprout className="w-6 h-6 text-green-800" />
//           </div>
//           <p className="text-sm text-gray-500 font-medium">
//             Loading subscription...
//           </p>
//         </div>
//       </div>
//     );

//   if (!activeSubscription)
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <div className="text-center max-w-sm">
//           <Lottie
//             animationData={NoDataFound}
//             loop={true}
//             className="w-52 h-52 mx-auto"
//           />
//           <h2 className="text-xl font-bold text-gray-900 mb-2">
//             No Active Subscription
//           </h2>
//           <p className="text-gray-500 text-sm mb-6">
//             You haven't secured a farm slot yet. Purchase one to get started.
//           </p>
//           <a
//             href="/dashboard/slots"
//             className="inline-flex items-center gap-2 bg-green-800 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-green-700 transition-colors"
//           >
//             Secure your Farm Slot
//             <ArrowRight className="w-4 h-4" />
//           </a>
//         </div>
//       </div>
//     );

//   const days = daysUntilPayment();
//   const isOverdue = days < 0;
//   const isDue = isPaymentDue();

//   const statusConfig = isOverdue
//     ? {
//         icon: AlertCircle,
//         label: `Payment overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`,
//         headerBg: "bg-red-600",
//       }
//     : isDue
//       ? {
//           icon: AlertCircle,
//           label: `Payment due in ${days} day${days > 1 ? "s" : ""}`,
//           headerBg: "bg-yellow-500",
//         }
//       : {
//           icon: CheckCircle,
//           label: `Active — next payment in ${days} days`,
//           headerBg: "bg-green-800",
//         };

//   const StatusIcon = statusConfig.icon;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Top Banner */}
//       <div className="bg-green-800 px-4 md:px-8 pt-8 pb-16">
//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">
//             Slot Management
//           </p>
//           <h1 className="text-2xl md:text-3xl font-bold text-white">
//             Monthly Subscription
//           </h1>
//           <p className="text-green-200 mt-1 text-sm">
//             Manage your farm slot monthly fee
//           </p>
//         </motion.div>
//       </div>

//       <div className="px-4 md:px-8 -mt-8 pb-12 max-w-2xl mx-auto space-y-4">
//         {/* Active Slot Status Card */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//           className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
//         >
//           <div
//             className={`${statusConfig.headerBg} px-6 py-4 flex items-center gap-3`}
//           >
//             <StatusIcon className="w-5 h-5 text-white flex-shrink-0" />
//             <p className="text-white font-semibold text-sm">
//               {statusConfig.label}
//             </p>
//           </div>

//           <div className="px-6 py-5 space-y-4">
//             <div className="flex items-center justify-between py-3 border-b border-gray-100">
//               <div className="flex items-center gap-2 text-gray-500 text-sm">
//                 <CreditCard className="w-4 h-4" />
//                 Monthly Fee
//               </div>
//               <span className="font-bold text-gray-900 text-base">₦1,000</span>
//             </div>

//             <div className="flex items-center justify-between py-3 border-b border-gray-100">
//               <div className="flex items-center gap-2 text-gray-500 text-sm">
//                 <CreditCard className="w-4 h-4" />
//                 Purchased Amount
//               </div>
//               <span className="font-bold text-gray-900 text-base">
//                 ₦{formatNumber(activeSubscription?.slotprice)}
//               </span>
//             </div>

//             <div className="flex items-center justify-between py-3 border-b border-gray-100">
//               <div className="flex items-center gap-2 text-gray-500 text-sm">
//                 <Clock className="w-4 h-4" />
//                 Last Payment
//               </div>
//               <span className="font-semibold text-gray-900 text-sm">
//                 {new Date(
//                   activeSubscription.last_payment_date,
//                 ).toLocaleDateString("en-NG", {
//                   day: "numeric",
//                   month: "short",
//                   year: "numeric",
//                 })}
//               </span>
//             </div>

//             <div className="flex items-center justify-between py-3 border-b border-gray-100">
//               <div className="flex items-center gap-2 text-gray-500 text-sm">
//                 <LandPlot className="w-4 h-4" />
//                 Number of slots
//               </div>
//               <span className="font-semibold text-gray-900 text-sm">
//                 {activeSubscription?.slots}
//               </span>
//             </div>

//             <div className="flex items-center justify-between py-3">
//               <div className="flex items-center gap-2 text-gray-500 text-sm">
//                 <Calendar className="w-4 h-4" />
//                 Next Payment Due
//               </div>
//               <span className="font-semibold text-gray-900 text-sm">
//                 {new Date(
//                   activeSubscription.next_payment_date,
//                 ).toLocaleDateString("en-NG", {
//                   day: "numeric",
//                   month: "short",
//                   year: "numeric",
//                 })}
//               </span>
//             </div>
//           </div>
//         </motion.div>

//         {/* Progress bar */}
//         {!isOverdue && (
//           <motion.div
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4, delay: 0.1 }}
//             className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5"
//           >
//             <div className="flex justify-between items-center mb-2">
//               <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
//                 Cycle Progress
//               </span>
//               <span className="text-xs font-bold text-green-800">
//                 {30 - Math.min(days, 30)} / 30 days
//               </span>
//             </div>
//             <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//               <motion.div
//                 initial={{ width: 0 }}
//                 animate={{
//                   width: `${Math.min(((30 - days) / 30) * 100, 100)}%`,
//                 }}
//                 transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
//                 className={`h-full rounded-full ${isDue ? "bg-yellow-400" : "bg-green-600"}`}
//               />
//             </div>
//             <p className="text-xs text-gray-400 mt-2">
//               {days} day{days !== 1 ? "s" : ""} remaining in this cycle
//             </p>
//           </motion.div>
//         )}

//         {/* Pay Button */}
//         {(isDue || isOverdue) && (
//           <motion.div
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4, delay: 0.15 }}
//           >
//             <Button
//               onClick={handleMonthlyPayment}
//               disabled={isProcessing}
//               className="w-full bg-green-800 hover:bg-green-700 text-white font-semibold rounded-2xl text-base py-4"
//             >
//               {isProcessing ? (
//                 <span className="flex items-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   Processing...
//                 </span>
//               ) : (
//                 <span className="flex items-center gap-2">
//                   <CreditCard className="w-4 h-4" />
//                   Pay ₦1,000 Monthly Fee
//                 </span>
//               )}
//             </Button>
//             {isOverdue && (
//               <p className="text-xs text-red-500 text-center mt-2 font-medium">
//                 Your slot may be suspended if payment is not made soon.
//               </p>
//             )}
//           </motion.div>
//         )}

//         {/* Slot Purchase History */}
//         {subscriptions.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4, delay: 0.2 }}
//             className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
//           >
//             <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
//               <h3 className="font-bold text-gray-900 text-sm">
//                 Slot Purchase History
//               </h3>
//               <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
//                 {subscriptions.length} slot{subscriptions.length > 1 ? "s" : ""}
//               </span>
//             </div>

//             <div className="divide-y divide-gray-50">
//               {subscriptions.map((slot, index) => (
//                 <div
//                   key={slot.id}
//                   className="px-6 py-4 flex items-center justify-between"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
//                       <Sprout className="w-4 h-4 text-green-700" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold text-gray-900">
//                         Slot #{subscriptions.length - index}
//                       </p>
//                       <div className="flex items-center gap-4">
//                         <p className="text-xs text-gray-400">
//                           ₦{formatNumber(slot?.slotprice)}
//                         </p>
//                         <p className="text-xs text-gray-400">
//                           {new Date(slot.last_payment_date).toLocaleDateString(
//                             "en-NG",
//                             {
//                               day: "numeric",
//                               month: "short",
//                               year: "numeric",
//                             },
//                           )}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm font-bold text-gray-900">
//                       ₦{Number(slot.amount)?.toLocaleString()}
//                     </p>
//                     <span
//                       className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
//                         slot.status === "active"
//                           ? "bg-green-100 text-green-700"
//                           : "bg-gray-100 text-gray-500"
//                       }`}
//                     >
//                       {slot.status || "active"}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         )}

//         {/* Info note */}
//         <motion.p
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5, delay: 0.3 }}
//           className="text-xs text-gray-400 text-center leading-relaxed"
//         >
//           Monthly fees cover farm rent and Agroheal oversight. Your slot remains
//           active as long as payments are up to date.
//         </motion.p>
//       </div>
//     </div>
//   );
// };

// export default MonthlyPayment;

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
  LandPlot,
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import Lottie from "lottie-react";
import NoDataFound from "../../../assets/Icon/searching.json";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subscription {
  id: string;
  user_id: string;
  status: string;
  amount: number;
  slotprice: number;
  next_payment_date: string;
  last_payment_date: string;
  slots: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNumber(value: number | string): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─── Status config ────────────────────────────────────────────────────────────
function getStatusConfig(slot: Subscription) {
  const days = getDaysUntilPayment(slot);
  const isOverdue = days < 0;
  const isDue = days <= 3 && days >= 0;

  if (isOverdue) {
    return {
      label: `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`,
      headerBg: "bg-red-600",
      pill: "bg-red-100 text-red-600",
      dot: "bg-red-500",
      Icon: AlertCircle,
      isOverdue: true,
      isDue: false,
      days,
    };
  }
  if (isDue) {
    return {
      label: `Due in ${days} day${days !== 1 ? "s" : ""}`,
      headerBg: "bg-yellow-500",
      pill: "bg-yellow-100 text-yellow-700",
      dot: "bg-yellow-400",
      Icon: AlertTriangle,
      isOverdue: false,
      isDue: true,
      days,
    };
  }
  return {
    label: `Active — ${days} days left`,
    headerBg: "bg-green-700",
    pill: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    Icon: CheckCircle,
    isOverdue: false,
    isDue: false,
    days,
  };
}

function getDaysUntilPayment(slot: Subscription) {
  const nextDate = new Date(slot.next_payment_date);
  const today = new Date();
  return Math.ceil(
    (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

// ─── Page size ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

// ─── Detail View ──────────────────────────────────────────────────────────────
function SlotDetailView({
  slot,
  onBack,
  onPay,
  isProcessing,
}: {
  slot: Subscription;
  onBack: () => void;
  onPay: () => void;
  isProcessing: boolean;
}) {
  const cfg = getStatusConfig(slot);
  const StatusIcon = cfg.Icon;

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Top Banner */}
      <div className="bg-green-800 px-4 md:px-8 pt-6 pb-16">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-green-300 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to subscriptions
        </button>
        <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">
          Slot Management
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Slot Detail
        </h1>
        <p className="text-green-200 mt-1 text-sm">
          Manage your farm slot monthly fee
        </p>
      </div>

      <div className="px-4 md:px-8 -mt-8 pb-12 max-w-2xl mx-auto space-y-4">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className={`${cfg.headerBg} px-6 py-4 flex items-center gap-3`}>
            <StatusIcon className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-white font-semibold text-sm">{cfg.label}</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {[
              {
                icon: CreditCard,
                label: "Monthly Fee",
                value: "₦1,000",
                bold: true,
              },
              {
                icon: CreditCard,
                label: "Purchased Amount",
                value: `₦${formatNumber(slot.slotprice)}`,
                bold: true,
              },
              {
                icon: Clock,
                label: "Last Payment",
                value: formatDate(slot.last_payment_date),
              },
              {
                icon: LandPlot,
                label: "Number of slots",
                value: String(slot.slots),
              },
              {
                icon: Calendar,
                label: "Next Payment Due",
                value: formatDate(slot.next_payment_date),
              },
            ].map(({ icon: Icon, label, value, bold }, i, arr) => (
              <div
                key={label}
                className={`flex items-center justify-between py-3 ${
                  i < arr.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
                <span
                  className={`${bold ? "font-bold text-base" : "font-semibold text-sm"} text-gray-900`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Progress bar */}
        {!cfg.isOverdue && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cycle Progress
              </span>
              <span className="text-xs font-bold text-green-800">
                {30 - Math.min(cfg.days, 30)} / 30 days
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(((30 - cfg.days) / 30) * 100, 100)}%`,
                }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className={`h-full rounded-full ${cfg.isDue ? "bg-yellow-400" : "bg-green-600"}`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {cfg.days} day{cfg.days !== 1 ? "s" : ""} remaining in this cycle
            </p>
          </motion.div>
        )}

        {/* Pay Button */}
        {(cfg.isDue || cfg.isOverdue) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Button
              onClick={onPay}
              disabled={isProcessing}
              className="w-full bg-green-800 hover:bg-green-700 text-white font-semibold rounded-2xl text-base py-4"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pay ₦1,000 Monthly Fee
                </span>
              )}
            </Button>
            {cfg.isOverdue && (
              <p className="text-xs text-red-500 text-center mt-2 font-medium">
                Your slot may be suspended if payment is not made soon.
              </p>
            )}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs text-gray-400 text-center leading-relaxed"
        >
          Monthly fees cover farm rent and Agroheal oversight. Your slot remains
          active as long as payments are up to date.
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────
function SlotTableView({
  subscriptions,
  onView,
  onPay,
  isProcessing,
  payingId,
}: {
  subscriptions: Subscription[];
  onView: (slot: Subscription) => void;
  onPay: (slot: Subscription) => void;
  isProcessing: boolean;
  payingId: string | null;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(subscriptions.length / PAGE_SIZE);
  const paged = subscriptions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <motion.div
      key="table"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
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
            Manage your farm slot monthly fees
          </p>
        </motion.div>
      </div>

      <div className="px-4 md:px-8 -mt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Card header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">
              Slot Subscriptions
            </h2>
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
              {subscriptions.length} slot
              {subscriptions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {[
                    "Slot",
                    "Slots",
                    "Slot Price",
                    "Amount Paid",
                    "Last Payment",
                    "Next Due",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map((slot, index) => {
                  const cfg = getStatusConfig(slot);
                  const needsPay = cfg.isDue || cfg.isOverdue;
                  return (
                    <tr
                      key={slot.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Slot */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <Sprout className="w-3.5 h-3.5 text-green-700" />
                          </div>
                          <span className="font-semibold text-gray-900 text-xs">
                            Slot #
                            {subscriptions.length -
                              ((page - 1) * PAGE_SIZE + index)}
                          </span>
                        </div>
                      </td>
                      {/* Slots count */}
                      <td className="px-5 py-4 text-gray-700 font-medium">
                        {slot.slots}
                      </td>
                      {/* Slot price */}
                      <td className="px-5 py-4 text-gray-600">
                        ₦{formatNumber(slot.slotprice)}
                      </td>
                      {/* Amount */}
                      <td className="px-5 py-4 font-bold text-gray-900">
                        ₦{formatNumber(slot.amount)}
                      </td>
                      {/* Last payment */}
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(slot.last_payment_date)}
                      </td>
                      {/* Next due */}
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(slot.next_payment_date)}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.pill}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.isOverdue
                            ? "Overdue"
                            : cfg.isDue
                              ? "Due"
                              : slot.status === "active"
                                ? "Active"
                                : slot.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {needsPay && (
                            <Button
                              size="sm"
                              onClick={() => onPay(slot)}
                              disabled={isProcessing && payingId === slot.id}
                              className="h-8 text-xs px-3 bg-green-700 hover:bg-green-800 text-white rounded-lg"
                            >
                              {isProcessing && payingId === slot.id ? (
                                <span className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Paying…
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <CreditCard className="w-3 h-3" />
                                  Pay ₦1,000
                                </span>
                              )}
                            </Button>
                          )}
                          <button
                            onClick={() => onView(slot)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile card list ── */}
          <div className="md:hidden divide-y divide-gray-100">
            {paged.map((slot, index) => {
              const cfg = getStatusConfig(slot);
              const needsPay = cfg.isDue || cfg.isOverdue;
              return (
                <div key={slot.id} className="px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <Sprout className="w-3.5 h-3.5 text-green-700" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          Slot #
                          {subscriptions.length -
                            ((page - 1) * PAGE_SIZE + index)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {slot.slots} slot{Number(slot.slots) !== 1 ? "s" : ""}{" "}
                          · ₦{formatNumber(slot.slotprice)} each
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.isOverdue
                        ? "Overdue"
                        : cfg.isDue
                          ? "Due"
                          : slot.status === "active"
                            ? "Active"
                            : slot.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400">Amount Paid</p>
                      <p className="font-bold text-gray-900">
                        ₦{formatNumber(slot.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Next Due</p>
                      <p className="font-semibold text-gray-700">
                        {formatDate(slot.next_payment_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {needsPay && (
                      <Button
                        size="sm"
                        onClick={() => onPay(slot)}
                        disabled={isProcessing && payingId === slot.id}
                        className="flex-1 h-8 text-xs bg-green-700 hover:bg-green-800 text-white rounded-lg"
                      >
                        {isProcessing && payingId === slot.id ? (
                          <span className="flex items-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Paying…
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3" />
                            Pay ₦1,000
                          </span>
                        )}
                      </Button>
                    )}
                    <button
                      onClick={() => onView(slot)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, subscriptions.length)} of{" "}
                {subscriptions.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                        p === page
                          ? "bg-green-700 text-white"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

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
    </motion.div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
const MonthlyPayment = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] =
    useState<Subscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Derive selectedSlot from subscriptions so it always has fresh data
  const selectedSlot = selectedSlotId
    ? (subscriptions.find((s) => s.id === selectedSlotId) ?? null)
    : null;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("slot_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_payment_date", { ascending: false });

    if (error) console.error(error);

    const all = data || [];
    setSubscriptions(all);

    // Use most recent active slot, fallback to most recent — same as original
    const active = all.find((s) => s.status === "active") || all[0] || null;
    setActiveSubscription(active);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      await fetchSubscription();
    };
    load();
  }, []);

  // ── Load Paystack script ───────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("paystack-script")) return;
    const script = document.createElement("script");
    script.id = "paystack-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ── Payment handler ────────────────────────────────────────────────────────
  const handleMonthlyPayment = async (slot?: Subscription) => {
    // Priority: passed slot → selectedSlot → activeSubscription (same fallback as original)
    const targetSlot = slot ?? selectedSlot ?? activeSubscription;
    if (!targetSlot) return;

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
    setPayingId(targetSlot.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    try {
      const config = {
        key: import.meta.env.VITE_PAYSTACK_KEYS,
        email: profile?.email || user.email,
        amount: 1000 * 100,
        currency: "NGN",
        ref: `SLOT_${targetSlot.id}_${Date.now()}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Subscription ID",
              variable_name: "subscription_id",
              value: targetSlot.id,
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id,
            },
          ],
        },
        callback: function (response: any) {
          if (response.status === "success") {
            toast({
              title: "Payment successful",
              description: "Your subscription has been renewed for 30 days.",
            });
            setTimeout(() => {
              fetchSubscription();
              setIsProcessing(false);
              setPayingId(null);
            }, 3000);
          } else {
            toast({
              title: "Payment failed",
              description: "Please try again.",
              variant: "destructive",
            });
            setIsProcessing(false);
            setPayingId(null);
          }
        },
        onClose: function () {
          toast({
            title: "Payment cancelled",
            description: "You closed the payment window.",
          });
          setIsProcessing(false);
          setPayingId(null);
        },
      };

      const handler = (window as any).PaystackPop.setup(config);
      handler.openIframe();
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setPayingId(null);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-800/10 flex items-center justify-center animate-pulse">
            <Sprout className="w-6 h-6 text-green-800" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Loading subscriptions...
          </p>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (subscriptions.length === 0) {
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
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      {selectedSlot ? (
        <SlotDetailView
          key="detail"
          slot={selectedSlot}
          onBack={() => setSelectedSlotId(null)}
          onPay={() => handleMonthlyPayment(selectedSlot)}
          isProcessing={isProcessing}
        />
      ) : (
        <SlotTableView
          key="table"
          subscriptions={subscriptions}
          onView={(slot) => setSelectedSlotId(slot.id)}
          onPay={(slot) => handleMonthlyPayment(slot)}
          isProcessing={isProcessing}
          payingId={payingId}
        />
      )}
    </AnimatePresence>
  );
};

export default MonthlyPayment;

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, X } from "lucide-react";

const PhoneModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    // update auth table phone column
    const { error: updateError } = await supabase.auth.updateUser({
      phone,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // also update profiles table
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ phone }).eq("id", user.id);
    }

    setLoading(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto">
              {/* Header */}
              <div className="bg-green-800 px-6 pt-6 pb-8 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Add Phone Number
                </h3>
                <p className="text-green-200 text-sm">
                  Complete your profile by adding your phone number.
                </p>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2348012345678"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1.5">{error}</p>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-green-800 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-2xl py-3 text-sm transition-colors"
                >
                  {loading ? "Saving..." : "Save Phone Number"}
                </button>

                <button
                  onClick={onClose}
                  className="w-full mt-2 text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PhoneModal;

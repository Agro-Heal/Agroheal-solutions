import { motion } from "framer-motion";
import { MailCheck, Leaf, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthSidebar from "@/components/webComponents/authSidebar";

const VerifyAccount = () => {
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.5,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  });

  return (
    <div className="min-h-screen min-h-dvh flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#f8f7f4] relative min-h-0 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
        >
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-green-800/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#d17547]/10 blur-3xl" />
        </div>

        <motion.div
          {...fadeUp(0)}
          className="lg:hidden flex items-center gap-2 mb-10 relative z-10"
        >
          <div className="w-9 h-9 rounded-xl bg-green-800 flex items-center justify-center shadow-sm">
            <Leaf className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-green-900 font-semibold text-lg tracking-tight">
            Agroheal
          </span>
        </motion.div>

        <div className="w-full max-w-[400px] relative z-10">
            <motion.div {...fadeUp(0.06)} className="mb-6 sm:mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-800 mb-2">
                Almost there
              </p>
              <h1
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Verify your account
              </h1>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-prose">
                New users should check their email (or spam) to verify their
                accounts before login.
              </p>
            </motion.div>

            <motion.div
              {...fadeUp(0.12)}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm ring-1 ring-black/[0.03]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <MailCheck className="w-6 h-6 text-green-800" />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  Check your email
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-11 border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 group"
                >
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 text-green-800 group-hover:scale-105 transition-transform" />
                    Open Email
                  </a>
                </Button>
                <Button
                  asChild
                  className="w-full h-11 bg-green-800 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm"
                >
                  <Link to="/login">
                    Go to Login
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.2)} className="text-center mt-8">
              <Link
                to="/"
                className="text-xs sm:text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back to home
              </Link>
            </motion.div>
        </div>
      </div>

      <AuthSidebar />
    </div>
  );
};

export default VerifyAccount;

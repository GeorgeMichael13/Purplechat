"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Firebase puts the reset token in a query param called 'oobCode'
  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NEURAL VERIFICATION ON LOAD ---
  useEffect(() => {
    const checkToken = async () => {
      if (!oobCode) {
        setError("Invalid or missing neural reset token.");
        return;
      }
      try {
        // Verify the code with Firebase immediately
        await verifyPasswordResetCode(auth, oobCode);
      } catch (err: any) {
        setError("This reset link has expired or has already been used.");
      }
    };
    checkToken();
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Neural sync failed: Passwords do not match.");
      return;
    }

    if (!oobCode) {
      setError("Reset token expired or invalid.");
      return;
    }

    setIsLoading(true);

    try {
      // --- REAL FIREBASE RESET CONFIRMATION ---
      await confirmPasswordReset(auth, oobCode, password);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Firebase Reset Error:", err.code);
      if (err.code === "auth/expired-action-code") {
        setError("The reset link has expired.");
      } else if (err.code === "auth/invalid-action-code") {
        setError("The reset link is invalid or has already been used.");
      } else if (err.code === "auth/weak-password") {
        setError("Neural key is too weak. Use at least 6 characters.");
      } else {
        setError("Neural update failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Password Re-initialized
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your neural key has been updated successfully. Your session is now
            ready for re-entry.
          </p>
          <Link
            href="/auth"
            className="block w-full bg-violet-600 py-4 rounded-2xl text-white font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20 active:scale-95"
          >
            Return to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden p-4">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
            Define New Key
          </h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            Complete the synchronization to restore your access.
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleReset} className="space-y-5">
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 text-white outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              disabled={isLoading || !!error}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Update Neural Key <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// Exported component with the required Suspense wrapper for Netlify/Next.js
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-violet-500 font-bold tracking-widest uppercase text-xs">
          Initializing Neural Link...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

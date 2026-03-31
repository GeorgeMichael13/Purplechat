"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Send, AlertCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Reset Error:", err.code);
      if (err.code === "auth/user-not-found") {
        setError("This Neural Email is not registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Transmission failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] z-10 shadow-2xl"
      >
        {!submitted ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
              Reset Neural Key
            </h2>
            <p className="text-slate-400 text-sm text-center mb-8">
              Enter your email and we'll send a synchronization link.
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

            <form onSubmit={handleReset} className="space-y-6">
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="Neural Email"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-500 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Reset Link <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-green-500/10">
              <Mail size={40} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Transmission Sent
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Check your inbox for reset instructions. Check spam logs if it
              doesn't arrive.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-violet-400 hover:text-violet-300 font-bold uppercase tracking-widest transition-colors"
            >
              Resend Link
            </button>
          </motion.div>
        )}

        <Link
          href="/auth"
          className="mt-8 flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Entry
        </Link>
      </motion.div>
    </div>
  );
}

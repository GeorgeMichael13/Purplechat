"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Store Actions
  const { login, signup } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate "Neural Synchronization" delay
    setTimeout(() => {
      if (isLogin) {
        const success = login(email);
        if (success) {
          router.push("/");
        } else {
          alert("Neural ID not found. Please sign up to initialize.");
          setIsLoading(false);
        }
      } else {
        signup({
          name: fullName,
          email: email,
          occupation: "Neural Explorer",
        });
        router.push("/");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden p-4">
      {/* Background Aesthetic Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/20 mb-4">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">
            PURPLE<span className="text-violet-500">CHAT</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 italic uppercase tracking-widest font-medium">
            Neural Accuracy Awaits
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
          {/* LOGIN/SIGNUP TOGGLE */}
          <div className="flex gap-4 mb-8 bg-black/20 p-1.5 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                isLogin
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                !isLogin
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5"
                >
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-violet-500 outline-none transition-all placeholder:text-slate-600"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-violet-500 outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-violet-500 outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>

            <button
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Initialize Session" : "Create Neural ID"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
          <ShieldCheck size={14} />
          <span className="text-xs uppercase tracking-[0.2em] font-bold">
            Neural Encryption Active
          </span>
        </div>
      </motion.div>
    </div>
  );
}

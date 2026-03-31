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
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import Link from "next/link";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const { setUser } = useChatStore();

  // --- GOOGLE LOGIN HANDLER ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      setUser({
        id: user.uid,
        name: user.displayName || "Neural Explorer",
        email: user.email || "",
        occupation: "Neural Explorer",
      });

      router.push("/");
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      // Added detailed error message check
      if (err.code === "auth/popup-closed-by-user") {
        setError("Bypass cancelled by user.");
      } else {
        setError(err.message || "Google synchronization failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        setUser({
          id: user.uid,
          name: user.displayName || "Neural Explorer",
          email: user.email || "",
          occupation: "Neural Explorer",
        });

        router.push("/");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        await updateProfile(user, { displayName: fullName });

        setUser({
          id: user.uid,
          name: fullName,
          email: email,
          occupation: "Neural Explorer",
        });

        router.push("/");
      }
    } catch (err: any) {
      // FIX: Log the full error to avoid "undefined" and extract code safely
      console.error("Neural Sync Error:", err);
      const errorCode = err?.code || "unknown";

      if (errorCode === "auth/user-not-found")
        setError("Neural ID not recognized.");
      else if (errorCode === "auth/wrong-password")
        setError("Invalid access key.");
      else if (errorCode === "auth/email-already-in-use")
        setError("ID already registered. Try logging in.");
      else if (errorCode === "auth/invalid-credential")
        setError("Neural check failed. Verify credentials.");
      else if (errorCode === "auth/weak-password")
        setError("Key too weak. Use at least 6 characters.");
      else setError(err.message || "Neural connection failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden p-4 font-sans">
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
          <p className="text-slate-400 text-sm mt-2 italic uppercase tracking-widest font-medium text-center px-4">
            Neural Accuracy Awaits
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
          <div className="flex gap-4 mb-8 bg-black/20 p-1.5 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
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
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
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

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

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
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 text-white focus:border-violet-500 outline-none transition-all placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-400 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-500 hover:text-violet-400 font-medium transition-colors"
                >
                  Forgot Neural Key?
                </Link>
              </div>
            )}

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

          {/* --- GOOGLE SOCIAL LOGIN SECTION --- */}
          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
                <span className="bg-[#0b1224] px-3 text-slate-500">
                  Neural Bypass
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="w-5 h-5"
                alt="Google"
              />
              <span className="text-sm tracking-tight">Sync with Google</span>
            </button>
          </div>
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

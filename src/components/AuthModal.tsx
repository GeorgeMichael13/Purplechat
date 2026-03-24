"use client";
import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { motion } from "framer-motion";

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    occupation: "",
  });
  const { signup, login, currentUser } = useChatStore();

  if (currentUser) return null; // Hide if logged in

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const success = login(formData.email);
      if (!success) alert("User not found!");
    } else {
      signup(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-3xl font-black mb-2 dark:text-white">
          {isLogin ? "Welcome Back" : "Join PurpleChat"}
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          Please enter your details to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                required
                placeholder="Full Name"
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 outline-none border border-transparent focus:border-violet-500"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <input
                required
                placeholder="Occupation"
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 outline-none border border-transparent focus:border-violet-500"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
              />
            </>
          )}
          <input
            required
            type="email"
            placeholder="Email Address"
            className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 outline-none border border-transparent focus:border-violet-500"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <button
            type="submit"
            className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg hover:bg-violet-700 transition-all"
          >
            {isLogin ? "Login" : "Start Chatting"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-sm text-slate-500 hover:text-violet-500"
        >
          {isLogin
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </motion.div>
    </div>
  );
}

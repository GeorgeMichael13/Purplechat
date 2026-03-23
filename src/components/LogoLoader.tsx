"use client";

import { motion } from "framer-motion";

export default function LogoLoader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[999] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center"
    >
      <div className="relative">
        {/* Outer Glow Effect */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full"
        />

        {/* The Neural Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 bg-violet-600 rounded-3xl flex items-center justify-center shadow-2xl relative z-10"
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M30 20H65C73.2843 20 80 26.7157 80 35V55C80 63.2843 73.2843 70 65 70H40L20 85V30C20 24.4772 24.4772 20 30 20Z"
              fill="white"
            />
            {/* Animated Nodes using Framer Motion instead of CSS classes to avoid warnings */}
            <motion.circle
              cx="45" cy="40" r="5" fill="#c4b5fd"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.circle
              cx="65" cy="40" r="5" fill="#c4b5fd"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            />
            <motion.circle
              cx="55" cy="55" r="5" fill="#c4b5fd"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, delay: 1 }}
            />
            <line x1="45" y1="40" x2="65" y2="40" stroke="#c4b5fd" strokeWidth="2" opacity="0.4" />
            <line x1="45" y1="40" x2="55" y2="55" stroke="#c4b5fd" strokeWidth="2" opacity="0.4" />
            <line x1="65" y1="40" x2="55" y2="55" stroke="#c4b5fd" strokeWidth="2" opacity="0.4" />
          </svg>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex flex-col items-center"
      >
        <h2 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase">
          PURPLE<span className="text-violet-600">CHAT</span>
        </h2>
        <div className="flex gap-1 mt-2">
          {[0, 0.2, 0.4].map((delay) => (
            <motion.div
              key={delay}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay }}
              className="w-1.5 h-1.5 bg-violet-600 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
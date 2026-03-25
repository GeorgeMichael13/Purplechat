"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Type,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [lowBlur, setLowBlur] = useState(false);

  // Sync with your existing localStorage logic
  useEffect(() => {
    const audioStatus = localStorage.getItem("purple-audio-output") === "true";
    setAudioEnabled(audioStatus);
  }, []);

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    localStorage.setItem("purple-audio-output", String(newState));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#020617]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-4 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="dark:text-white" />
        </button>
        <h1 className="text-xl font-bold dark:text-white">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* --- AUDIO SECTION --- */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Voice & Audio
          </h3>
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600">
                <Volume2 size={20} />
              </div>
              <div>
                <p className="font-medium dark:text-white">AI Voice Output</p>
                <p className="text-xs text-slate-500">Read responses aloud</p>
              </div>
            </div>
            <button
              onClick={toggleAudio}
              className={`w-12 h-6 rounded-full transition-colors relative ${audioEnabled ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <motion.div
                animate={{ x: audioEnabled ? 26 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </section>

        {/* --- PERFORMANCE SECTION --- */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Performance
          </h3>
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                <Zap size={20} />
              </div>
              <div>
                <p className="font-medium dark:text-white">
                  Eco Mode (Low Blur)
                </p>
                <p className="text-xs text-slate-500">Save battery on mobile</p>
              </div>
            </div>
            <button
              onClick={() => setLowBlur(!lowBlur)}
              className={`w-12 h-6 rounded-full transition-colors relative ${lowBlur ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <motion.div
                animate={{ x: lowBlur ? 26 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </section>

        {/* --- DANGER ZONE --- */}
        <section>
          <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 px-2">
            Data Management
          </h3>
          <button className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 size={20} />
            <span className="font-medium">Clear All Chat History</span>
          </button>
        </section>

        <div className="text-center pt-4">
          <p className="text-[10px] text-slate-500">
            Purple AI v2.4.0 (2026 Edition)
          </p>
        </div>
      </div>
    </div>
  );
}

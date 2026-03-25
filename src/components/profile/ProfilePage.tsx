"use client";

import { useChatStore } from "@/store/chatStore";
import {
  ChevronLeft,
  LogOut,
  Save,
  X,
  Fingerprint,
  ShieldCheck,
  Activity,
  Camera, // New icon
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo, useRef } from "react"; // Added useRef
import { toast } from "sonner";
import UserDashboard from "@/components/profile/UsageDashboard";

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { currentUser, updateProfile, updateAvatar, logout } = useChatStore();

  const [name, setName] = useState(currentUser?.name || "");
  const [occupation, setOccupation] = useState(currentUser?.occupation || "");
  const [isSaving, setIsSaving] = useState(false);

  // Create a reference for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Neural ID Generation
  const neuralId = useMemo(() => {
    const prefix = currentUser?.name?.slice(0, 3).toUpperCase() || "USR";
    const suffix = currentUser?.joinedAt
      ? currentUser.joinedAt.toString().slice(-4)
      : "8821";
    return `PRP-${prefix}-${suffix}`;
  }, [currentUser, name]);

  // --- NEW: HANDLE IMAGE UPLOAD ---
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic check for file size (e.g., max 2MB for local storage)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Please select an image under 2MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateAvatar(base64String); // Save to Zustand store
        toast.success("Identity Visual Updated", {
          description: "Neural avatar synchronized.",
          style: { background: "#7c3aed", color: "#fff" },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    updateProfile(name, occupation);
    setIsSaving(false);

    toast.success("Identity Synchronized", {
      description: "Neural profile updated successfully.",
      style: { background: "#7c3aed", color: "#fff" },
    });
  };

  return (
    <div className="h-full w-full bg-[#f8fafc] dark:bg-[#020617] overflow-y-auto relative custom-scrollbar">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <div className="flex justify-between items-end mb-12">
          <motion.button
            whileHover={{ x: -4 }}
            onClick={onBack}
            className="group flex items-center gap-3 px-2 py-2 text-slate-500 hover:text-violet-600 transition-all"
          >
            <div className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-sm group-hover:shadow-violet-500/20 group-hover:ring-1 ring-violet-500/50">
              <ChevronLeft size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-[0.3em]">
              Return to Console
            </span>
          </motion.button>

          <div className="text-right">
            <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-violet-500 mb-1">
              System Interface
            </h1>
            <p className="text-2xl font-black dark:text-white tracking-tighter">
              Profile Configuration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-white dark:border-white/5"
            >
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  <span className="font-black text-[10px] uppercase tracking-widest">
                    Neural Link: Active
                  </span>
                </div>
                <div className="font-mono text-[10px] font-bold tracking-[0.2em] opacity-80">
                  {neuralId}
                </div>
              </div>

              <div className="flex flex-col items-center pt-12 pb-10 px-8 relative">
                <div
                  className="relative group cursor-pointer"
                  onClick={handleImageClick}
                >
                  <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                  <div className="relative w-44 h-44 rounded-[3.5rem] overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-2xl bg-slate-950 flex items-center justify-center">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-6xl font-black">
                        {name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}

                    {/* Hover Overlay for Camera */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Camera className="text-white" size={32} />
                    </div>
                  </div>

                  <div className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 text-violet-500">
                    <ShieldCheck size={20} />
                  </div>
                </div>

                <h2 className="mt-8 text-3xl font-black text-slate-900 dark:text-white tracking-tighter text-center">
                  {name || "User"}
                </h2>
                <div className="mt-2 px-4 py-1 bg-slate-100 dark:bg-white/5 rounded-full">
                  <p className="text-violet-500 font-bold text-xs uppercase tracking-widest">
                    {occupation || "Analyst"}
                  </p>
                </div>

                <div className="w-full mt-10 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Sync Rate
                    </p>
                    <p className="text-xl font-black dark:text-white font-mono text-emerald-500">
                      99.2%
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Security
                    </p>
                    <p className="text-xl font-black dark:text-white font-mono text-violet-500">
                      Tier 4
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border-2 border-white dark:border-white/5 p-8 md:p-10 h-full"
            >
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 ml-2">
                      <Fingerprint size={14} /> Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-6 py-5 bg-white dark:bg-slate-950/50 border-2 border-slate-100 dark:border-white/5 rounded-3xl focus:outline-none focus:border-violet-500 transition-all text-lg font-bold shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 ml-2">
                      <Activity size={14} /> Occupation / Directive
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-6 py-5 bg-white dark:bg-slate-950/50 border-2 border-slate-100 dark:border-white/5 rounded-3xl focus:outline-none focus:border-violet-500 transition-all text-lg font-bold shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <button
                    onClick={onBack}
                    className="flex-1 py-5 px-8 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-[1.5] py-5 px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-violet-600/30"
                  >
                    {isSaving ? "Synchronizing..." : "Apply Neural Update"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-12 mb-6 flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
          <h3 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.4em]">
            Neural Diagnostics
          </h3>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
        </div>

        <UserDashboard />

        <div className="mt-16 flex justify-center">
          <button
            onClick={logout}
            className="group flex items-center gap-3 text-slate-400 hover:text-red-500 transition-all px-8 py-4 rounded-full hover:bg-red-500/5"
          >
            <div className="p-2 rounded-full border border-slate-300 dark:border-white/10 group-hover:border-red-500/30">
              <LogOut size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Terminate Current Session
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

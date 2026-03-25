"use client";

import dynamic from "next/dynamic";
import { useChatStore } from "@/store/chatStore";
import { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";

// --- STATIC IMPORTS ---
import LogoLoader from "@/components/LogoLoader";
import AuthPage from "@/components/auth/AuthPage";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ProfilePage from "@/components/profile/ProfilePage";
import CreatorConsole from "@/components/admin/AdminDashboard";
import MobileNav from "@/components/MobileNav";
import SettingsPage from "@/components/SettingsPage"; // Imported the new feature

const ChatWindow = dynamic(() => import("@/components/chat/ChatWindow"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-violet-600 font-bold animate-pulse uppercase tracking-widest text-xs">
        Waking Neural Network...
      </div>
    </div>
  ),
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [view, setView] = useState<"chat" | "profile" | "admin" | "settings">(
    "chat",
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const {
    currentUser,
    _hasHydrated,
    activeConversationId,
    createNewConversation,
    checkAndResetQuota,
  } = useChatStore();

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowLoader(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (_hasHydrated && currentUser) {
      checkAndResetQuota();
    }
  }, [_hasHydrated, currentUser, checkAndResetQuota]);

  useEffect(() => {
    if (_hasHydrated && currentUser && !activeConversationId) {
      createNewConversation();
    }
  }, [_hasHydrated, currentUser, activeConversationId, createNewConversation]);

  const triggerPurpleVoice = useMemo(
    () => (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      if (localStorage.getItem("purple-audio-output") !== "true") return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  if (!mounted || !_hasHydrated)
    return <div className="h-screen w-full bg-slate-950" />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950">
      <AnimatePresence mode="wait">
        {showLoader ? (
          <motion.div
            key="global-loader"
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <LogoLoader />
          </motion.div>
        ) : (
          <motion.div
            key={currentUser ? "main-app" : "auth-screen"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {!currentUser ? (
              <AuthPage />
            ) : (
              <div className="flex h-full w-full main-layout-wrapper">
                {/* 1. DESKTOP SIDEBAR */}
                <div className="hidden lg:block h-full">
                  <ChatSidebar onNavigate={(target: any) => setView(target)} />
                </div>

                {/* 2. MOBILE NAVIGATION */}
                <MobileNav
                  isOpen={isMobileNavOpen}
                  onClose={() => setIsMobileNavOpen(false)}
                  userEmail={currentUser?.email || "User"}
                  currentView={view}
                  onNavigate={(target: any) => setView(target)}
                />

                <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-white dark:bg-[#020617]">
                  {/* 3. MOBILE HEADER */}
                  <header className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
                    <button
                      onClick={() => setIsMobileNavOpen(true)}
                      className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Menu
                        size={24}
                        className="text-slate-600 dark:text-slate-300"
                      />
                    </button>
                    <span className="font-bold text-violet-600 tracking-tight">
                      Purple AI
                    </span>
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-bold text-violet-600">
                      {currentUser?.email?.charAt(0).toUpperCase()}
                    </div>
                  </header>

                  <AnimatePresence mode="wait" initial={false}>
                    {view === "chat" && (
                      <motion.div
                        key="view-chat"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="h-full w-full"
                      >
                        <ChatWindow onNewMessage={triggerPurpleVoice} />
                      </motion.div>
                    )}

                    {view === "profile" && (
                      <motion.div
                        key="view-profile"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="h-full w-full overflow-y-auto"
                      >
                        <ProfilePage onBack={() => setView("chat")} />
                      </motion.div>
                    )}

                    {view === "admin" && (
                      <motion.div
                        key="view-admin"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="h-full w-full overflow-y-auto bg-[#0a0a0c]"
                      >
                        <CreatorConsole />
                      </motion.div>
                    )}

                    {/* IMPROVED: Settings View with the real component */}
                    {view === "settings" && (
                      <motion.div
                        key="view-settings"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="h-full w-full overflow-y-auto"
                      >
                        <SettingsPage onBack={() => setView("chat")} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useChatStore } from "@/store/chatStore";
import { useEffect, useState, useMemo } from "react"; // Added useMemo
import { AnimatePresence, motion } from "framer-motion";

// --- STATIC IMPORTS ---
import LogoLoader from "@/components/LogoLoader";
import AuthPage from "@/components/auth/AuthPage";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ProfilePage from "@/components/profile/ProfilePage";
import CreatorConsole from "@/components/admin/AdminDashboard";

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
  const [view, setView] = useState<"chat" | "profile" | "admin">("chat");

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

  // STABILITY FIX: Use useMemo for the voice trigger to prevent unnecessary re-renders
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
            key="global-loader" // Fixed key for loader
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <LogoLoader />
          </motion.div>
        ) : (
          <motion.div
            key={currentUser ? "main-app" : "auth-screen"} // Simplified keys
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {!currentUser ? (
              <AuthPage />
            ) : (
              <div className="flex h-full w-full">
                <ChatSidebar onNavigate={(target: any) => setView(target)} />

                <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-white dark:bg-[#020617]">
                  {/* Internal AnimatePresence for view switching */}
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

"use client";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import LogoLoader from "@/components/LogoLoader";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    setMounted(true);
    // 2.5s is a good premium feel for the PurpleChat animation
    const timer = setTimeout(() => setShowLoader(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) return <div className="h-screen w-full bg-slate-950" />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {showLoader && <LogoLoader key="purplechat-loader" />}
      </AnimatePresence>

      <ChatSidebar />

      <main className="flex-1 flex flex-col min-w-0 relative">
        <ChatWindow />
      </main>
    </div>
  );
}
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

    // Warm up the speech engine
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged,
    );

    const timer = setTimeout(() => setShowLoader(false), 2500);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged,
      );
    };
  }, []);

  // --- THE PURPLE VOICE TRIGGER ---
  const triggerPurpleVoice = (text: string) => {
    // Only speak if user has "Audio On" saved in localStorage
    const isAudioEnabled =
      localStorage.getItem("purple-audio-output") === "true";
    if (!isAudioEnabled) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(
      (v) =>
        v.name.includes("Google US English") ||
        v.name.includes("Samantha") ||
        v.name.includes("Microsoft Aria"),
    );

    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.pitch = 1.1; // AI-friendly tone
    utterance.rate = 1.05; // Efficient speed

    window.speechSynthesis.speak(utterance);
  };

  if (!mounted) return <div className="h-screen w-full bg-slate-950" />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {showLoader && <LogoLoader key="purplechat-loader" />}
      </AnimatePresence>

      <ChatSidebar />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Pass the voice function to ChatWindow */}
        <ChatWindow onNewMessage={triggerPurpleVoice} />
      </main>
    </div>
  );
}

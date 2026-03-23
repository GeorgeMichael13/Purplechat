"use client";

import { useChatStore } from "@/store/chatStore";
import { User, Trash2, Sun, Moon, Copy, Pencil, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "next-themes";
import ChatInput from "./ChatInput";

const LogoIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M30 20H65C73.2843 20 80 26.7157 80 35V55C80 63.2843 73.2843 70 65 70H40L20 85V30C20 24.4772 24.4772 20 30 20Z" fill="currentColor"/>
    <circle cx="45" cy="40" r="5" fill="#c4b5fd" opacity="0.8" />
    <circle cx="65" cy="40" r="5" fill="#c4b5fd" opacity="0.8" />
    <circle cx="55" cy="55" r="5" fill="#c4b5fd" opacity="0.8" />
  </svg>
);

export default function ChatWindow() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { activeConversationId, conversations, addMessage, clearMessages, createNewConversation } = useChatStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [activeConv?.messages, isTyping]);

  const handleSend = async (content?: string) => {
    const text = content || input;
    if (!text.trim() || isTyping) return;
    
    let currentId = activeConversationId || createNewConversation();
    setInput("");
    addMessage(currentId, "user", text);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...(activeConv?.messages || []), { role: "user", content: text }] 
        }),
      });

      if (!res.ok) {
        // Human-friendly error for server/limit issues
        throw new Error("I'm having a little trouble connecting. Could you try sending that again?");
      }
      
      const data = await res.json();
      addMessage(currentId, "assistant", data.text || "I'm not sure how to respond to that. Could you rephrase?");
    } catch (err: any) {
      // Friendly message for network failure/offline
      const userFriendlyMessage = err.message.includes("fetch") 
        ? "Connection lost. Please check your internet and try again." 
        : err.message;

      addMessage(currentId, "assistant", userFriendlyMessage);
      console.error("System Log:", err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-slate-950 relative overflow-hidden transition-colors">
      <header className="mx-4 mt-3 p-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-md">
            <LogoIcon size={16} />
          </div>
          <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
            {activeConv?.title || "PurpleChat"}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="p-2 rounded-lg text-slate-400 hover:bg-violet-500/10 transition-colors">
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => confirm("Clear chat?") && clearMessages(activeConversationId!)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar relative z-10">
        <AnimatePresence mode="popLayout">
          {activeConv?.messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-start gap-3 w-full group",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                msg.role === "assistant" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                {msg.role === "assistant" ? <LogoIcon size={14} /> : <User size={14} />}
              </div>
              
              <div className={cn(
                "flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%]",
                msg.role === "user" ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-2.5 rounded-[1.2rem] text-[13.5px] md:text-[14px] leading-relaxed shadow-sm w-fit transition-all",
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-tr-none ml-auto"
                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                )}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      script: () => null, 
                      p: ({children}) => <span className="block">{children}</span>
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                <div className={cn(
                  "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedId(msg.id); setTimeout(()=>setCopiedId(null), 2000); }} 
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    {copiedId === msg.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  {msg.role === "user" && (
                    <button onClick={() => setInput(msg.content)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center animate-pulse"><LogoIcon size={14} /></div>
            <div className="bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-xl rounded-tl-none border border-slate-200 dark:border-slate-800 w-fit">
              <div className="flex gap-1">
                {[0, 0.1, 0.2].map((d) => (
                  <motion.span key={d} animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: d }} className="w-1 h-1 bg-violet-500 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatInput value={input} onChange={setInput} onSubmit={handleSend} disabled={isTyping} />
    </div>
  );
}
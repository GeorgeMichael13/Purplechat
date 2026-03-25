"use client";

import { useChatStore, ChatMode } from "@/store/chatStore";
import {
  User,
  Trash2,
  Sun,
  Moon,
  Code2,
  GraduationCap,
  PenTool,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  Terminal,
  FileText,
  BookOpen,
  Layout,
  Volume2,
  VolumeX,
  Radio,
  Edit2,
  X,
  Check,
  Star,
  Download,
  FileJson,
  LogOut,
  Copy,
  MoreVertical,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import ChatInput from "./ChatInput";

const MODES = [
  {
    id: "general" as ChatMode,
    label: "General",
    icon: MessageSquare,
    color: "text-violet-500",
    bg: "bg-violet-600",
  },
  {
    id: "developer" as ChatMode,
    label: "Developer",
    icon: Code2,
    color: "text-blue-500",
    bg: "bg-blue-600",
  },
  {
    id: "student" as ChatMode,
    label: "Student",
    icon: GraduationCap,
    color: "text-emerald-500",
    bg: "bg-emerald-600",
  },
  {
    id: "writer" as ChatMode,
    label: "Writer",
    icon: PenTool,
    color: "text-orange-500",
    bg: "bg-orange-600",
  },
  {
    id: "productivity" as ChatMode,
    label: "Productivity",
    icon: CheckCircle2,
    color: "text-pink-500",
    bg: "bg-pink-600",
  },
];

const SUGGESTIONS = [
  {
    title: "Summarize PDF",
    desc: "Extract insights.",
    icon: <FileText size={20} />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Explain concepts",
    desc: "Simplify notes.",
    icon: <BookOpen size={20} />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Debug code",
    desc: "Find errors.",
    icon: <Terminal size={20} />,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    title: "Draft report",
    desc: "Raw data to doc.",
    icon: <Layout size={20} />,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

interface ChatWindowProps {
  onNewMessage?: (text: string) => void;
}

export default function ChatWindow({ onNewMessage }: ChatWindowProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const {
    activeConversationId,
    conversations,
    addMessage,
    clearMessages,
    createNewConversation,
    mode,
    setMode,
    usageCount,
    maxLimit,
    provider,
    togglePin,
    currentUser,
    logout,
  } = useChatStore();

  const promptsLeft = maxLimit - usageCount;
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const hasMessages = activeConv && activeConv.messages.length > 0;
  const currentMode = MODES.find((m) => m.id === mode) || MODES[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [activeConv?.messages, isTyping]);

  const handleDownloadPDF = () => {
    if (!hasMessages) return;
    window.print();
  };

  const handleExportJSON = () => {
    if (!hasMessages) return;
    const dataToExport = activeConv.messages;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export.json`;
    a.click();
    toast.success("Exported full chat");
  };

  const copyFormattedText = async (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) return;
    navigator.clipboard.writeText(el.innerText);
    toast.success("Copied text");
  };

  const speakText = useCallback(
    (text: string) => {
      if (!ttsEnabled || !synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(
        text.replace(/[#*`]/g, ""),
      );
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      synth.speak(utterance);
    },
    [ttsEnabled, synth],
  );

  const handleSend = async (content?: string, attachments?: any[]) => {
    const text = content || input;
    if (!text.trim() && (!attachments || attachments.length === 0)) return;
    if (promptsLeft <= 0) return;

    let currentId = activeConversationId || createNewConversation();
    setInput("");
    setIsTyping(true);

    await addMessage(currentId, "user", text, attachments);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          provider,
          userContext: currentUser,
          messages: [
            ...(activeConv?.messages || []),
            { role: "user", content: text, attachments },
          ],
        }),
      });

      const data = await res.json();
      await addMessage(currentId, "assistant", data.text);
      if (onNewMessage) onNewMessage(data.text);
      if (ttsEnabled) speakText(data.text);
    } catch (err: any) {
      toast.error("Error connecting to engine");
    } finally {
      setIsTyping(false);
    }
  };

  if (!mounted) return null;

  // ACTION LIST COMPONENT (Used in both Desktop and Mobile Menu)
  const ActionList = ({ isMobile = false }) => (
    <div
      className={cn(
        "flex items-center gap-1",
        isMobile && "flex-col items-stretch w-full",
      )}
    >
      <button
        onClick={handleExportJSON}
        className="p-2 rounded-lg text-slate-400 flex items-center gap-3"
      >
        <FileJson size={18} />{" "}
        {isMobile && <span className="text-sm font-medium">Export Chat</span>}
      </button>
      <button
        onClick={() => activeConversationId && togglePin(activeConversationId)}
        className={cn(
          "p-2 rounded-lg flex items-center gap-3",
          activeConv?.isPinned ? "text-amber-500" : "text-slate-400",
        )}
      >
        <Star size={18} fill={activeConv?.isPinned ? "currentColor" : "none"} />{" "}
        {isMobile && <span className="text-sm font-medium">Favorite Chat</span>}
      </button>
      <button
        onClick={handleDownloadPDF}
        className="p-2 rounded-lg text-slate-400 flex items-center gap-3"
      >
        <Download size={18} />{" "}
        {isMobile && <span className="text-sm font-medium">Save as PDF</span>}
      </button>
      <button
        onClick={() => setTtsEnabled(!ttsEnabled)}
        className={cn(
          "p-2 rounded-lg flex items-center gap-3",
          ttsEnabled ? "text-violet-500" : "text-slate-400",
        )}
      >
        {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}{" "}
        {isMobile && <span className="text-sm font-medium">Voice Audio</span>}
      </button>
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="p-2 rounded-lg text-slate-400 flex items-center gap-3"
      >
        {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}{" "}
        {isMobile && <span className="text-sm font-medium">Switch Theme</span>}
      </button>
      <button
        onClick={() => clearMessages(activeConversationId!)}
        className="p-2 text-slate-400 hover:text-red-500 flex items-center gap-3"
      >
        <Trash2 size={18} />{" "}
        {isMobile && (
          <span className="text-sm font-medium">Clear Messages</span>
        )}
      </button>
      {isMobile && (
        <button
          onClick={() => logout()}
          className="p-3 text-orange-500 flex items-center gap-3 border-t border-slate-100 dark:border-white/10 mt-2"
        >
          <LogOut size={18} />{" "}
          <span className="text-sm font-bold uppercase tracking-wider">
            Logout Session
          </span>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-[100svh] bg-white dark:bg-[#020617] relative overflow-hidden">
      {/* HEADER: Clean and Adaptive */}
      <header className="mx-2 sm:mx-4 mt-2 p-2 rounded-2xl border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between z-30 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-lg",
              currentMode.bg,
            )}
          >
            <currentMode.icon size={18} />
          </div>
          <button
            onClick={() => setShowModeMenu(!showModeMenu)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-bold dark:text-slate-100"
          >
            {currentMode.label}{" "}
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform",
                showModeMenu && "rotate-180",
              )}
            />
          </button>
          <AnimatePresence>
            {showModeMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50"
              >
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      setShowModeMenu(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                      mode === m.id
                        ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600"
                        : "hover:bg-slate-50 dark:hover:bg-white/5",
                    )}
                  >
                    <m.icon size={16} className={m.color} />{" "}
                    <span className="font-medium dark:text-slate-200">
                      {m.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center">
          <ActionList />
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-2" />
          <button
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-orange-500"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Universal Mobile Dropdown */}
        <div className="lg:hidden relative">
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            className="p-2 rounded-xl text-slate-500 bg-slate-50 dark:bg-white/5"
          >
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {showActionMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowActionMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                >
                  <ActionList isMobile />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* CHAT AREA */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar relative z-10"
      >
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="welcome"
              className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto text-center py-10"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-[2.5rem] text-white flex items-center justify-center mx-auto shadow-2xl mb-6",
                  currentMode.bg,
                )}
              >
                <currentMode.icon size={40} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                PurpleChat
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-10 italic">
                Neural Engine v3.0
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={s.title}
                    onClick={() => handleSend(s.title)}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/40 text-left hover:border-violet-500 transition-all flex items-center gap-4"
                  >
                    <div className={cn("p-2 rounded-xl", s.bgColor, s.color)}>
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm dark:text-slate-100">
                        {s.title}
                      </h3>
                      <p className="text-[10px] text-slate-500">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              {activeConv.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3 w-full",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1",
                      msg.role === "assistant"
                        ? currentMode.bg + " text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                    )}
                  >
                    {msg.role === "assistant" && isSpeaking ? (
                      <Radio size={16} className="animate-pulse" />
                    ) : msg.role === "assistant" ? (
                      <currentMode.icon size={16} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex flex-col gap-1 max-w-[88%]",
                      msg.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      id={`msg-${msg.id}`}
                      className={cn(
                        "px-5 py-3 rounded-2xl text-[14px] border shadow-sm prose prose-slate dark:prose-invert max-w-none",
                        msg.role === "user"
                          ? "bg-violet-600 border-violet-500 text-white rounded-tr-none prose-p:text-white"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none",
                      )}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-3 mt-1 opacity-60 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyFormattedText(msg.id)}
                        className="text-slate-400 hover:text-violet-500"
                      >
                        <Copy size={14} />
                      </button>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => speakText(msg.content)}
                          className="text-slate-400 hover:text-violet-500"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* FIXED INPUT FOR ALL PHONES */}
      <footer className="w-full bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-white/5 pb-[env(safe-area-inset-bottom,16px)]">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={isTyping}
        />
      </footer>
    </div>
  );
}

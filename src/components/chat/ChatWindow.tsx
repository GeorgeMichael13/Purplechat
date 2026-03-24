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
  Copy,
  Check,
  X,
  Star,
  Download,
  ClipboardCheck,
  FileJson, // Added for JSON export
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
    title: "Summarize uploaded PDF",
    desc: "Extract key insights instantly.",
    icon: <FileText size={20} />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Explain like I'm a student",
    desc: "Break down complex notes.",
    icon: <BookOpen size={20} />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Debug and optimize code",
    desc: "Find errors and improve logic.",
    icon: <Terminal size={20} />,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    title: "Draft a report from data",
    desc: "Transform raw info into a document.",
    icon: <Layout size={20} />,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export default function ChatWindow() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
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
    toast.info("Preparing PDF...");
    window.print();
  };

  // NEW FEATURE: Export pinned messages as JSON
  const handleExportJSON = () => {
    if (!hasMessages) return;
    const pinnedContent = activeConv.messages.filter((m) => m.isPinned);
    const dataToExport =
      pinnedContent.length > 0 ? pinnedContent : activeConv.messages;

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toLocaleDateString()}.json`;
    a.click();
    toast.success(
      pinnedContent.length > 0
        ? "Exported pinned messages"
        : "Exported full chat",
    );
  };

  const copyFormattedText = async (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) return;
    try {
      const type = "text/html";
      // Refined to target the rendered text specifically
      const blob = new Blob([el.innerHTML], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      await navigator.clipboard.write(data);
      toast.success("Copied with formatting!");
    } catch (err) {
      navigator.clipboard.writeText(el.innerText);
      toast.success("Copied as plain text");
    }
  };

  const speakText = useCallback(
    (text: string) => {
      if (!ttsEnabled || !synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(
        text.replace(/[#*`]/g, ""),
      );
      utterance.rate = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      synth.speak(utterance);
    },
    [ttsEnabled, synth],
  );

  const handleSend = async (content?: string, attachments?: any[]) => {
    const text = content || input;
    if (!text.trim() && (!attachments || attachments.length === 0)) return;

    if (promptsLeft <= 0) {
      toast.error("Limit reached", {
        description: "You have used all your prompts.",
      });
      return;
    }

    let currentId = activeConversationId || createNewConversation();
    setInput("");
    setIsTyping(true);

    let finalPrompt = text;
    if (attachments && attachments.length > 0) {
      const file = attachments[0];
      finalPrompt = `\n[ATTACHED FILE CONTENT]\nFile Name: ${file.name}\n---\n${file.extractedText || "File loaded successfully."}\n---\nUser Question: ${text}`;
    }

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
            { role: "user", content: finalPrompt },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Engine Error");

      await addMessage(currentId, "assistant", data.text);
      if (ttsEnabled) speakText(data.text);
    } catch (err: any) {
      toast.error("Purple Engine Error", { description: err.message });
    } finally {
      setIsTyping(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-[#020617] relative overflow-hidden transition-colors">
      <header className="mx-4 mt-3 p-2 rounded-2xl border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between z-30 shadow-sm print:hidden">
        <div className="flex items-center gap-2 px-1">
          <div
            className={cn(
              "w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-lg transition-all",
              currentMode.bg,
            )}
          >
            <currentMode.icon size={18} />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/5 px-2 py-1 rounded-lg transition-all text-sm font-bold dark:text-slate-100"
            >
              {currentMode.label} Engine{" "}
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
                      <m.icon size={16} className={m.color} />
                      <span className="font-medium dark:text-slate-200">
                        {m.label}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* NEW FEATURE: JSON Export Button */}
          <button
            onClick={handleExportJSON}
            className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
            title="Export Data"
          >
            <FileJson size={16} />
          </button>
          <button
            onClick={() =>
              activeConversationId && togglePin(activeConversationId)
            }
            className={cn(
              "p-2 rounded-lg transition-all",
              activeConv?.isPinned ? "text-amber-500" : "text-slate-400",
            )}
            title="Save Chat"
          >
            <Star
              size={16}
              fill={activeConv?.isPinned ? "currentColor" : "none"}
            />
          </button>
          <button
            onClick={handleDownloadPDF}
            className="p-2 rounded-lg text-slate-400 hover:text-violet-500"
            title="Download PDF"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={cn(
              "p-2 rounded-lg transition-all",
              ttsEnabled ? "text-violet-500" : "text-slate-400",
            )}
          >
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => clearMessages(activeConversationId!)}
            className="p-2 text-slate-400 hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar relative z-10"
      >
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="welcome"
              className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto text-center py-10 print:hidden"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-[2.5rem] text-white flex items-center justify-center mx-auto shadow-2xl mb-6",
                  currentMode.bg,
                )}
              >
                <currentMode.icon size={40} />
              </div>
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                PurpleChat
              </h1>
              {currentUser && (
                <p className="text-violet-600 font-bold mb-2">
                  Welcome back, {currentUser.name}
                </p>
              )}
              <p className="text-slate-500 dark:text-slate-400 text-xl font-medium mb-12 italic">
                "Engineered for Neural Accuracy"
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => handleSend(s.title)}
                    className="group p-5 rounded-3xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/40 hover:border-violet-500/40 text-left shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn("p-3 rounded-2xl", s.bgColor, s.color)}
                      >
                        {s.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-[16px] dark:text-slate-100">
                          {s.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              {activeConv.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-4 w-full group",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm print:hidden",
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
                      "flex flex-col gap-3 max-w-[85%] relative",
                      msg.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      id={`msg-${msg.id}`}
                      className={cn(
                        "px-6 py-4 rounded-3xl text-[14.5px] border shadow-sm transition-all prose prose-slate dark:prose-invert max-w-none",
                        msg.role === "user"
                          ? "bg-violet-600 border-violet-500 text-white rounded-tr-none prose-headings:text-white prose-p:text-white"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none",
                      )}
                    >
                      {editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <textarea
                            value={editBuffer}
                            onChange={(e) => setEditBuffer(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none outline-none"
                            autoFocus
                            rows={3}
                          />
                          <div className="flex justify-end gap-2 border-t border-white/20 pt-2">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="p-1 hover:text-red-300 transition-colors"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={() => {
                                activeConv.messages = activeConv.messages.slice(
                                  0,
                                  activeConv.messages.findIndex(
                                    (m) => m.id === msg.id,
                                  ),
                                );
                                setEditingMessageId(null);
                                handleSend(editBuffer);
                              }}
                              className="p-1 hover:text-emerald-300 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    {!editingMessageId && (
                      <div
                        className={cn(
                          "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 print:hidden",
                          msg.role === "user"
                            ? "right-full mr-2"
                            : "left-full ml-2",
                        )}
                      >
                        <button
                          onClick={() => copyFormattedText(msg.id)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-violet-500 shadow-sm border border-slate-200 dark:border-white/10 transition-all"
                          title="Copy Formatted"
                        >
                          <ClipboardCheck size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditBuffer(msg.content);
                          }}
                          className={cn(
                            "p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-violet-500 shadow-sm border border-slate-200 dark:border-white/10 transition-all",
                            msg.role !== "user" && "hidden",
                          )}
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="print:hidden">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={isTyping}
        />
      </div>
    </div>
  );
}

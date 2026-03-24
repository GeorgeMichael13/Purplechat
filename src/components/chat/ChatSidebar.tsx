"use client";

import { useChatStore } from "@/store/chatStore";
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  Trash2,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    deleteConversation,
    usageCount,
    maxLimit,
  } = useChatStore();

  const sidebarSpring = {
    type: "spring",
    stiffness: 450,
    damping: 38,
    mass: 0.8,
  };

  const handleNewChat = () => {
    setActiveConversation(null);
  };

  const usagePercentage = Math.min((usageCount / maxLimit) * 100, 100);

  const LogoIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M30 20H65C73.2843 20 80 26.7157 80 35V55C80 63.2843 73.2843 70 65 70H40L20 85V30C20 24.4772 24.4772 20 30 20Z"
        fill="currentColor"
      />
      <circle cx="45" cy="40" r="5" fill="#c4b5fd" opacity="0.8" />
      <circle cx="65" cy="40" r="5" fill="#c4b5fd" opacity="0.8" />
      <circle cx="55" cy="55" r="5" fill="#c4b5fd" opacity="0.8" />
    </svg>
  );

  return (
    <LayoutGroup>
      <motion.aside
        layout
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={sidebarSpring}
        className="h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col relative z-30 transition-colors"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shrink-0">
            <LogoIcon size={24} />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tighter dark:text-white"
            >
              PURPLE<span className="text-violet-600">CHAT</span>
            </motion.span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md z-50 hover:scale-110 transition-transform"
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
            <ChevronLeft size={14} className="dark:text-slate-400" />
          </motion.div>
        </button>

        <div className="px-4 mb-6">
          <motion.button
            layout
            onClick={handleNewChat}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center justify-center bg-violet-600 text-white rounded-2xl transition-all shadow-lg shadow-violet-500/20 font-bold",
              isCollapsed ? "w-12 h-12 mx-auto" : "w-full py-4 gap-3 px-4",
            )}
          >
            <Plus size={22} />
            {!isCollapsed && <span>New Analysis</span>}
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {!isCollapsed && conversations.length > 0 && (
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 py-2">
              History & Docs
            </p>
          )}
          <AnimatePresence mode="popLayout">
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative group"
              >
                <button
                  onClick={() => setActiveConversation(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                    activeConversationId === conv.id
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900",
                  )}
                >
                  <MessageSquare size={18} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate pr-6 text-left">
                      {conv.title || "Untitled Analysis"}
                    </span>
                  )}
                </button>
                {!isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(conv.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 space-y-4 border-t border-slate-100 dark:border-slate-900 mt-auto bg-slate-50/50 dark:bg-slate-950/50">
          {!isCollapsed && (
            <div className="px-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                  <Zap size={10} className="text-amber-500" />
                  Intelligence
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {usageCount}/{maxLimit}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${usagePercentage}%` }}
                  className={cn(
                    "h-full rounded-full transition-colors",
                    usagePercentage > 80 ? "bg-red-500" : "bg-violet-600",
                  )}
                />
              </div>
            </div>
          )}
          <button
            className={cn(
              "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors",
              isCollapsed && "justify-center",
            )}
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Settings size={16} className="text-slate-500" />
            </div>
            {!isCollapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold dark:text-white truncate">
                  Settings
                </p>
                <p className="text-[10px] text-slate-500">Neural Engine v2.0</p>
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-center dark:text-white mb-2">
                Delete Chat Memory?
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                This will remove all document analysis and history.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteConversation(deleteId);
                    setDeleteId(null);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}

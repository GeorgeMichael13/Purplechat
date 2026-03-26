"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LogOut,
  MessageSquare,
  LayoutDashboard,
  Settings,
  User,
  Clock,
  Plus,
  Trash2,
  Pin,
} from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentView: string;
  onNavigate: (view: "chat" | "profile" | "admin" | "settings") => void;
}

const MobileNav = ({
  isOpen,
  onClose,
  userEmail,
  currentView,
  onNavigate,
}: MobileNavProps) => {
  const {
    currentUser,
    logout,
    conversations,
    activeConversationId,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
    togglePin,
  } = useChatStore();

  const handleNav = (view: any) => {
    if (view === "admin" && currentUser?.role !== "admin") {
      onNavigate("profile");
    } else {
      onNavigate(view);
    }
    onClose();
  };

  const handleNewChat = () => {
    createNewConversation();
    onNavigate("chat");
    onClose();
  };

  const handleConversationClick = (id: string) => {
    setActiveConversation(id);
    onNavigate("chat");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-slate-900 z-[101] shadow-2xl lg:hidden flex flex-col"
          >
            {/* HEADER */}
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
                  P
                </div>
                <span className="font-bold text-lg dark:text-white tracking-tight">
                  Purple Chat
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {/* NEW CONVERSATION BUTTON */}
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 p-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold shadow-lg shadow-violet-500/25 transition-all active:scale-95"
              >
                <Plus size={20} strokeWidth={3} />
                New Chat
              </button>

              {/* MAIN NAVIGATION SECTION */}
              <div className="space-y-1">
                <MobileNavLink
                  icon={<LayoutDashboard size={18} />}
                  label="Dashboard"
                  onClick={() => handleNav("admin")}
                  active={currentView === "admin"}
                />
                <MobileNavLink
                  icon={<User size={18} />}
                  label="Profile"
                  onClick={() => handleNav("profile")}
                  active={currentView === "profile"}
                />
                <MobileNavLink
                  icon={<Settings size={18} />}
                  label="Settings"
                  onClick={() => handleNav("settings")}
                  active={currentView === "settings"}
                />
              </div>

              {/* RECENT CONVERSATIONS SECTION */}
              <div className="space-y-3">
                <div className="px-4 flex items-center gap-2">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Recent History
                  </span>
                </div>

                <div className="space-y-1">
                  {conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <div key={conv.id} className="group relative">
                        <button
                          onClick={() => handleConversationClick(conv.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left pr-16",
                            activeConversationId === conv.id &&
                              currentView === "chat"
                              ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent",
                          )}
                        >
                          <MessageSquare
                            size={16}
                            className={cn(
                              activeConversationId === conv.id &&
                                currentView === "chat"
                                ? "text-violet-500"
                                : "text-slate-400",
                            )}
                          />
                          <span className="text-sm font-medium truncate">
                            {conv.messages[0]?.content.slice(0, 30) ||
                              "New Conversation"}
                          </span>
                        </button>

                        {/* ACTION BUTTONS (PIN & DELETE) */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(conv.id);
                            }}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              conv.isPinned
                                ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10"
                                : "text-slate-300 hover:text-slate-500 dark:hover:text-slate-300",
                            )}
                          >
                            <Pin
                              size={14}
                              fill={conv.isPinned ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this chat?"))
                                deleteConversation(conv.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                      <p className="text-xs text-slate-400">No recent chats</p>
                    </div>
                  )}
                </div>
              </div>
            </nav>

            {/* USER FOOTER */}
            <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center border border-violet-200 dark:border-violet-500/30">
                  <span className="text-violet-600 font-bold">
                    {userEmail?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold dark:text-white truncate">
                    {userEmail?.split("@")[0] || "User"}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-tight text-slate-500">
                    {currentUser?.role === "admin"
                      ? "System Admin"
                      : "Personal Tier"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const MobileNavLink = ({ icon, label, onClick, active = false }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
      active
        ? "bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
    }`}
  >
    {icon}
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

export default MobileNav;

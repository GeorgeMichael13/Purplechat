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
} from "lucide-react";
// Import your store to check the user role and get conversations
import { useChatStore } from "@/store/chatStore";

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
  // Access the necessary state from your store
  const {
    currentUser,
    logout,
    conversations,
    activeConversationId,
    setActiveConversation,
  } = useChatStore();

  const handleNav = (view: any) => {
    if (view === "admin" && currentUser?.role !== "admin") {
      onNavigate("profile");
    } else {
      onNavigate(view);
    }
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
            className="fixed left-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-white dark:bg-slate-900 z-[101] shadow-2xl lg:hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
                  P
                </div>
                <span className="font-bold text-lg dark:text-white">
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

            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
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
                    Recent
                  </span>
                </div>

                <div className="space-y-1">
                  {conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleConversationClick(conv.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                          activeConversationId === conv.id &&
                          currentView === "chat"
                            ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <MessageSquare
                          size={16}
                          className={
                            activeConversationId === conv.id &&
                            currentView === "chat"
                              ? "text-violet-500"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm font-medium truncate">
                          {conv.messages[0]?.content.slice(0, 30) ||
                            "New Conversation"}
                          ...
                        </span>
                      </button>
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
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                  <span className="text-violet-600 font-bold">
                    {userEmail?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium dark:text-white truncate">
                    {userEmail || "User Account"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {currentUser?.role === "admin"
                      ? "Admin Access"
                      : "Free Tier"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all font-medium"
              >
                <LogOut size={18} />
                Logout
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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active
        ? "bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default MobileNav;

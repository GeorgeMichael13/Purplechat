"use client";

import { useChatStore } from "@/store/chatStore";
import {
  SquarePen, // The "ChatGPT" style New Chat icon
  User,
  LogOut,
  Trash2,
  Pin,
  ShieldCheck,
  MessageSquare,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  onNavigate: (view: "chat" | "profile" | "admin") => void;
}

export default function ChatSidebar({ onNavigate }: ChatSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    currentUser,
    conversations,
    activeConversationId,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
    togglePin,
    logout,
    usageCount,
    maxLimit,
    getUsageStats,
  } = useChatStore();

  const stats = getUsageStats();
  const userConversations = conversations.filter(
    (c) => c.userId === currentUser?.id,
  );
  const pinnedConvs = userConversations.filter((c) => c.isPinned);
  const otherConvs = userConversations.filter((c) => !c.isPinned);

  if (isCollapsed) {
    return (
      <aside className="w-16 flex flex-col items-center py-6 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full mb-8"
        >
          <ChevronLeft size={20} className="rotate-180" />
        </button>
        <button
          onClick={() => {
            onNavigate("chat");
            createNewConversation();
          }}
          className="p-3 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-xl mb-4 transition-all"
        >
          <SquarePen size={22} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all">
      {/* HEADER: LOGO & COLLAPSE */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <Sparkles size={18} />
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-white">
            PURPLE CHAT
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* NEW CONVERSATION BUTTON (ChatGPT/Gemini Style) */}
      <div className="px-4 py-2">
        <button
          onClick={() => {
            onNavigate("chat");
            createNewConversation();
          }}
          className="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 py-2.5 px-4 rounded-xl transition-all font-medium group shadow-sm"
        >
          <span className="text-sm">New Chat</span>
          <SquarePen
            size={18}
            className="text-slate-400 group-hover:text-violet-600 transition-colors"
          />
        </button>
      </div>

      {/* HISTORY LIST */}
      <div className="flex-1 overflow-y-auto px-3 mt-4 space-y-6 scrollbar-hide">
        {pinnedConvs.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 mb-2 ml-2 uppercase tracking-wider">
              Pinned
            </p>
            {pinnedConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={activeConversationId === conv.id}
                onSelect={(id: string) => {
                  onNavigate("chat");
                  setActiveConversation(id);
                }}
                onDelete={(id: string) => deleteConversation(id)}
                onPin={(id: string) => togglePin(id)}
              />
            ))}
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold text-slate-400 mb-2 ml-2 uppercase tracking-wider">
            Recent
          </p>
          {otherConvs.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              active={activeConversationId === conv.id}
              onSelect={(id: string) => {
                onNavigate("chat");
                setActiveConversation(id);
              }}
              onDelete={(id: string) => deleteConversation(id)}
              onPin={(id: string) => togglePin(id)}
            />
          ))}
        </div>
      </div>

      {/* QUOTA SECTION */}
      {!stats.isAdmin && (
        <div className="px-4 py-3 mx-3 mb-2 bg-slate-200/30 dark:bg-slate-800/50 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
            <span>Power remaining</span>
            <span>
              {usageCount} / {maxLimit}
            </span>
          </div>
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-700"
              style={{ width: `${stats.usagePercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {currentUser?.role === "admin" && (
          <button
            onClick={() => onNavigate("admin")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <ShieldCheck size={18} />
            Creator Console
          </button>
        )}

        <button
          onClick={() => onNavigate("profile")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <User size={18} />
          Profile
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function ConversationItem({ conv, active, onSelect, onDelete, onPin }: any) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all mb-1",
        active
          ? "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white"
          : "hover:bg-slate-200/40 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400",
      )}
      onClick={() => onSelect(conv.id)}
    >
      <MessageSquare
        size={16}
        className={cn("shrink-0", active ? "opacity-100" : "opacity-40")}
      />
      <span className="truncate pr-10">{conv.title || "New Chat"}</span>

      <div
        className={cn(
          "absolute right-2 flex gap-1 transition-opacity",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin(conv.id);
          }}
          className="p-1 hover:text-violet-600"
        >
          <Pin size={14} className={conv.isPinned ? "fill-current" : ""} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conv.id);
          }}
          className="p-1 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

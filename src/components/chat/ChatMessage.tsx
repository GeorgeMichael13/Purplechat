"use client";

import React, { useState } from "react";
import { Edit2, Check, X, Copy, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MessageProps {
  role: string;
  content: string;
  index: number;
  onEditSubmit: (index: number, newContent: string) => void;
}

export default function ChatMessage({
  role,
  content,
  index,
  onEditSubmit,
}: MessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const isUser = role === "user" || role === "owner";

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleSave = () => {
    if (editText.trim() !== content) {
      onEditSubmit(index, editText);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-4 rounded-3xl transition-all max-w-[90%] md:max-w-[80%]",
        isUser
          ? "bg-violet-600/10 self-end flex-row-reverse ml-auto"
          : "bg-slate-100 dark:bg-white/5 self-start mr-auto",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm",
          isUser
            ? "bg-violet-600 border-violet-400 text-white"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10",
        )}
      >
        {isUser ? (
          <User size={14} />
        ) : (
          <Bot size={14} className="text-violet-500" />
        )}
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-2 w-full">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-violet-500 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500/20 outline-none transition-all dark:text-slate-100"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleSave}
                className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-lg"
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap dark:text-slate-200">
              {content}
            </div>

            {/* Hover Actions Bar */}
            <div
              className={cn(
                "absolute top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200",
                isUser ? "right-full mr-2" : "left-full ml-2",
              )}
            >
              <button
                onClick={handleCopy}
                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-violet-600 hover:scale-110 active:scale-95 transition-all"
                title="Copy"
              >
                <Copy size={14} />
              </button>
              {isUser && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-violet-600 hover:scale-110 active:scale-95 transition-all"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

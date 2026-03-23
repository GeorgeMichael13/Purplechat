"use client";

import { ChevronLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Botton";

interface ChatHeaderProps {
  title: string;
  onBack?: () => void;
}

export default function ChatHeader({ title, onBack }: ChatHeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft size={20} />
          </Button>
        )}
        <h1 className="text-lg font-semibold truncate max-w-60 sm:max-w-none">
          {title || "New Conversation"}
        </h1>
      </div>

      <Button variant="ghost" size="icon">
        <MoreVertical size={20} />
      </Button>
    </header>
  );
}

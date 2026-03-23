"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import MessageItem from "./MessageItem";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
};

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      <div className="space-y-8 max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="h-[60vh] flex items-center justify-center text-slate-500 dark:text-slate-400">
            Start typing to begin the conversation...
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

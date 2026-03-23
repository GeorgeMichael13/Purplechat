// src/components/AppLayout.tsx
"use client";

import ChatSidebar from "./ChatSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      <ChatSidebar />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}

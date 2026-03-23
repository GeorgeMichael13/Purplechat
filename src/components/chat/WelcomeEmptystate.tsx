import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface WelcomeEmptyStateProps {
  onStartNewChat: () => void;
}

export default function WelcomeEmptyState({
  onStartNewChat,
}: WelcomeEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-violet-600 dark:text-violet-400" />
      </div>

      <h2 className="text-3xl font-bold mb-3">Welcome to PurpleChat</h2>
      <p className="text-slate-600 dark:text-slate-300 max-w-md mb-10">
        Your personal AI conversation assistant. Start typing below or create a
        new conversation to begin.
      </p>

      <Button size="lg" onClick={onStartNewChat}>
        Start New Conversation
      </Button>

      <div className="mt-12 text-sm text-slate-500 dark:text-slate-400">
        <p>Real LLM integration coming soon – no fake responses here.</p>
      </div>
    </div>
  );
}

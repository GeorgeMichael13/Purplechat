import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

function reviveDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);

  const revived: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z/.test(value)) {
      revived[key] = new Date(value);
    } else if (typeof value === 'object' && value !== null) {
      revived[key] = reviveDates(value);
    } else {
      revived[key] = value;
    }
  }
  return revived;
}

export type Attachment = {
  name: string;
  type: string;
  url: string; // Base64 or Blob URL
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

type ChatStore = {
  conversations: Conversation[];
  activeConversationId: string | null;
  createNewConversation: () => string;
  setActiveConversation: (id: string | null) => void;
  addMessage: (convId: string, role: 'user' | 'assistant', content: string, attachments?: Attachment[]) => Promise<void>;
  deleteConversation: (id: string) => void;
  clearMessages: (convId: string) => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createNewConversation: () => {
        const id = crypto.randomUUID();
        const now = new Date();
        const newConv: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      deleteConversation: (id) => {
        set((state) => {
          const updatedConversations = state.conversations.filter((c) => c.id !== id);
          let nextActiveId = state.activeConversationId;
          if (state.activeConversationId === id) {
            nextActiveId = updatedConversations.length > 0 ? updatedConversations[0].id : null;
          }
          return {
            conversations: updatedConversations,
            activeConversationId: nextActiveId,
          };
        });
      },

      clearMessages: (convId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === convId ? { ...conv, messages: [], updatedAt: new Date() } : conv
          ),
        }));
      },

      addMessage: async (convId, role, content, attachments = []) => {
        const message: Message = {
          id: crypto.randomUUID(),
          role,
          content,
          attachments,
          timestamp: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === convId) {
              const isFirstUserMessage = conv.messages.length === 0 && role === 'user';
              let newTitle = conv.title;
              if (isFirstUserMessage) {
                newTitle = content.trim().slice(0, 40) + (content.length > 40 ? '...' : '');
              }
              return {
                ...conv,
                messages: [...conv.messages, message],
                title: newTitle,
                updatedAt: new Date(),
              };
            }
            return conv;
          }),
        }));

        const updatedConv = get().conversations.find((c) => c.id === convId);
        if (role === 'user' && updatedConv?.messages.length === 1) {
          try {
            const response = await fetch('/api/title', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: content }),
            });
            if (response.ok) {
              const { title } = await response.json();
              const cleanTitle = title.replace(/["']/g, "").trim();
              set((state) => ({
                conversations: state.conversations.map((c) =>
                  c.id === convId ? { ...c, title: cleanTitle } : c
                ),
              }));
            }
          } catch (error) {
            console.error("Title generation failed:", error);
          }
        }
      },
    }),
    {
      name: 'purplechat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        const revived = reviveDates(persistedState);
        return {
          ...currentState,
          ...revived,
          conversations: revived.conversations ?? [],
          activeConversationId: revived.activeConversationId ?? null,
        };
      },
    }
  )
);
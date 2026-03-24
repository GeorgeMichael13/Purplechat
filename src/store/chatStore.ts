import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatMode = "general" | "developer" | "student" | "writer" | "productivity";
export type AIProvider = "google" | "openai" | "groq";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  occupation: string;
  joinedAt: number;
  role: "user" | "admin";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  userId: string;
  title?: string; // Added for sidebar display
  messages: Message[];
  mode: ChatMode;
  provider: AIProvider;
  isPinned?: boolean;
}

interface ChatState {
  users: UserProfile[];
  currentUser: UserProfile | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  mode: ChatMode;
  provider: AIProvider;
  usageCount: number;
  maxLimit: number;
  
  // Auth & Leads
  signup: (data: Omit<UserProfile, "id" | "joinedAt" | "role">) => void;
  login: (email: string) => boolean;
  logout: () => void;
  exportLeadsToCSV: () => void;
  
  // Admin Actions
  deleteUser: (userId: string) => void;
  broadcastMessage: (content: string) => void;
  
  // Actions
  setMode: (mode: ChatMode) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (convId: string, role: "user" | "assistant", content: string) => void;
  createNewConversation: (userId?: string) => string;
  deleteConversation: (id: string) => void; // New Action added
  clearMessages: (convId: string) => void;
  togglePin: (convId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      conversations: [],
      activeConversationId: null,
      mode: "general",
      provider: "google",
      usageCount: 0,
      maxLimit: 20,

      signup: (data) => {
        const isFirstUser = get().users.length === 0;
        const role = isFirstUser ? "admin" : "user"; 
        
        const newUser: UserProfile = { 
          ...data, 
          id: Math.random().toString(36).substring(7), 
          joinedAt: Date.now(),
          role 
        };
        
        set((state) => ({ 
          users: [...state.users, newUser], 
          currentUser: newUser 
        }));
      },

      login: (email) => {
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) { 
          set({ currentUser: user }); 
          return true; 
        }
        return false;
      },

      logout: () => set({ currentUser: null, activeConversationId: null }),

      deleteUser: (userId) => set((state) => ({
        users: state.users.filter(u => u.id !== userId),
        conversations: state.conversations.filter(c => c.userId !== userId),
        currentUser: state.currentUser?.id === userId ? null : state.currentUser
      })),

      broadcastMessage: (content) => set((state) => ({
        conversations: state.conversations.map(conv => ({
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: "broadcast-" + Math.random().toString(36).substring(7),
              role: "assistant",
              content: `📢 **SYSTEM BROADCAST:**\n\n${content}`,
              timestamp: Date.now()
            }
          ]
        }))
      })),

      exportLeadsToCSV: () => {
        const users = get().users;
        const headers = ["ID", "Name", "Email", "Occupation", "Role", "Joined At"];
        const rows = users.map(u => [u.id, u.name, u.email, u.occupation, u.role, new Date(u.joinedAt).toLocaleDateString()]);
        
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `purple_admin_leads_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },

      setMode: (mode) => set({ mode }),
      
      setActiveConversation: (id) => set({ activeConversationId: id }),
      
      createNewConversation: (userId) => {
        const user = userId ? get().users.find(u => u.id === userId) : get().currentUser;
        if (!user) return "";
        const id = Math.random().toString(36).substring(7);
        const newConv: Conversation = { 
          id, 
          userId: user.id, 
          title: "New Analysis",
          messages: [], 
          mode: get().mode, 
          provider: get().provider, 
          isPinned: false 
        };
        
        set((state) => ({
          activeConversationId: id,
          conversations: [...state.conversations, newConv],
        }));
        return id;
      },

      // Logic to delete a single conversation
      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId
      })),

      addMessage: (convId, role, content) => set((state) => ({
        usageCount: role === "user" ? state.usageCount + 1 : state.usageCount,
        conversations: state.conversations.map((c) => {
          if (c.id === convId) {
            // If it's the first user message, use it as the conversation title
            const isFirstMessage = c.messages.length === 0 && role === "user";
            return {
              ...c,
              title: isFirstMessage ? content.slice(0, 40) + (content.length > 40 ? "..." : "") : c.title,
              messages: [...c.messages, { 
                id: Math.random().toString(36).substring(7), 
                role, 
                content, 
                timestamp: Date.now() 
              }]
            };
          }
          return c;
        })
      })),

      togglePin: (convId) => set((state) => ({
        conversations: state.conversations.map((c) => c.id === convId ? { ...c, isPinned: !c.isPinned } : c)
      })),

      clearMessages: (convId) => set((state) => ({
        conversations: state.conversations.map((c) => c.id === convId ? { ...c, messages: [] } : c)
      })),
    }),
    { name: 'purple-chat-v3-storage' }
  )
);
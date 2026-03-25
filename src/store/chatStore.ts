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
  avatar?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  attachments?: any[];
}

interface Conversation {
  id: string;
  userId: string;
  title?: string;
  messages: Message[];
  mode: ChatMode;
  provider: AIProvider;
  isPinned?: boolean;
}

interface UsageStats {
  totalPrompts: number;
  promptsByMode: Record<ChatMode, number>;
  remainingQuota: number;
  usagePercentage: number;
  isAdmin: boolean; 
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
  lastResetTimestamp: number | null;
  _hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  signup: (data: Omit<UserProfile, "id" | "joinedAt" | "role">) => void;
  login: (email: string, password?: string) => boolean;
  loginWithProvider: (email: string, name: string) => void;
  logout: () => void;
  updateProfile: (name: string, occupation: string) => void;
  updateAvatar: (avatarUrl: string) => void;
  
  // ADMIN ACTIONS
  exportLeadsToCSV: () => void;
  deleteUser: (userId: string) => void;
  broadcastMessage: (content: string) => void;
  
  setMode: (mode: ChatMode) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (convId: string, role: "user" | "assistant", content: string, attachments?: any[]) => void;
  createNewConversation: (userId?: string) => string;
  deleteConversation: (id: string) => void;
  clearMessages: (convId: string) => void;
  togglePin: (convId: string) => void;
  getUsageStats: () => UsageStats;
  checkAndResetQuota: () => void;
}

const CREATOR_EMAIL = "michaelgeo1324@gmail.com,13donvicky@gmail.com"; 
const MASTER_ADMIN_PASSWORD = "Admin123"; 

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
      lastResetTimestamp: null,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      checkAndResetQuota: () => {
        const state = get();
        if (state.currentUser?.role === "admin") return;

        const now = Date.now();
        const { lastResetTimestamp } = state;
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        if (!lastResetTimestamp || now - lastResetTimestamp > TWENTY_FOUR_HOURS) {
          set({ usageCount: 0, lastResetTimestamp: now });
        }
      },

      getUsageStats: () => {
        const state = get();
        const isAdmin = state.currentUser?.role === "admin";

        if (isAdmin) {
          return {
            totalPrompts: 0,
            promptsByMode: { general: 0, developer: 0, student: 0, writer: 0, productivity: 0 },
            remainingQuota: Infinity, 
            usagePercentage: 0,
            isAdmin: true
          };
        }

        const userConvs = state.conversations.filter(c => c.userId === state.currentUser?.id);
        const promptsByMode: Record<ChatMode, number> = {
          general: 0, developer: 0, student: 0, writer: 0, productivity: 0
        };
        userConvs.forEach(c => {
          const userMessages = c.messages.filter(m => m.role === "user").length;
          promptsByMode[c.mode] += userMessages;
        });

        return {
          totalPrompts: state.usageCount,
          promptsByMode,
          remainingQuota: Math.max(0, state.maxLimit - state.usageCount),
          usagePercentage: (state.usageCount / state.maxLimit) * 100,
          isAdmin: false
        };
      },

      signup: (data) => {
        const isCreator = data.email.toLowerCase() === CREATOR_EMAIL.toLowerCase();
        const role = (get().users.length === 0 || isCreator) ? "admin" : "user"; 
        const newUser: UserProfile = { 
          ...data, 
          id: Math.random().toString(36).substring(7), 
          joinedAt: Date.now(),
          role 
        };
        set((state) => ({ users: [...state.users, newUser], currentUser: newUser }));
      },

      login: (email, password) => {
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        // Handle Creator Access
        if (email.toLowerCase() === CREATOR_EMAIL.toLowerCase() && password === MASTER_ADMIN_PASSWORD) {
          if (user) {
            user.role = "admin";
            set({ currentUser: user });
          } else {
            const adminUser: UserProfile = {
              id: "admin-master",
              name: "Michael (Creator)",
              email: CREATOR_EMAIL,
              occupation: "System Architect",
              joinedAt: Date.now(),
              role: "admin"
            };
            set(state => ({ users: [...state.users, adminUser], currentUser: adminUser }));
          }
          return true;
        }

        if (user) { 
          if (email.toLowerCase() === CREATOR_EMAIL.toLowerCase()) user.role = "admin";
          set({ currentUser: user }); 
          get().checkAndResetQuota(); 
          return true; 
        }
        return false;
      },

      loginWithProvider: (email, name) => {
        const existingUser = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        const isCreator = email.toLowerCase() === CREATOR_EMAIL.toLowerCase();

        if (existingUser) {
          if (isCreator) existingUser.role = "admin";
          set({ currentUser: existingUser });
        } else {
          const newUser: UserProfile = {
            id: Math.random().toString(36).substring(7),
            name,
            email,
            occupation: "Neural Explorer",
            joinedAt: Date.now(),
            role: (get().users.length === 0 || isCreator) ? "admin" : "user",
          };
          set((state) => ({ users: [...state.users, newUser], currentUser: newUser }));
        }
        get().checkAndResetQuota();
      },

      logout: () => set({ currentUser: null, activeConversationId: null }),

      updateProfile: (name, occupation) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, name, occupation } : null,
        users: state.users.map(u => u.id === state.currentUser?.id ? { ...u, name, occupation } : u)
      })),

      updateAvatar: (avatarUrl) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, avatar: avatarUrl } : null,
        users: state.users.map(u => u.id === state.currentUser?.id ? { ...u, avatar: avatarUrl } : u)
      })),

      // ADMIN FEATURE: DELETE USER & CLEANUP CONVERSATIONS
      deleteUser: (userId) => set((state) => ({
        users: state.users.filter(u => u.id !== userId),
        conversations: state.conversations.filter(c => c.userId !== userId),
        currentUser: state.currentUser?.id === userId ? null : state.currentUser,
        activeConversationId: state.currentUser?.id === userId ? null : state.activeConversationId
      })),

      // ADMIN FEATURE: BROADCAST TO ALL CONVERSATIONS
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

      // ADMIN FEATURE: EXPORT USER BASE
      exportLeadsToCSV: () => {
        const users = get().users;
        const headers = ["ID", "Name", "Email", "Occupation", "Role", "Joined At"];
        const rows = users.map(u => [u.id, u.name, u.email, u.occupation, u.role, new Date(u.joinedAt).toLocaleDateString()]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement("a"));
        link.href = url;
        link.download = `admin_export_${Date.now()}.csv`;
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
        set((state) => ({ activeConversationId: id, conversations: [...state.conversations, newConv] }));
        return id;
      },

      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId
      })),

      addMessage: (convId, role, content, attachments) => {
        const isAdmin = get().currentUser?.role === "admin";
        if (!isAdmin) get().checkAndResetQuota();

        set((state) => {
          const targetConv = state.conversations.find(c => c.id === convId);
          const isCurrentUserMessage = targetConv?.userId === state.currentUser?.id;
          
          const newUsageCount = (role === "user" && isCurrentUserMessage && !isAdmin) 
            ? state.usageCount + 1 
            : state.usageCount;

          return {
            usageCount: newUsageCount,
            conversations: state.conversations.map((c) => {
              if (c.id === convId) {
                const isFirstMsg = c.messages.length === 0 && role === "user";
                return {
                  ...c,
                  title: isFirstMsg ? content.slice(0, 40) : c.title,
                  messages: [...c.messages, { 
                    id: Math.random().toString(36).substring(7), 
                    role, content, timestamp: Date.now(), attachments 
                  }]
                };
              }
              return c;
            })
          };
        });
      },

      togglePin: (convId) => set((state) => ({
        conversations: state.conversations.map((c) => c.id === convId ? { ...c, isPinned: !c.isPinned } : c)
      })),

      clearMessages: (convId) => set((state) => ({
        conversations: state.conversations.map((c) => c.id === convId ? { ...c, messages: [] } : c)
      })),
    }),
    { 
      name: 'purple-chat-v3-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
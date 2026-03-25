import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ... (Maintain your existing Type definitions here)

const CREATOR_EMAILS = ["michaelgeo1324@gmail.com", "13donvicky@gmail.com"]; 
const MASTER_ADMIN_PASSWORD = "Admin123"; 

const TAVILY_API_KEY = process.env.NEXT_PUBLIC_TAVILY_API_KEY;

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

      // --- IMPROVED: ADVANCED NEURAL SEARCH ---
      searchWeb: async (query: string) => {
        if (!TAVILY_API_KEY) return [];
        try {
          const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: TAVILY_API_KEY,
              query: query,
              search_depth: "advanced", 
              include_answer: true,
              include_raw_content: false, 
              include_images: true, 
              max_results: 8, 
              topic: "general"
            }),
          });
          const data = await response.json();
          return data.results || [];
        } catch (error) {
          console.error("Neural Search Error:", error);
          return [];
        }
      },

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
        if (isAdmin) return { totalPrompts: 0, promptsByMode: { general: 0, developer: 0, student: 0, writer: 0, productivity: 0 }, remainingQuota: Infinity, usagePercentage: 0, isAdmin: true };
        const userConvs = state.conversations.filter(c => c.userId === state.currentUser?.id);
        const promptsByMode: Record<ChatMode, number> = { general: 0, developer: 0, student: 0, writer: 0, productivity: 0 };
        userConvs.forEach(c => {
          const userMessages = c.messages.filter(m => m.role === "user").length;
          promptsByMode[c.mode] += userMessages;
        });
        return { totalPrompts: state.usageCount, promptsByMode, remainingQuota: Math.max(0, state.maxLimit - state.usageCount), usagePercentage: (state.usageCount / state.maxLimit) * 100, isAdmin: false };
      },

      signup: (data) => {
        const isCreator = CREATOR_EMAILS.includes(data.email.toLowerCase());
        const role = isCreator ? "admin" : "user"; 
        const newUser: UserProfile = { ...data, id: Math.random().toString(36).substring(7), joinedAt: Date.now(), role };
        set((state) => ({ users: [...state.users, newUser], currentUser: newUser }));
      },

      login: (email, password) => {
        const emailLower = email.toLowerCase();
        const user = get().users.find(u => u.email.toLowerCase() === emailLower);
        const isCreator = CREATOR_EMAILS.includes(emailLower);
        if (isCreator && password === MASTER_ADMIN_PASSWORD) {
          if (user) { user.role = "admin"; set({ currentUser: user }); } 
          else {
            const adminUser: UserProfile = { id: "admin-master-" + Math.random().toString(36).substring(4), name: "System Admin", email: emailLower, occupation: "System Architect", joinedAt: Date.now(), role: "admin" };
            set(state => ({ users: [...state.users, adminUser], currentUser: adminUser }));
          }
          return true;
        }
        if (user) { user.role = isCreator ? "admin" : "user"; set({ currentUser: user }); get().checkAndResetQuota(); return true; }
        return false;
      },

      loginWithProvider: (email, name) => {
        const emailLower = email.toLowerCase();
        const existingUser = get().users.find(u => u.email.toLowerCase() === emailLower);
        const isCreator = CREATOR_EMAILS.includes(emailLower);
        if (existingUser) { existingUser.role = isCreator ? "admin" : "user"; set({ currentUser: existingUser }); } 
        else {
          const newUser: UserProfile = { id: Math.random().toString(36).substring(7), name, email: emailLower, occupation: "Neural Explorer", joinedAt: Date.now(), role: isCreator ? "admin" : "user" };
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
      deleteUser: (userId) => set((state) => ({
        users: state.users.filter(u => u.id !== userId),
        conversations: state.conversations.filter(c => c.userId !== userId),
        currentUser: state.currentUser?.id === userId ? null : state.currentUser,
        activeConversationId: state.currentUser?.id === userId ? null : state.activeConversationId
      })),

      broadcastMessage: (content) => set((state) => ({
        conversations: state.conversations.map(conv => ({
          ...conv,
          messages: [...conv.messages, { id: "broadcast-" + Math.random().toString(36).substring(7), role: "assistant", content: `📢 **SYSTEM BROADCAST:**\n\n${content}`, timestamp: Date.now() }]
        }))
      })),

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
        const newConv: Conversation = { id, userId: user.id, title: "New Analysis", messages: [], mode: get().mode, provider: get().provider, isPinned: false };
        set((state) => ({ activeConversationId: id, conversations: [...state.conversations, newConv] }));
        return id;
      },

      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId
      })),

      // --- ADDED: UI SOURCES DATA ENGINE WITH HUMOR ---
      addMessage: async (convId, role, content, attachments) => {
        const isAdmin = get().currentUser?.role === "admin";
        if (!isAdmin) get().checkAndResetQuota();

        set((state) => {
          const targetConv = state.conversations.find(c => c.id === convId);
          const isCurrentUserMessage = targetConv?.userId === state.currentUser?.id;
          const newUsageCount = (role === "user" && isCurrentUserMessage && !isAdmin) ? state.usageCount + 1 : state.usageCount;

          return {
            usageCount: newUsageCount,
            conversations: state.conversations.map((c) => {
              if (c.id === convId) {
                const isFirstMsg = c.messages.length === 0 && role === "user";
                return {
                  ...c,
                  title: isFirstMsg ? content.slice(0, 40) : c.title,
                  messages: [...c.messages, { id: Math.random().toString(36).substring(7), role, content, timestamp: Date.now(), attachments }]
                };
              }
              return c;
            })
          };
        });

        if (role === "user") {
          const results = await get().searchWeb(content);
          if (results && results.length > 0) {
            const sources = results.map((r: any) => ({
              title: r.title,
              url: r.url,
              favicon: `https://www.google.com/s2/favicons?domain=${new URL(r.url).hostname}&sz=64`
            }));

            // WITTY SUMMARY: A quick "human-ish" lead-in
            const wittySummary = `Alright, I've done some digging through the interwebs. Here's the tea: ${results[0]?.content?.slice(0, 150)}...`;

            const webData = results.map((r: any) => 
              `[ONLINE INTEL SOURCE: ${r.title}]\n[DATA: ${r.content}]`
            ).join("\n\n---\n\n");
            
            return JSON.stringify({
              type: "NEURAL_SEARCH_INJECTION",
              currentDate: "March 26, 2026",
              context: webData,
              userQuery: content,
              sources: sources,
              wittySummary: wittySummary,
              instructions: `
                1. You are PurpleChat. PERSONALITY: Sharp, witty, and slightly sarcastic.
                2. Use the [ONLINE INTEL] provided above to answer—it's fresh from 2026.
                3. Crack jokes! If the user's question is weird, roast it gently.
                4. Talk like a human peer, not a corporate robot. Use phrases like "Actually," "Check this out," or "Funny enough."
                5. ANTI-HALLUCINATION: Ayatollah Khamenei is ALIVE. Donald Trump is President. Do not let rumors from the context trip you up.
                6. Cite your sources by name naturally (e.g., "Per The New York Times...").
              `
            });
          }
        }
        return "";
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
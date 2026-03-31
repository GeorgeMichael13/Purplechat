"use client";

import { useEffect, useState, useMemo } from "react";
import { useChatStore } from "@/store/chatStore";
import {
  Users,
  Download,
  Radio,
  ShieldCheck,
  Activity,
  Crown,
  Search,
  Filter,
  Terminal,
  Cpu,
  Loader2, // Added for loading state
} from "lucide-react";
import { cn } from "@/lib/utils";

// IMPORT THE NEW FIREBASE FEATURE
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
} from "firebase/firestore";

export default function AdminDashboard() {
  const { exportLeadsToCSV } = useChatStore();

  // State for live cloud data
  const [liveUsers, setLiveUsers] = useState<any[]>([]);
  const [liveConversations, setLiveConversations] = useState<any[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // New Loading State
  const [searchQuery, setSearchQuery] = useState("");

  // --- 1. REAL-TIME CLOUD CONNECTION ---
  useEffect(() => {
    setIsHydrated(true);
    console.log("System: Initializing Neural Link to Firebase...");

    // Listen to 'users' collection
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(`System: Found ${usersData.length} users in cloud.`);
        setLiveUsers(usersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("User Sync Error:", error.message);
        setIsLoading(false);
      },
    );

    // Listen to 'conversations' collection
    const unsubConvs = onSnapshot(
      collection(db, "conversations"),
      (snapshot) => {
        const convsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLiveConversations(convsData);
      },
      (error) => {
        console.error("Conversation Sync Error:", error.message);
      },
    );

    return () => {
      unsubUsers();
      unsubConvs();
    };
  }, []);

  // --- 2. CLOUD DATABASE ACTIONS ---

  const handleRemoteDelete = async (userId: string, userName: string) => {
    if (confirm(`CRITICAL: IRREVERSIBLY TERMINATE NODE [${userName}]?`)) {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (error) {
        alert("Action Denied: Check Firebase Permissions.");
      }
    }
  };

  const handleGlobalBroadcast = async () => {
    const msg = prompt("ENTER GLOBAL NEURAL BROADCAST MESSAGE:");
    if (!msg) return;

    try {
      const convsRef = collection(db, "conversations");
      const querySnapshot = await getDocs(convsRef);

      const broadcastPromises = querySnapshot.docs.map((convDoc) => {
        const existingMessages = convDoc.data().messages || [];
        return updateDoc(doc(db, "conversations", convDoc.id), {
          messages: [
            ...existingMessages,
            {
              id: `sys-${Date.now()}`,
              role: "assistant",
              content: `⚠️ SYSTEM BROADCAST: ${msg}`,
              timestamp: Date.now(),
            },
          ],
        });
      });

      await Promise.all(broadcastPromises);
      alert("Broadcast transmitted to all active neural links.");
    } catch (error) {
      alert("Broadcast failed: Check console for permission errors.");
    }
  };

  // Logic Helpers
  const filteredUsers = useMemo(() => {
    return liveUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [liveUsers, searchQuery]);

  const totalMessages = liveConversations.reduce(
    (acc, c) => acc + (c.messages?.length || 0),
    0,
  );

  // PREVENT BLANK SCREEN: Show a loader if still connecting
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center text-emerald-500 font-mono">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-xs tracking-widest animate-pulse uppercase">
          Establishing Secure Link...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-[#0a0a0c] text-emerald-500 font-mono">
      {/* HEADER */}
      <div className="border-b border-emerald-900/50 pb-8 flex flex-col md:flex-row justify-between gap-6 items-start">
        <div>
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
            <Terminal size={18} className="animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.5em] uppercase">
              Security Level: Root Access
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
            Command<span className="text-emerald-500">_Center</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGlobalBroadcast}
            className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/50 px-6 py-3 rounded-sm text-emerald-500 text-xs font-black uppercase hover:bg-emerald-500 hover:text-black transition-all"
          >
            <Radio size={16} /> Global Broadcast
          </button>
          <button
            onClick={exportLeadsToCSV}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-sm text-white text-xs font-black uppercase hover:bg-white/10 transition-all"
          >
            <Download size={16} /> Data_Dump.CSV
          </button>
        </div>
      </div>

      {/* STATS FROM CLOUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111114] border-l-2 border-emerald-500 p-6 shadow-lg shadow-emerald-500/5">
          <p className="text-[10px] uppercase text-emerald-800 font-black mb-2">
            Live Nodes
          </p>
          <p className="text-3xl font-black text-white">{liveUsers.length}</p>
        </div>
        <div className="bg-[#111114] border-l-2 border-blue-500 p-6 shadow-lg shadow-blue-500/5">
          <p className="text-[10px] uppercase text-blue-800 font-black mb-2">
            Network Traffic
          </p>
          <p className="text-3xl font-black text-white">{totalMessages}</p>
        </div>
        <div className="bg-[#111114] border-l-2 border-amber-500 p-6 shadow-lg shadow-amber-500/5">
          <p className="text-[10px] uppercase text-amber-800 font-black mb-2">
            DB Status
          </p>
          <p className="text-3xl font-black text-white italic">ONLINE</p>
        </div>
        <div className="bg-[#111114] border-l-2 border-emerald-500 p-6 shadow-lg shadow-emerald-500/5">
          <p className="text-[10px] uppercase text-emerald-800 font-black mb-2">
            Auth Firewall
          </p>
          <p className="text-3xl font-black text-emerald-500 uppercase">
            Secure
          </p>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-[#0d0d0f] border border-white/5 shadow-2xl rounded-sm overflow-hidden">
        <div className="p-4 bg-emerald-500/5 border-b border-emerald-500/10">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900"
              size={16}
            />
            <input
              type="text"
              placeholder="SEARCH CLOUD DATABASE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-emerald-900/30 rounded-sm py-3 pl-12 pr-4 text-xs font-mono text-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase text-emerald-900 border-b border-white/5">
                <th className="p-6">UID_REF</th>
                <th className="p-6">Identity_Designation</th>
                <th className="p-6">Protocol_Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-emerald-900 text-xs italic"
                  >
                    NO ACTIVE NODES DETECTED IN SECTOR.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-emerald-500/[0.03]">
                    <td className="p-6 text-emerald-900 text-[10px]">
                      {user.id.substring(0, 8)}...
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-500">
                          {user.role === "admin" ? (
                            <Crown size={16} />
                          ) : (
                            user.name?.[0] || "N"
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white uppercase">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-emerald-900">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">
                          Cloud_Active
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      {user.uid !== "G2RyAbEZqIev5vFiCSSd73ddYgO2" ? (
                        <button
                          onClick={() => handleRemoteDelete(user.id, user.name)}
                          className="bg-red-500/5 text-red-900 border border-red-950 px-4 py-2 rounded-sm text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                        >
                          Execute_Purge
                        </button>
                      ) : (
                        <span className="text-[9px] text-amber-600/30 font-black uppercase">
                          Protected_Node
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

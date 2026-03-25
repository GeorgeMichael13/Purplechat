"use client";

import { useChatStore } from "@/store/chatStore";
import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Trash2,
  Download,
  Radio,
  ShieldCheck,
  Activity,
  Zap,
  Crown,
  Search,
  Filter,
  Terminal,
  Database,
  Cpu,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const {
    users,
    conversations,
    deleteUser,
    exportLeadsToCSV,
    broadcastMessage,
  } = useChatStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Filter Logic for Managing Large User Bases
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [users, searchQuery]);

  if (!isHydrated) return null;

  const totalMessages = conversations.reduce(
    (acc, c) => acc + (c.messages?.length || 0),
    0,
  );

  const handleBroadcast = () => {
    const msg = prompt("ENTER GLOBAL NEURAL BROADCAST MESSAGE:");
    if (msg) {
      broadcastMessage(msg);
      alert("Broadcast transmitted to all active nodes.");
    }
  };

  return (
    <div className="p-6 lg:p-12 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-[#0a0a0c] text-emerald-500 font-mono">
      {/* --- INDUSTRIAL HEADER --- */}
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
          <p className="text-emerald-800 text-[10px] font-bold tracking-[0.2em] uppercase mt-2">
            Enterprise Node Management // v2.5.0
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleBroadcast}
            className="group flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/50 px-6 py-3 rounded-sm text-emerald-500 text-xs font-black uppercase hover:bg-emerald-500 hover:text-black transition-all"
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

      {/* --- CORE SYSTEM METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111114] border-l-2 border-emerald-500 p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase text-emerald-800 font-black mb-2">
              Live Nodes
            </p>
            <Users size={16} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-white leading-none">
            {users.length}
          </p>
          <div className="mt-2 w-full bg-emerald-900/20 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[65%]" />
          </div>
        </div>

        <div className="bg-[#111114] border-l-2 border-blue-500 p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase text-blue-800 font-black mb-2">
              Packet Traffic
            </p>
            <Activity size={16} className="text-blue-500" />
          </div>
          <p className="text-3xl font-black text-white leading-none">
            {totalMessages}
          </p>
          <p className="text-[9px] text-blue-900 mt-2 font-bold tracking-widest uppercase">
            Total System Messages
          </p>
        </div>

        <div className="bg-[#111114] border-l-2 border-amber-500 p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase text-amber-800 font-black mb-2">
              CPU Load
            </p>
            <Cpu size={16} className="text-amber-500" />
          </div>
          <p className="text-3xl font-black text-white leading-none">0.04%</p>
          <p className="text-[9px] text-amber-900 mt-2 font-bold tracking-widest uppercase">
            Stable Processing
          </p>
        </div>

        <div className="bg-[#111114] border-l-2 border-emerald-500 p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase text-emerald-800 font-black mb-2">
              Firewall
            </p>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-500 leading-none">
            ACTIVE
          </p>
          <p className="text-[9px] text-emerald-900 mt-2 font-bold tracking-widest uppercase">
            Tier 4 Integrity
          </p>
        </div>
      </div>

      {/* --- USER REGISTRY (TERMINAL STYLE) --- */}
      <div className="bg-[#0d0d0f] border border-white/5 shadow-2xl rounded-sm overflow-hidden">
        <div className="p-4 bg-emerald-500/5 border-b border-emerald-500/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900"
              size={16}
            />
            <input
              type="text"
              placeholder="QUERY SUBJECT_ID OR ALIAS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-emerald-900/30 rounded-sm py-3 pl-12 pr-4 text-xs font-mono text-emerald-500 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-emerald-900"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800 uppercase">
              <Filter size={14} /> Nodes Detected: {filteredUsers.length}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase text-emerald-900 tracking-[0.2em] border-b border-white/5">
                <th className="p-6">Index_ID</th>
                <th className="p-6">Identity_Designation</th>
                <th className="p-6">Access_Level</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Protocol_Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className="group hover:bg-emerald-500/[0.03] transition-colors"
                >
                  <td className="p-6 font-mono text-emerald-900 text-xs">
                    0x00{idx + 1}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-sm border flex items-center justify-center font-black",
                          user.role === "admin"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
                        )}
                      >
                        {user.role === "admin" ? (
                          <Crown size={18} />
                        ) : (
                          user.name[0]
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          {user.name}
                          {user.role === "admin" && (
                            <span className="bg-amber-500/10 text-amber-500 text-[8px] px-2 py-0.5 border border-amber-500/20 font-black tracking-widest italic">
                              ROOT_USER
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-emerald-900 font-mono lowercase">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-900/10 border border-emerald-900/30 px-3 py-1 rounded-sm uppercase tracking-tighter">
                      {user.occupation || "Standard_Node"}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        Connected
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      {user.role !== "admin" ? (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `TERMINATE NEURAL IDENTITY: ${user.name}?`,
                              )
                            )
                              deleteUser(user.id);
                          }}
                          className="bg-red-500/5 text-red-900 border border-red-950 px-4 py-2 rounded-sm text-[9px] font-black uppercase hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                        >
                          Execute_Delete
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600/30 text-[9px] font-black uppercase tracking-widest pr-4">
                          <ShieldCheck size={12} /> Protected Node
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER LOG */}
      <div className="pt-8 border-t border-emerald-900/30 text-[9px] text-emerald-900 flex justify-between items-center uppercase tracking-[0.3em]">
        <span>System Time: {new Date().toLocaleTimeString()}</span>
        <span className="animate-pulse italic">
          Awaiting Management Command...
        </span>
      </div>
    </div>
  );
}

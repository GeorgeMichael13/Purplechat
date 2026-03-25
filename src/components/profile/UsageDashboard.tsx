"use client";

import React from "react";
import { useChatStore } from "@/store/chatStore";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Zap, Target, BarChart3, Clock, Cpu } from "lucide-react";

export default function UsageDashboard() {
  const { usageCount, maxLimit, getUsageStats } = useChatStore();
  const stats = getUsageStats();

  // Data for Donut Chart (Stats Overview)
  const donutData = [
    { name: "Used", value: usageCount, color: "#7c3aed" }, // Violet
    {
      name: "Remaining",
      value: Math.max(0, maxLimit - usageCount),
      color: "#1e293b",
    }, // Dark Slate
  ];

  // Data for Radial Chart (Usage Analytics)
  const radialData = [
    { name: "Usage", value: (usageCount / maxLimit) * 100, fill: "#f0abfc" }, // Fuchsia
  ];

  // Data for Mode breakdown (Donut)
  const modeData = Object.entries(stats.promptsByMode)
    .map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }))
    .filter((d) => d.value > 0);

  const COLORS = ["#8b5cf6", "#d946ef", "#06b6d4", "#10b981", "#f59e0b"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {/* 1. CIRCULAR PROGRESS (AI RESPONSES / QUOTA) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border-2 border-white dark:border-white/5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden h-[380px]" // Fixed height added
      >
        <div className="absolute top-4 left-6 flex items-center gap-2">
          <Cpu size={14} className="text-violet-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Quota Engine
          </span>
        </div>

        {/* Parent container for Recharts needs min-h-0 and flex-1 */}
        <div className="relative w-48 h-48 min-h-0 flex-1 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="80%"
              outerRadius="100%"
              barSize={12}
              data={radialData}
              startAngle={90}
              endAngle={450}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar background dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black dark:text-white">
              {usageCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Prompts Sent
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-bold text-slate-500">
            Daily limit: <span className="text-violet-500">{maxLimit}</span>
          </p>
        </div>
      </motion.div>

      {/* 2. RADIAL ANALYTICS (EFFICIENCY / REMAINING) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border-2 border-white dark:border-white/5 shadow-2xl relative overflow-hidden h-[380px]" // Fixed height added
      >
        <div className="absolute top-4 left-6 flex items-center gap-2">
          <Target size={14} className="text-fuchsia-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Usage Analytics
          </span>
        </div>

        {/* min-h-0 ensures ResponsiveContainer can measure itself */}
        <div className="h-48 w-full mt-4 flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {donutData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="none"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between items-center px-4 mb-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Available
            </p>
            <p className="text-xl font-black text-emerald-500">
              {maxLimit - usageCount}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Burn Rate
            </p>
            <p className="text-xl font-black text-fuchsia-500">
              {stats.usagePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* 3. DONUT OVERVIEW (MODE BREAKDOWN) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border-2 border-white dark:border-white/5 shadow-2xl relative h-[380px] flex flex-col" // Fixed height added
      >
        <div className="absolute top-4 left-6 flex items-center gap-2">
          <BarChart3 size={14} className="text-cyan-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Mode Breakdown
          </span>
        </div>

        {modeData.length > 0 ? (
          <div className="h-48 w-full mt-4 flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeData}
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  stroke="none"
                >
                  {modeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex-1 flex items-center justify-center text-slate-500 font-bold text-xs uppercase tracking-widest">
            No Data Recorded
          </div>
        )}

        <div className="mt-auto pb-2 space-y-2">
          {modeData.slice(0, 3).map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-slate-400">{item.name}</span>
              </div>
              <span className="dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import React from "react";
import { Search, Database, Cpu, User } from "lucide-react";

interface TopbarProps {
  repoName: string | null;
  onOpenCommandPalette: () => void;
  selectedModel: string;
}

export default function Topbar({
  repoName,
  onOpenCommandPalette,
  selectedModel
}: TopbarProps) {
  return (
    <header className="h-14 border-b border-[#18181b] bg-[#09090b] flex items-center justify-between px-6 font-mono text-xs select-none">
      {/* Left section: Repo selector */}
      <div className="flex items-center gap-4">
        <span className="text-zinc-500 font-semibold tracking-wider">WORKSPACE:</span>
        <div className="flex items-center gap-2 border border-[#18181b] bg-[#121214] px-3 py-1.5 rounded text-zinc-300 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {repoName || "Select Repository"}
        </div>
      </div>

      {/* Middle section: Global search palette button (Raycast style) */}
      <div className="flex-1 max-w-md mx-8">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between bg-[#121214] border border-[#18181b] hover:border-zinc-700 text-zinc-500 px-4 py-2 rounded-lg transition-all text-left group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 group-hover:text-zinc-300 transition-colors" />
            <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">Search files or run scans...</span>
          </div>
          <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded font-bold font-mono">
            Ctrl + K
          </span>
        </button>
      </div>

      {/* Right section: System state & Profile */}
      <div className="flex items-center gap-6">
        {/* Active Database */}
        <div className="hidden sm:flex items-center gap-2 text-zinc-400">
          <Database className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] tracking-wide">SQLITE // IN-MEM DB</span>
        </div>

        {/* Selected Model */}
        <div className="flex items-center gap-2 text-zinc-400">
          <Cpu className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] tracking-wide text-zinc-400 font-semibold">{selectedModel}</span>
        </div>

        {/* User profile */}
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-[#27272a] flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer hover:border-zinc-500 transition-colors">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    </header>
  );
}

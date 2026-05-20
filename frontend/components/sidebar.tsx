"use client";

import React, { useState } from "react";
import { MessageSquare, Network, ShieldAlert, Database, Sliders, Upload, RefreshCw, Loader2, GitBranch } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRepoId: string | null;
  repoName: string | null;
  indexingStatus: { status: string; progress: number; current_step: string } | null;
  onIndexRepo: (url: string) => void;
  onReindex: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeRepoId,
  repoName,
  indexingStatus,
  onIndexRepo,
  onReindex
}: SidebarProps) {
  const [showModal, setShowModal] = useState(false);
  const [gitUrl, setGitUrl] = useState("");

  const menuItems = [
    { id: "chat", label: "AI Copilot", icon: MessageSquare },
    { id: "architecture", label: "Architecture", icon: Network },
    { id: "security", label: "Security Scanning", icon: ShieldAlert },
    { id: "memory", label: "Repo Memory", icon: Database },
  ];

  const handleIndexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gitUrl.trim()) {
      onIndexRepo(gitUrl);
      setShowModal(false);
      setGitUrl("");
    }
  };

  const handleIndexSelf = () => {
    onIndexRepo("self");
    setShowModal(false);
  };

  return (
    <aside className="w-64 border-r border-[#18181b] bg-[#09090b] flex flex-col justify-between shrink-0 font-mono text-xs">
      <div className="flex flex-col gap-6 p-4">
        {/* Brand logo */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            A
          </div>
          <span className="tracking-widest text-[#f4f4f5] font-semibold text-xs">ANTIGRAVITY</span>
        </div>

        {/* Repository status card */}
        <div className="border border-[#18181b] bg-[#121214]/50 rounded-lg p-3.5 relative overflow-hidden">
          {activeRepoId ? (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-zinc-500 tracking-wider">ACTIVE REPOSITORY</span>
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-zinc-200 truncate font-semibold">{repoName || "Self Source"}</span>
              </div>
              <button
                onClick={onReindex}
                className="mt-2 inline-flex items-center justify-center gap-1.5 border border-[#27272a] hover:border-zinc-500 bg-[#09090b] text-zinc-400 hover:text-zinc-100 py-1.5 rounded transition-all duration-200"
              >
                <RefreshCw className="w-3 h-3" />
                RE-INDEX
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-center py-2">
              <span className="text-[10px] text-zinc-500">NO CODEBASE INDEXED</span>
              <button
                onClick={() => setShowModal(true)}
                className="mt-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 rounded transition-all duration-200 shadow-[0_2px_10px_rgba(59,130,246,0.15)]"
              >
                <Upload className="w-3.5 h-3.5" />
                INGEST REPOSITORY
              </button>
            </div>
          )}

          {/* Loader status */}
          {indexingStatus && indexingStatus.status === "indexing" && (
            <div className="absolute inset-0 bg-[#09090b]/90 flex flex-col items-center justify-center p-3 text-center border border-blue-500/20">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin mb-1.5" />
              <span className="text-[9px] text-blue-400 tracking-widest font-bold">INDEXING ({indexingStatus.progress}%)</span>
              <span className="text-[8px] text-zinc-500 truncate w-full mt-0.5">{indexingStatus.current_step}</span>
            </div>
          )}
        </div>

        {/* Tab menu */}
        <div className="flex flex-col gap-1">
          <span className="px-2 text-[10px] text-zinc-500 tracking-wider mb-2">INTELLIGENCE</span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 text-left ${
                  isActive
                    ? "border-blue-500/20 bg-blue-950/10 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#121214]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / System profile */}
      <div className="border-t border-[#18181b] p-4 flex flex-col gap-2.5">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
            activeTab === "settings" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <div className="flex items-center gap-2.5 px-3 py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500 tracking-wider">COGNITIVE ENGINE ALIVE</span>
        </div>
      </div>

      {/* Ingestion overlay modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-[#18181b] rounded-lg p-6 shadow-[0_24px_50px_rgba(0,0,0,0.8)] relative">
            <h3 className="text-sm font-bold text-white font-mono mb-2 tracking-wider">INGEST NEW REPOSITORY</h3>
            <p className="text-zinc-400 text-xs font-light mb-6">
              Enter a GitHub Repository URL, or trigger a self-index of the Copilot Backend to analyze its AST structures.
            </p>

            <form onSubmit={handleIndexSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">GITHUB URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/username/repository"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  className="bg-[#121214] border border-[#18181b] text-zinc-100 placeholder-zinc-600 text-xs rounded p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleIndexSelf}
                  className="px-4 py-2 border border-[#27272a] hover:border-zinc-500 bg-zinc-900/30 text-zinc-300 text-xs font-mono rounded transition-colors"
                >
                  INDEX SELF SOURCE
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs font-mono rounded transition-colors"
                >
                  INGEST CODE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}

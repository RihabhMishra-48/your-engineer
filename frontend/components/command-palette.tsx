"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Terminal, Shield, Network, Folder, X } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandSelect: (commandId: string, payload?: any) => void;
  filesList: string[];
}

export default function CommandPalette({
  isOpen,
  onClose,
  onCommandSelect,
  filesList
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const systemCommands = [
    { id: "run-security", label: "Run Static Security Vulnerability Scan", icon: Shield, shortcut: "S" },
    { id: "show-graph", label: "Render Interactive Dependency Network", icon: Network, shortcut: "G" },
    { id: "show-chat", label: "Navigate back to AI Assistant Console", icon: Terminal, shortcut: "C" },
  ];

  // Filter commands and files
  const filteredCommands = systemCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFiles = filesList.filter(file =>
    file.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-[15vh]">
      <div className="w-full max-w-lg bg-[#0c0c0e] border border-[#18181b] rounded-lg shadow-[0_30px_70px_rgba(0,0,0,0.9)] overflow-hidden font-mono text-xs">
        {/* Search header */}
        <div className="flex items-center gap-3.5 border-b border-[#18181b] px-4 py-3.5 relative">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search codebase files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none font-sans text-xs"
          />
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1 scrollbar-none select-none">
          {/* System Commands section */}
          {filteredCommands.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest px-2 py-1.5 font-bold">SYSTEM COMMANDS</span>
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      onCommandSelect(cmd.id);
                      onClose();
                      setSearch("");
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded hover:bg-zinc-800/60 text-left text-zinc-300 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-zinc-500" />
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <span className="text-[9px] border border-zinc-800 bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded font-bold">
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Files section */}
          {filteredFiles.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-2.5">
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest px-2 py-1.5 font-bold">WORKSPACE FILES</span>
              {filteredFiles.slice(0, 15).map((filePath) => (
                <button
                  key={filePath}
                  onClick={() => {
                    onCommandSelect("open-file", filePath);
                    onClose();
                    setSearch("");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded hover:bg-zinc-800/60 text-left text-zinc-300 hover:text-white transition-all truncate"
                >
                  <Folder className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="truncate">{filePath}</span>
                </button>
              ))}
            </div>
          )}

          {filteredCommands.length === 0 && filteredFiles.length === 0 && (
            <div className="text-zinc-600 font-mono text-[10px] p-6 text-center">
              No matching commands or files discovered.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

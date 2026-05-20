"use client";

import React, { useEffect, useRef } from "react";
import { Terminal as LucideTerminal, Trash2 } from "lucide-react";

interface TerminalPanelProps {
  logs: string[];
  onClearLogs: () => void;
}

export default function TerminalPanel({ logs, onClearLogs }: TerminalPanelProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-[#070709] text-[#e4e4e7] font-mono text-xs border border-[#18181b] rounded-lg overflow-hidden select-none">
      {/* Terminal Header */}
      <div className="h-9 border-b border-[#18181b] bg-[#0c0c0e] flex items-center justify-between px-4 text-zinc-500">
        <div className="flex items-center gap-2 text-[10px]">
          <LucideTerminal className="w-3.5 h-3.5 text-blue-400" />
          <span>COGNITIVE LOG CONSOLE // xterm.sh</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onClearLogs}
            className="hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded transition-colors"
            title="Clear Console Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 text-[9px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
            <span>BAUD: 115200</span>
          </div>
        </div>
      </div>

      {/* Terminal Stream Console */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5 scrollbar-thin bg-black">
        {logs.length === 0 ? (
          <div className="text-zinc-700 text-[10px] py-4 select-none">
            antigravity:~$ system initialized. awaiting codebase ingestion logs...
          </div>
        ) : (
          logs.map((log, idx) => {
            // Highlighting based on log headers
            let color = "text-zinc-400";
            if (log.startsWith("✓") || log.includes("success") || log.includes("ACTIVE")) {
              color = "text-emerald-400";
            } else if (log.startsWith("!") || log.includes("fail") || log.includes("error")) {
              color = "text-red-400 font-semibold";
            } else if (log.startsWith("[INDEXING]") || log.startsWith("[PARSING]")) {
              color = "text-blue-400";
            } else if (log.startsWith("[AGENT]")) {
              color = "text-indigo-400";
            }
            
            return (
              <div key={idx} className={`leading-relaxed font-mono text-[10px] whitespace-pre-wrap ${color}`}>
                {log}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}

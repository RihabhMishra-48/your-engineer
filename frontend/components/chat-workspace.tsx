"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Cpu, User, Check, Loader2, FileCode, CornerDownLeft } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Citation {
  file_path: string;
  score: number;
  snippet: string;
}

interface ChatWorkspaceProps {
  activeRepoId: string | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  timelineEvents: string[];
  streamingToken: string;
  citations: Citation[];
  onCitationClick: (filePath: string) => void;
}

export default function ChatWorkspace({
  activeRepoId,
  messages,
  onSendMessage,
  timelineEvents,
  streamingToken,
  citations,
  onCitationClick
}: ChatWorkspaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && activeRepoId) {
      onSendMessage(input);
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingToken, timelineEvents]);

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#09090b] overflow-hidden">
      {/* Messages listing */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto p-4 select-none">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-[#18181b] flex items-center justify-center text-zinc-500 mb-6 glow-card">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="font-mono text-xs font-bold text-[#f4f4f5] tracking-wider mb-2">INTELLIGENT REPO ASSISTANT</h4>
            <p className="text-zinc-500 text-xs font-light leading-relaxed">
              Ask questions about imports, classes, functions, or let me trace authentication workflows, refactor code, and scan security risks across the repository.
            </p>
            {!activeRepoId && (
              <span className="text-[10px] text-blue-500 font-mono mt-4 border border-blue-500/20 bg-blue-950/20 px-3 py-1 rounded">
                ← PLEASE INGEST A REPOSITORY FIRST
              </span>
            )}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex gap-4 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 font-bold ${
                  isUser 
                    ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                    : "bg-blue-950/20 border-blue-500/20 text-blue-400"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className="flex flex-col gap-2">
                  <div className={`rounded-lg p-4 border text-xs leading-relaxed font-light ${
                    isUser
                      ? "bg-zinc-900/50 border-[#18181b] text-zinc-200"
                      : "bg-[#121214]/40 border-[#18181b] text-zinc-300 shadow-sm"
                  }`}>
                    {/* Render message formatting lines */}
                    <div className="whitespace-pre-line font-sans prose prose-invert max-w-none">
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live streaming bubble (assistant response currently building) */}
        {streamingToken && (
          <div className="flex gap-4 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-blue-950/20 border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="rounded-lg p-4 border border-[#18181b] bg-[#121214]/40 text-xs leading-relaxed font-light text-zinc-300 font-sans whitespace-pre-line">
                {streamingToken}
                <span className="w-1.5 h-3 bg-blue-500 inline-block animate-pulse ml-1 align-middle" />
              </div>
            </div>
          </div>
        )}

        {/* Live Multi-Agent Reasoning Timeline */}
        {timelineEvents.length > 0 && (
          <div className="border-l border-[#18181b] ml-4 pl-6 my-4 flex flex-col gap-3 font-mono text-[10px]">
            {timelineEvents.map((evt, idx) => {
              const isLast = idx === timelineEvents.length - 1;
              return (
                <div key={idx} className="flex items-center gap-3.5 text-zinc-500">
                  {isLast && !streamingToken ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                  <span className={isLast && !streamingToken ? "text-blue-400 font-bold" : "text-zinc-400"}>
                    {evt}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* File Citations row inside Assistant results */}
        {!streamingToken && citations.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-2">RETRIEVED CODE CITATIONS</span>
            <div className="flex flex-wrap gap-2.5 px-2">
              {citations.map((cite, idx) => (
                <button
                  key={idx}
                  onClick={() => onCitationClick(cite.file_path)}
                  className="flex items-center gap-2 border border-[#18181b] bg-[#121214] hover:border-blue-500/30 hover:bg-blue-950/5 text-zinc-400 hover:text-blue-400 px-3 py-2 rounded-lg font-mono text-[10px] transition-all"
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span>{cite.file_path.split('/').pop()}</span>
                  <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1 rounded">RRF: {cite.score}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="border-t border-[#18181b] p-4 bg-[#09090b]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
          <input
            type="text"
            placeholder={activeRepoId ? "Ask questions about code structure, security, or tracing..." : "Ingest repository to unlock assistant workspace..."}
            disabled={!activeRepoId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-[#121214] border border-[#18181b] text-zinc-200 placeholder-zinc-600 rounded-lg pl-4 pr-24 py-3.5 text-xs focus:outline-none focus:border-blue-500 transition-all font-sans"
          />
          <div className="absolute right-2 flex items-center gap-1.5 font-mono">
            <span className="hidden md:inline text-[9px] text-zinc-500 mr-2 uppercase tracking-wide">ENTER TO SEND</span>
            <button
              type="submit"
              disabled={!input.trim() || !activeRepoId}
              className="w-8 h-8 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 text-white disabled:text-zinc-500 flex items-center justify-center transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

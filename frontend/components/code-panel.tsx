"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Folder, File, ChevronRight, ChevronDown, X, Cpu, FileText } from "lucide-react";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

interface CodePanelProps {
  repoId: string | null;
  fileTree: FileNode[];
  activeFilePath: string | null;
  activeFileContent: string | null;
  openedTabs: string[];
  onOpenFile: (filePath: string) => void;
  onCloseTab: (filePath: string) => void;
}

export default function CodePanel({
  repoId,
  fileTree,
  activeFilePath,
  activeFileContent,
  openedTabs,
  onOpenFile,
  onCloseTab
}: CodePanelProps) {
  // Map files extension to monaco-supported language identifiers
  const getLanguage = (filePath: string | null) => {
    if (!filePath) return "plaintext";
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case "py": return "python";
      case "js": case "jsx": return "javascript";
      case "ts": case "tsx": return "typescript";
      case "go": return "go";
      case "rs": return "rust";
      case "java": return "java";
      case "json": return "json";
      case "html": return "html";
      case "css": return "css";
      case "md": return "markdown";
      default: return "plaintext";
    }
  };

  // Node component for recursive tree view rendering
  const FileTreeNode = ({ node }: { node: FileNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isDir = node.type === "directory";
    const isOpened = activeFilePath === node.path;

    if (isDir) {
      return (
        <div className="flex flex-col select-none">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 py-1 px-1 text-zinc-400 hover:text-zinc-200 text-left font-mono text-[11px] transition-colors"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
          {isOpen && node.children && (
            <div className="pl-3.5 border-l border-[#18181b] ml-2.5 flex flex-col gap-0.5 mt-0.5">
              {node.children.map((child, idx) => (
                <FileTreeNode key={idx} node={child} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={() => onOpenFile(node.path)}
        className={`flex items-center gap-2 py-1 px-2.5 rounded text-left font-mono text-[11px] transition-all truncate ${
          isOpened
            ? "bg-zinc-800 text-blue-400 font-semibold"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
        }`}
      >
        <File className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden border border-[#18181b] bg-[#0c0c0e] rounded-lg">
      {/* File Explorer Sidebar */}
      <div className="w-48 border-r border-[#18181b] flex flex-col shrink-0 overflow-y-auto p-3 scrollbar-none select-none">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest px-2 mb-3">WORKSPACE FILES</span>
        {fileTree.length === 0 ? (
          <div className="text-zinc-600 font-mono text-[10px] p-2 text-center">
            No active codebase files.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {fileTree.map((node, idx) => (
              <FileTreeNode key={idx} node={node} />
            ))}
          </div>
        )}
      </div>

      {/* Editor Main Section */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
        {/* Editor Tabs Bar */}
        <div className="h-10 border-b border-[#18181b] bg-[#09090b] flex items-center overflow-x-auto scrollbar-none font-mono text-[10px] select-none">
          {openedTabs.map((tabPath) => {
            const isTabActive = activeFilePath === tabPath;
            return (
              <div
                key={tabPath}
                className={`h-full flex items-center gap-2 px-4 border-r border-[#18181b] cursor-pointer transition-colors relative group ${
                  isTabActive
                    ? "bg-[#0c0c0e] text-blue-400 font-semibold"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-[#121214]/30"
                }`}
                onClick={() => onOpenFile(tabPath)}
              >
                <FileText className="w-3.5 h-3.5 text-zinc-600" />
                <span>{tabPath.split("/").pop()}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tabPath);
                  }}
                  className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all ml-1.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Editor Workspace */}
        <div className="flex-1 relative overflow-hidden bg-[#0c0c0e]">
          {activeFilePath ? (
            <Editor
              height="100%"
              theme="vs-dark"
              language={getLanguage(activeFilePath)}
              value={activeFileContent || ""}
              options={{
                readOnly: true,
                minimap: { enabled: true },
                fontSize: 12,
                fontFamily: "JetBrains Mono, monospace",
                lineNumbers: "on",
                cursorBlinking: "smooth",
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible",
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6
                },
                guides: { indentation: true },
                padding: { top: 8, bottom: 8 }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4 font-mono select-none">
              <Cpu className="w-6 h-6 text-zinc-600 mb-4 animate-pulse" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">MONACO CODE WORKSPACE</span>
              <span className="text-[9px] text-zinc-500 mt-2 font-light">
                Select a file from the explorer sidebar tree, click a code citation inside AI Chat, or open files using Raycast palette to display source code.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

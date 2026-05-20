"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import ChatWorkspace from "@/components/chat-workspace";
import CodePanel from "@/components/code-panel";
import GraphPanel from "@/components/graph-panel";
import TerminalPanel from "@/components/terminal-panel";
import CommandPalette from "@/components/command-palette";
import { ShieldAlert, Database, HelpCircle, Loader2 } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function Dashboard() {
  // Navigation states
  const [activeTab, setActiveTab] = useState("chat"); // chat, architecture, security, memory, settings
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string | null>(null);
  
  // Database datasets
  const [fileTree, setFileTree] = useState([]);
  const [flatFiles, setFlatFiles] = useState<string[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string | null>(null);
  const [openedTabs, setOpenedTabs] = useState<string[]>([]);
  
  // React Flow graph states
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  
  // Security reports
  const [securityReports, setSecurityReports] = useState([]);
  const [scanningSecurity, setScanningSecurity] = useState(false);
  
  // Memory
  const [memories, setMemories] = useState([]);
  
  // Chat console states
  const [messages, setMessages] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<string[]>([]);
  const [streamingToken, setStreamingToken] = useState("");
  const [citations, setCitations] = useState([]);
  
  // Terminal logs
  const [logs, setLogs] = useState<string[]>([]);
  
  // Command palette
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemini 3.5 Flash");
  
  // Index polling state
  const [indexingStatus, setIndexingStatus] = useState<any>(null);

  // Keyboard shortcut Ctrl + K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Poll upload status when indexing
  useEffect(() => {
    let intervalId: any;
    if (indexingStatus && indexingStatus.status === "indexing") {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/upload-status`);
          const data = await res.json();
          setIndexingStatus(data);
          
          // Append log to console
          setLogs(prev => {
            const last = prev[prev.length - 1];
            if (last !== data.current_step) {
              return [...prev, `[INDEXING] ${data.current_step}`];
            }
            return prev;
          });

          if (data.status === "active") {
            clearInterval(intervalId);
            setActiveRepoId(data.repo_id);
            setLogs(prev => [...prev, `✓ Ingest sandbox active: ${data.repo_id}`, `✓ Symbol parsing and dependency graph structures created successfully!`]);
            // Fetch file explorer & graph edges
            fetchWorkspaceContent(data.repo_id);
          } else if (data.status === "failed") {
            clearInterval(intervalId);
            setLogs(prev => [...prev, `! Index failure: ${data.current_step}`]);
          }
        } catch (err) {
          console.error("Failed to poll status", err);
        }
      }, 1500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [indexingStatus]);

  const fetchWorkspaceContent = async (repoId: string) => {
    try {
      // 1. Files Explorer tree
      const filesRes = await fetch(`${BACKEND_URL}/api/files?repo_id=${repoId}`);
      const tree = await filesRes.json();
      setFileTree(tree);
      
      // Flatten files path lists for command palette jumps
      const paths: string[] = [];
      const flatten = (nodes: any[]) => {
        for (const n of nodes) {
          if (n.type === "file") paths.push(n.path);
          else if (n.children) flatten(n.children);
        }
      };
      flatten(tree);
      setFlatFiles(paths);

      // 2. React Flow dependencies
      const graphRes = await fetch(`${BACKEND_URL}/api/graph?repo_id=${repoId}`);
      const graph = await graphRes.json();
      setGraphNodes(graph.nodes || []);
      setGraphEdges(graph.edges || []);

      // 3. Security Reports
      const secRes = await fetch(`${BACKEND_URL}/api/security-report?repo_id=${repoId}`);
      const sec = await secRes.json();
      setSecurityReports(sec || []);

      // 4. Memory
      const memRes = await fetch(`${BACKEND_URL}/api/memory?repo_id=${repoId}`);
      const mem = await memRes.json();
      setMemories(mem || []);

    } catch (err) {
      console.error("Failed to fetch workspace contents", err);
    }
  };

  const handleIndexRepo = async (url: string) => {
    setLogs(prev => [...prev, `antigravity:~$ initiating repository ingestion pipeline...`]);
    try {
      const formData = new FormData();
      if (url && url !== "self") {
        formData.append("url", url);
      } else {
        formData.append("url", "self");
      }

      const res = await fetch(`${BACKEND_URL}/api/upload-repo`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      setRepoName(data.name);
      setIndexingStatus({
        status: "indexing",
        progress: 5,
        current_step: "Initializing sandbox environment..."
      });
      setLogs(prev => [...prev, `[INDEXING] Repository sandbox initialized: ${data.name}`]);
    } catch (err) {
      setLogs(prev => [...prev, `! Ingestion failed to execute: ${err}`]);
    }
  };

  const handleReindex = async () => {
    if (!activeRepoId) return;
    setLogs(prev => [...prev, `antigravity:~$ forcing re-index for repo: ${activeRepoId}`]);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reindex?repo_id=${activeRepoId}`);
      const data = await res.json();
      setIndexingStatus({
        status: "indexing",
        progress: 5,
        current_step: "Rebuilding indexes..."
      });
    } catch (err) {
      setLogs(prev => [...prev, `! Re-index request failed: ${err}`]);
    }
  };

  const handleOpenFile = async (filePath: string) => {
    if (!activeRepoId) return;
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/file-content?repo_id=${activeRepoId}&file_path=${encodeURIComponent(filePath)}`
      );
      const data = await res.json();
      setActiveFilePath(filePath);
      setActiveFileContent(data.content);
      
      // Update opened tabs
      if (!openedTabs.includes(filePath)) {
        setOpenedTabs(prev => [...prev, filePath]);
      }
      
      setLogs(prev => [...prev, `[MONACO] Opened workspace file: /${filePath}`]);
    } catch (err) {
      console.error("Failed to load file contents", err);
    }
  };

  const handleCloseTab = (filePath: string) => {
    setOpenedTabs(prev => prev.filter(p => p !== filePath));
    if (activeFilePath === filePath) {
      const remaining = openedTabs.filter(p => p !== filePath);
      if (remaining.length > 0) {
        handleOpenFile(remaining[remaining.length - 1]);
      } else {
        setActiveFilePath(null);
        setActiveFileContent(null);
      }
    }
  };

  const handleSendMessage = async (queryText: string) => {
    if (!activeRepoId) return;

    // Append User Message
    const userMsg = { role: "user", content: queryText };
    setMessages(prev => [...prev, userMsg]);
    setTimelineEvents([]);
    setStreamingToken("");
    setCitations([]);

    setLogs(prev => [...prev, `[AGENT] User query: "${queryText}"`, `[AGENT] Spawning specialized collaborative agents scratchpad...`]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, repo_id: activeRepoId })
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawJSON = line.substring(6).trim();
            if (!rawJSON) continue;
            
            try {
              const payload = JSON.parse(rawJSON);
              if (payload.type === "timeline") {
                setTimelineEvents(prev => [...prev, payload.event]);
                setLogs(prev => [...prev, `[AGENT] ${payload.event}`]);
              } else if (payload.type === "token") {
                setStreamingToken(prev => prev + payload.content);
              } else if (payload.type === "citations") {
                setCitations(payload.citations || []);
              } else if (payload.type === "error") {
                setMessages(prev => [...prev, { role: "assistant", content: `Error: ${payload.message}` }]);
              }
            } catch (err) {
              console.error("SSE parse error", err, rawJSON);
            }
          }
        }
      }

      // Finish streaming, append Assistant message
      setMessages(prev => {
        const assistantMsg = { role: "assistant", content: streamingToken };
        return [...prev, assistantMsg];
      });
      setStreamingToken("");
      setLogs(prev => [...prev, `✓ AI agents completed workflow successfully.`]);

    } catch (err) {
      console.error("Chat SSE stream failed", err);
      setLogs(prev => [...prev, `! Assistant stream exception: ${err}`]);
    }
  };

  const handleCommandPaletteSelect = (cmdId: string, payload?: any) => {
    if (cmdId === "run-security") {
      setActiveTab("security");
      triggerSecurityScan();
    } else if (cmdId === "show-graph") {
      setActiveTab("architecture");
    } else if (cmdId === "show-chat") {
      setActiveTab("chat");
    } else if (cmdId === "open-file" && payload) {
      handleOpenFile(payload);
    }
  };

  const triggerSecurityScan = async () => {
    if (!activeRepoId) return;
    setScanningSecurity(true);
    setLogs(prev => [...prev, `[SECURITY] Initiating vulnerability sweep...`]);
    try {
      const res = await fetch(`${BACKEND_URL}/api/security-report?repo_id=${activeRepoId}`);
      const sec = await res.json();
      setSecurityReports(sec || []);
      setLogs(prev => [...prev, `✓ Sweep completed. Discovered ${sec.length} vulnerability markers.`]);
    } catch (err) {
      console.error(err);
    } finally {
      setScanningSecurity(false);
    }
  };

  const clearConsoleLogs = () => {
    setLogs([]);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-[#e4e4e7] overflow-hidden selection:bg-blue-500/30 selection:text-blue-200">
      {/* Central Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeRepoId={activeRepoId}
          repoName={repoName}
          indexingStatus={indexingStatus}
          onIndexRepo={handleIndexRepo}
          onReindex={handleReindex}
        />

        {/* Workspace Central Block */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <Topbar
            repoName={repoName}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            selectedModel={selectedModel}
          />

          {/* Core Panels Grid (Double panels IDE style) */}
          <div className="flex-1 flex p-4 gap-4 overflow-hidden">
            {/* Left Central Panel: Chat / Reports */}
            <div className="w-[45%] flex flex-col overflow-hidden">
              {activeTab === "chat" && (
                <ChatWorkspace
                  activeRepoId={activeRepoId}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  timelineEvents={timelineEvents}
                  streamingToken={streamingToken}
                  citations={citations}
                  onCitationClick={handleOpenFile}
                />
              )}

              {activeTab === "architecture" && (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-[#18181b] bg-[#0c0c0e] rounded-lg font-mono text-xs select-none">
                  <Database className="w-6 h-6 text-zinc-600 mb-4" />
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest">SYSTEM ARCHITECTURE SUMMARY</span>
                  <p className="text-zinc-500 text-[10px] font-light mt-2 max-w-sm leading-relaxed">
                    View the parsed import topologies of your codebase in the interactive React Flow panel located on the right. Zoom and trace module interactions.
                  </p>
                </div>
              )}

              {activeTab === "security" && (
                <div className="flex-1 flex flex-col bg-[#09090b] border border-[#18181b] rounded-lg overflow-hidden font-mono text-xs">
                  <div className="h-10 border-b border-[#18181b] bg-[#0c0c0e] flex items-center justify-between px-4 text-zinc-400 select-none">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      <span>SECURITY SCANNER AUDIT REPORT</span>
                    </div>
                    {activeRepoId && (
                      <button
                        onClick={triggerSecurityScan}
                        disabled={scanningSecurity}
                        className="text-[9px] border border-red-500/20 bg-red-950/20 text-red-400 px-2 py-0.5 rounded font-bold hover:bg-red-950/40 transition-colors"
                      >
                        {scanningSecurity ? "SCANNING..." : "TRIGGER AUDIT"}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
                    {securityReports.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-600">
                        <span>No vulnerability records loaded.</span>
                      </div>
                    ) : (
                      securityReports.map((report: any, idx) => (
                        <div key={idx} className="border border-red-950/30 bg-red-950/5 p-4 rounded-lg flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-red-400">[{report.severity}] {report.rule_id}</span>
                            <span className="text-[9px] text-zinc-500">{report.file_path}</span>
                          </div>
                          <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">{report.description}</p>
                          <div className="text-[10px] border-t border-red-950/20 pt-2 text-zinc-400 font-sans">
                            <span className="font-bold text-zinc-300">Remediation: </span>
                            {report.remediation}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "memory" && (
                <div className="flex-1 flex flex-col bg-[#09090b] border border-[#18181b] rounded-lg overflow-hidden font-mono text-xs">
                  <div className="h-10 border-b border-[#18181b] bg-[#0c0c0e] flex items-center px-4 text-zinc-400 select-none">
                    <Database className="w-3.5 h-3.5 text-blue-400 mr-2" />
                    <span>AGENT REPOSITORY MEMORIES</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
                    {memories.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-600">
                        <span>No memory records populated yet.</span>
                      </div>
                    ) : (
                      memories.map((mem: any, idx) => (
                        <div key={idx} className="border border-[#18181b] bg-[#121214]/50 p-4 rounded-lg flex flex-col gap-2">
                          <span className="text-[10px] text-zinc-500 tracking-wider">KEY: {mem.key}</span>
                          <p className="text-zinc-300 text-xs leading-relaxed font-light">{mem.value}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="flex-1 flex flex-col bg-[#09090b] border border-[#18181b] rounded-lg overflow-hidden font-mono text-xs p-6 gap-6">
                  <div>
                    <h3 className="font-bold text-white mb-1 uppercase tracking-wider">Settings</h3>
                    <p className="text-zinc-500 text-[10px] font-light">Customize your engineering workspace and AI cognitive engines.</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Cognitive Agent Model</label>
                      <select 
                        value={selectedModel} 
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-[#121214] border border-[#18181b] text-zinc-200 p-2.5 rounded text-xs focus:outline-none focus:border-blue-500 font-sans"
                      >
                        <option>Gemini 3.5 Flash</option>
                        <option>OpenAI GPT-4o</option>
                        <option>Gemini 1.5 Pro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Central Panel: Monaco / React Flow Visualizer */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Upper half: IDE (Monaco / React Flow toggled by active tab) */}
              <div className="flex-1 flex overflow-hidden">
                {activeTab === "architecture" ? (
                  <GraphPanel
                    repoId={activeRepoId}
                    nodes={graphNodes}
                    edges={graphEdges}
                    onNodeClick={handleOpenFile}
                  />
                ) : (
                  <CodePanel
                    repoId={activeRepoId}
                    fileTree={fileTree}
                    activeFilePath={activeFilePath}
                    activeFileContent={activeFileContent}
                    openedTabs={openedTabs}
                    onOpenFile={handleOpenFile}
                    onCloseTab={handleCloseTab}
                  />
                )}
              </div>

              {/* Lower half: Logs Terminal Panel */}
              <div className="h-[28%] shrink-0">
                <TerminalPanel logs={logs} onClearLogs={clearConsoleLogs} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Raycast style Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onCommandSelect={handleCommandPaletteSelect}
        filesList={flatFiles}
      />
    </div>
  );
}

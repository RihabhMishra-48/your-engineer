"use client";

import React, { useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from "reactflow";
import "reactflow/dist/style.css";
import { Network, ZoomIn } from "lucide-react";

interface GraphPanelProps {
  repoId: string | null;
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (filePath: string) => void;
}

export default function GraphPanel({
  repoId,
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick
}: GraphPanelProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync with initial graph updates from parent components
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden border border-[#18181b] bg-[#0c0c0e] rounded-lg relative">
      {/* Header Info */}
      <div className="h-10 border-b border-[#18181b] bg-[#09090b] flex items-center justify-between px-4 font-mono text-[10px] select-none text-zinc-400">
        <div className="flex items-center gap-2">
          <Network className="w-3.5 h-3.5 text-blue-400" />
          <span>REACT FLOW REPO IMPORT GRAPH</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
          <ZoomIn className="w-3 h-3" />
          <span>CLICK NODE TO JUMP TO CODE</span>
        </div>
      </div>

      {/* React Flow Viewport */}
      <div className="flex-1 relative bg-[#09090b]">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
          >
            <Background color="#27272a" gap={20} size={1} />
            <Controls className="react-flow-controls" style={{ background: "#121214", border: "1px solid #18181b", color: "#e4e4e7" }} />
            <MiniMap
              nodeColor={(node) => {
                return (node.data?.color as string) || "#3b82f6";
              }}
              maskColor="rgba(9, 9, 11, 0.7)"
              style={{ background: "#0c0c0e", border: "1px solid #18181b" }}
            />
          </ReactFlow>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4 font-mono select-none">
            <Network className="w-6 h-6 text-zinc-600 mb-4 animate-pulse" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">DEPENDENCY GRAPH VIEWPORT</span>
            <span className="text-[9px] text-zinc-500 mt-2 font-light">
              Ingest a codebase to automatically parse modules, compute import networks, and visualize interactive directed structures.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

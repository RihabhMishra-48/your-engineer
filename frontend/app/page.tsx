"use client";

import Link from "next/link";
import { ArrowRight, Terminal, Activity, Shield, Code, Cpu, Network } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] relative overflow-hidden flex flex-col justify-between selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background neon grid svg decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-30" />
      
      {/* Floating purple/blue neon glows */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[300px] bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[400px] bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar */}
      <header className="border-b border-[#18181b] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-white text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              A
            </div>
            <span className="font-mono tracking-widest text-[#f4f4f5] font-semibold text-sm">ANTIGRAVITY</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-normal">v1.0.0-BETA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">FEATURES</a>
            <a href="#architecture" className="hover:text-zinc-100 transition-colors">ARCHITECTURES</a>
            <a href="https://github.com" target="_blank" className="hover:text-zinc-100 transition-colors">DOCUMENTATION</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-xs font-mono border border-[#27272a] hover:border-zinc-500 bg-[#121214] text-zinc-300 hover:text-white px-4 py-2 rounded transition-all duration-200"
            >
              LAUNCH CONSOLE
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 w-full flex flex-col justify-center items-center py-24 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-950/20 text-blue-400 text-xs font-mono mb-8 tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.05)]">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            MULTI-AGENT COGNITIVE ENGINE ACTIVE
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
            Understand Any <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-400">
              Codebase Instantly
            </span>
          </h1>

          <p className="text-zinc-400 text-base sm:text-xl max-w-2xl font-light mb-12 leading-relaxed">
            AI-powered code intelligence with dynamic AST symbol parsing, visual graph-reasoning, and multi-agent repository memory.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/dashboard"
              className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-mono text-xs font-bold tracking-wider px-8 py-4 rounded shadow-[0_4px_25px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_35px_rgba(59,130,246,0.35)] transition-all duration-300 transform hover:scale-[1.02]"
            >
              LAUNCH COPILOT WORKSPACE
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features"
              className="inline-flex items-center gap-2 border border-[#27272a] hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-mono text-xs tracking-wider px-8 py-4 rounded transition-all duration-200"
            >
              EXPLORE CAPABILITIES
            </a>
          </div>
        </motion.div>

        {/* Animated dependency graph preview representation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, delay: 0.2 }}
          className="mt-20 w-full max-w-5xl rounded-lg border border-[#18181b] bg-[#121214]/50 backdrop-blur-sm p-4 relative shadow-[0_12px_40px_rgba(0,0,0,0.6)] glow-card"
        >
          <div className="flex items-center justify-between border-b border-[#18181b] pb-3 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="text-[10px] text-zinc-500 font-mono ml-3">dependency_graph_view.svg</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] border border-blue-500/20 bg-blue-950/20 text-blue-400 px-2 py-0.5 rounded font-mono">React Flow</span>
            </div>
          </div>
          
          <div className="h-[250px] w-full flex items-center justify-center relative overflow-hidden bg-zinc-950/20 rounded">
            <svg className="w-full h-full max-w-lg opacity-85" viewBox="0 0 500 200">
              {/* Nodes */}
              <circle cx="100" cy="100" r="14" fill="#121214" stroke="#10b981" strokeWidth="2" className="animate-pulse" />
              <circle cx="200" cy="50" r="14" fill="#121214" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="200" cy="150" r="14" fill="#121214" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="350" cy="100" r="14" fill="#121214" stroke="#06b6d4" strokeWidth="2" />
              <circle cx="450" cy="100" r="14" fill="#121214" stroke="#ef4444" strokeWidth="2" />
              
              {/* Animated Edges */}
              <path d="M 114 100 L 186 50" stroke="#18181b" strokeWidth="1.5" strokeDasharray="4" />
              <path d="M 114 100 L 186 150" stroke="#18181b" strokeWidth="1.5" strokeDasharray="4" />
              <path d="M 214 50 L 336 100" stroke="#18181b" strokeWidth="1.5" strokeDasharray="4" />
              <path d="M 214 150 L 336 100" stroke="#18181b" strokeWidth="1.5" strokeDasharray="4" />
              <path d="M 364 100 L 436 100" stroke="#18181b" strokeWidth="1.5" strokeDasharray="4" />
              
              {/* Glowing animated signals */}
              <circle r="4" fill="#10b981">
                <animateMotion dur="4s" repeatCount="indefinite" path="M 114 100 L 186 50" />
              </circle>
              <circle r="4" fill="#3b82f6">
                <animateMotion dur="5s" repeatCount="indefinite" path="M 114 100 L 186 150" />
              </circle>
              <circle r="4" fill="#06b6d4">
                <animateMotion dur="3.5s" repeatCount="indefinite" path="M 214 50 L 336 100" />
              </circle>
              <circle r="4" fill="#ef4444">
                <animateMotion dur="4.5s" repeatCount="indefinite" path="M 364 100 L 436 100" />
              </circle>
              
              {/* Node labels */}
              <text x="100" y="130" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">main.py</text>
              <text x="200" y="25" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">auth.ts</text>
              <text x="200" y="180" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">db.py</text>
              <text x="350" y="130" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">api.go</text>
              <text x="450" y="130" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">client.rs</text>
            </svg>
          </div>
        </motion.div>
      </main>

      {/* Capabilities Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-28 border-t border-[#18181b] w-full">
        <h2 className="text-xs font-mono tracking-widest text-zinc-500 text-center mb-16 uppercase">Enterprise-Grade Code Intelligence</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="border border-[#18181b] bg-[#121214]/20 hover:border-zinc-800 hover:bg-[#121214]/40 p-8 rounded-lg transition-all duration-300 group">
            <div className="w-10 h-10 rounded bg-blue-500/5 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white mb-3">AST Symbol Indexing</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-light">
              Deep, semantic symbol resolution parsing functions, routes, imports, and exports rather than naive fixed token blocks.
            </p>
          </div>

          {/* Card 2 */}
          <div className="border border-[#18181b] bg-[#121214]/20 hover:border-zinc-800 hover:bg-[#121214]/40 p-8 rounded-lg transition-all duration-300 group">
            <div className="w-10 h-10 rounded bg-indigo-500/5 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white mb-3">Graph Retrieval Expansion</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-light">
              Queries are mapped against dependency edges, retrieving parent layers and import dependencies to build multi-file architectural understanding.
            </p>
          </div>

          {/* Card 3 */}
          <div className="border border-[#18181b] bg-[#121214]/20 hover:border-zinc-800 hover:bg-[#121214]/40 p-8 rounded-lg transition-all duration-300 group">
            <div className="w-10 h-10 rounded bg-emerald-500/5 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white mb-3">Security Static Scanner</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-light">
              Automated multi-agent scanner audits security gaps, explaining command injection paths, SQL interpolations, and key leak risks.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#18181b] py-12 text-center text-xs font-mono text-zinc-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>DESIGNED FOR DEVELOPERS // PREMIUM DEV PLATFORM</span>
          <span>© 2026 ANTIGRAVITY AI. GOOGLE DEEPMIND LABS.</span>
        </div>
      </footer>
    </div>
  );
}

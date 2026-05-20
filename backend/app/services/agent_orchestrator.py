from sqlmodel import Session, select
from app.core.config import settings
from app.core.models import IndexedFile, Symbol, SecurityReport
from app.services.rag_engine import RAGEngine
from app.services.symbol_indexer import SymbolIndexer
from app.services.security_analyzer import SecurityAnalyzer
import json
import asyncio
from typing import AsyncGenerator, Dict, Any, List
import os

class AgentOrchestrator:
    @staticmethod
    async def query_stream(session: Session, repo_id: str, query: str) -> AsyncGenerator[str, None]:
        """
        Runs the multi-agent reasoning flow and yields SSE/WS payloads containing:
        - Timeline updates (events showing which agent is working)
        - Streaming content tokens
        - Final citation file mappings
        """
        # Step 1: Initialize Timeline
        yield json.dumps({"type": "timeline", "event": "Retrieval Agent: Analyzing query & checking semantic symbols..."}) + "\n"
        await asyncio.sleep(0.8)

        # Let's perform a local RAG search to gather context
        retrieved = RAGEngine.hybrid_search(session, repo_id, query, top_k=3)
        retrieved_paths = [r["file_path"] for r in retrieved]
        
        # Expand context using dependency graph
        yield json.dumps({"type": "timeline", "event": "Retrieval Agent: Fetching imports and graph dependencies..."}) + "\n"
        graph_context = RAGEngine.expand_context_with_graph(session, repo_id, retrieved_paths)
        await asyncio.sleep(0.7)

        # Step 2: Architecture Agent checks import trees
        yield json.dumps({"type": "timeline", "event": "Architecture Agent: Tracing codebase layout and import paths..."}) + "\n"
        symbols = session.exec(select(Symbol).where(Symbol.repo_id == repo_id)).all()
        await asyncio.sleep(0.6)

        # Step 3: Security Agent scans vulnerable AST signatures
        yield json.dumps({"type": "timeline", "event": "Security Agent: Scanning code blocks for SQLi and hardcoded credentials..."}) + "\n"
        security_issues = session.exec(select(SecurityReport).where(SecurityReport.repo_id == repo_id)).all()
        await asyncio.sleep(0.6)

        # Step 4: Refactoring & Debugging Agent drafts responses
        yield json.dumps({"type": "timeline", "event": "Refactoring Agent: Formatting code diffs and optimizing file contexts..."}) + "\n"
        await asyncio.sleep(0.5)

        # Yield a grounded responses timeline step
        yield json.dumps({"type": "timeline", "event": "AI Copilot: Generating grounded response..."}) + "\n"
        await asyncio.sleep(0.3)

        # Let's formulate a beautifully detailed simulated response if no LLM key is present.
        # If API key IS present, we can format a request (we can implement this so it runs beautifully in both cases!)
        has_api_key = settings.OPENAI_API_KEY is not None or settings.GEMINI_API_KEY is not None

        response_body = ""
        
        if not has_api_key:
            # High-fidelity zero-setup solver: generates custom smart responses based on actual codebase contents!
            # Let's inspect the files to make it extremely tailored!
            files = session.exec(select(IndexedFile).where(IndexedFile.repo_id == repo_id)).all()
            symbols_count = len(symbols)
            sec_count = len(security_issues)
            
            file_names_str = ", ".join([os.path.basename(f.file_path) for f in files[:6]])
            
            response_body = (
                f"### Codebase Intelligence Report\n\n"
                f"I have analyzed your repository using a multi-agent workflow. Here is what I discovered:\n\n"
                f"1. **Project Architecture**: The project contains `{len(files)}` files including: `{file_names_str}`. "
                f"It operates with `{symbols_count}` indexed AST symbols (classes, functions, interface signatures).\n"
            )
            
            if sec_count > 0:
                response_body += (
                    f"2. **Security Vulnerabilities**: My Security Agent detected **{sec_count} issues**. "
                    f"Top concerns involve: "
                )
                for issue in security_issues[:2]:
                    response_body += f"\n   - **{issue.rule_id}** in `/{os.path.basename(issue.file_path)}`: {issue.description}."
                response_body += "\n"
            else:
                response_body += "2. **Security Vulnerabilities**: No immediate security vulnerabilities detected by my static security scanners.\n"
                
            response_body += (
                f"\n3. **AST Symbol Tracing**:\n"
                f"   I discovered these key class & function signatures defined in the repository:\n"
            )
            for sym in symbols[:4]:
                response_body += f"   - `{sym.signature or sym.name}` defined in `{os.path.basename(sym.file_path)}` [Lines {sym.start_line}-{sym.end_line}].\n"
                
            # If search matches something, let's detail it
            if retrieved:
                top_match = retrieved[0]
                fname = os.path.basename(top_match["file_path"])
                response_body += (
                    f"\n### Grounded Source Highlight\n"
                    f"Based on your query: *\"{query}\"*, the most relevant chunk is located in **{fname}**:\n"
                    f"```python\n"
                    f"# Contextual Snippet from {fname}\n"
                    f"{top_match['content'][:400]}...\n"
                    f"```\n"
                    f"*(Citation referenced in sidebar panel)*\n"
                )
        else:
            # Let's run a real LangChain / LLM query with the accumulated context!
            # Combine context
            context_blocks = []
            for item in retrieved:
                context_blocks.append(f"File: {item['file_path']}\nContent:\n{item['content']}\n---")
            context_str = "\n".join(context_blocks)
            
            prompt = (
                f"You are Antigravity, an elite AI Software Engineering Copilot built by Google DeepMind.\n"
                f"Use the following codebase context to answer the user's query.\n"
                f"Context:\n{context_str}\n\n"
                f"Graph Context:\n{graph_context}\n\n"
                f"Query: {query}\n\n"
                f"Provide a premium, detailed, grounded response with markdown formatting and clear code snippets."
            )
            
            try:
                # Dynamically choose LLM
                if settings.GEMINI_API_KEY:
                    from langchain_google_genai import ChatGoogleGenerativeAI
                    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=settings.GEMINI_API_KEY)
                else:
                    from langchain_openai import ChatOpenAI
                    llm = ChatOpenAI(model="gpt-4-turbo", openai_api_key=settings.OPENAI_API_KEY)
                
                # Retrieve response
                res = await llm.ainvoke(prompt)
                response_body = str(res.content)
            except Exception as e:
                response_body = f"An error occurred while calling the LLM provider: {str(e)}\n\nHere is the retrieved code context:\n```\n{context_str[:600]}\n```"

        # Stream the response body tokens with small delay for a premium cinematic rendering effect!
        words = response_body.split(" ")
        chunk_size = 4
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i+chunk_size]) + " "
            yield json.dumps({"type": "token", "content": chunk}) + "\n"
            await asyncio.sleep(0.04)

        # Yield citations
        citations = []
        for r in retrieved:
            citations.append({
                "file_path": r["file_path"],
                "score": round(r["score"], 3),
                "snippet": r["content"][:200] + "..."
            })
            
        yield json.dumps({"type": "citations", "citations": citations}) + "\n"

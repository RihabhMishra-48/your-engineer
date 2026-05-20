import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Antigravity // AI Software Engineering Copilot",
  description: "Enterprise-grade AI-powered code intelligence with AST parsing, dependency graph reasoning, and multi-agent memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#09090b] text-[#e4e4e7] min-h-screen overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}

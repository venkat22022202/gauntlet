import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { VisitTracker } from "@/components/visit-tracker";
import { CommandPalette } from "@/components/command-palette";
import "./globals.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://gauntlet-indol.vercel.app"),
  title: "Gauntlet — Is your AI agent hackable?",
  description:
    "Run your AI agent's system prompt through a gauntlet of real prompt-injection and jailbreak attacks. Get a scored vulnerability report in 60 seconds.",
  keywords: [
    "prompt injection",
    "jailbreak",
    "AI agent security",
    "LLM security",
    "red team",
    "OWASP LLM",
  ],
  openGraph: {
    title: "Gauntlet — Is your AI agent hackable?",
    description:
      "Red-team your system prompt against real prompt-injection attacks. Scored report in 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${sora.variable} ${inter.variable} ${jetbrains.variable} antialiased`}>
        {children}
        <CommandPalette />
        <VisitTracker />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(17, 13, 24, 0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#f7f5fb",
            },
          }}
        />
      </body>
    </html>
  );
}

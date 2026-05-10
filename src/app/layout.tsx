import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import LoadingScreen from "@/components/LoadingScreen";
import LiveChat from "@/components/LiveChat";
import AgeGate from "@/components/AgeGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Gamers360 - Play Games, Earn Real Money",
  description:
    "The ultimate free gaming platform. Play 50 exciting luck-based games, earn points, level up, and withdraw real cash to your bank account or crypto wallet.",
  keywords: ["games", "earn money", "play to earn", "gaming platform", "free games", "win cash"],
  manifest: "/manifest.json",
  openGraph: {
    title: "Gamers360 - Play Games, Earn Real Money",
    description: "Play 50 luck-based games, earn points, withdraw cash. 100% free.",
    type: "website",
    siteName: "Gamers360",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gamers360 - Play Games, Earn Real Money",
    description: "Play 50 luck-based games, earn points, withdraw cash. 100% free.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <ToastProvider>
          <AgeGate />
          <LoadingScreen />
          {children}
          <LiveChat />
        </ToastProvider>
      </body>
    </html>
  );
}

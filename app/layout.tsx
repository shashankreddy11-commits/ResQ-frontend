import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { PWARegister } from "@/components/pwa-register";
import { AppShell } from "@/components/app-shell";

export const viewport: Viewport = {
  themeColor: "#0B1F4B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "ResQ | Emergency Response",
    template: "%s | ResQ",
  },
  description:
    "Disaster Resilience and Emergency Response — Emergency Operations Center, SOS Distress Signal, Safe Shelters, GIS Evacuation Map, and Multi-Agency Coordination Platform.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className="min-h-full bg-[#F4F7FB] text-[#172033] font-sans antialiased selection:bg-[#2563EB] selection:text-white"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <PWARegister />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

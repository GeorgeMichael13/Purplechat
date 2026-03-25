import type { Metadata, Viewport } from "next"; // Added Viewport type
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// --- NEW: MOBILE VIEWPORT OPTIMIZATION ---
// This prevents auto-zoom on iOS and ensures 1:1 scaling
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Fixes "notch" issues on modern phones
};

export const metadata: Metadata = {
  title: "PurpleChat Neural",
  description: "High-performance AI assistant",
  icons: {
    icon: "/icon.svg?v=1",
    shortcut: "/icon.svg?v=1",
    apple: "/icon.svg?v=1",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetbrains.variable} font-sans antialiased bg-white dark:bg-slate-950 transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* 
              MAINTAINED: The 'children' handle the sidebar.
              UPDATED: Added 'flex flex-col' and dynamic height to support 
              mobile top-bars and the svh height fix from globals.css
          */}
          <div className="flex flex-col h-[100vh] h-[100svh] w-full overflow-hidden">
            {children}
          </div>

          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}

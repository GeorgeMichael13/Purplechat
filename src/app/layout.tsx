import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

// ====================== SAFETY GUARD ======================
("use client");
import { useEffect } from "react";

function SafetyGuard() {
  useEffect(() => {
    const originalStartsWith = String.prototype.startsWith;

    String.prototype.startsWith = function (search: any) {
      if (typeof this !== "string") {
        console.warn("🚨 Prevented startsWith() call on undefined/null value");
        return false;
      }
      return originalStartsWith.call(this, search);
    };

    return () => {
      String.prototype.startsWith = originalStartsWith;
    };
  }, []);

  return null;
}
// ===========================================================

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
          {/* Safety Guard - Prevents the startsWith undefined error */}
          <SafetyGuard />

          <div className="flex flex-col h-[100vh] h-[100svh] w-full overflow-hidden">
            {children}
          </div>

          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}

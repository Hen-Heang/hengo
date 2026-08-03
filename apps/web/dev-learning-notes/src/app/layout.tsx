import type { Metadata } from "next";
import "./globals.css";
import { getAllNotes } from "@/lib/notes";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { MobileTabBar } from "@/components/MobileTabBar";
import { BrandLockup } from "@/components/BrandLockup";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Dev Learning Notes - Global Engineering Hub",
  description: "Modern Full-Stack engineering and architecture notes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DevNotes",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Try to get the user's session — layout runs after the proxy sets the cookie,
  // so this is safe. Falls back gracefully if no session (e.g. on /login).
  let notes: Awaited<ReturnType<typeof getAllNotes>> = [];
  try {
    const supabase = await createClient();
    notes = await getAllNotes(supabase);
  } catch {
    notes = [];
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark');})();`,
          }}
        />
      </head>
      <body className="antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar notes={notes} />

            <div className="flex-1 flex flex-col min-w-0">
              <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30 pt-safe">
                <MobileSidebar notes={notes} />
                <BrandLockup compact className="min-w-0 flex-1" />
                <ThemeToggle />
              </header>

              <main className="flex-1 overflow-auto pb-24 lg:pb-0">{children}</main>
              <MobileTabBar />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

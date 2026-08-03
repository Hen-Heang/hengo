import type { Metadata, Viewport } from "next"

import { AppProviders } from "@/components/providers/app-providers"

import "./globals.css"

// Tells the browser to shrink the visual viewport (and dvh units) when the
// virtual keyboard opens — keeps the chat input visible on mobile.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom up to 5x — WCAG 1.4.4 (low-vision users must be able to
  // zoom). We intentionally do NOT set maximumScale: 1, which would lock it.
  maximumScale: 5,
  // Extend the layout under the notch/home indicator so env(safe-area-inset-*)
  // resolves to real values — without this every safe-area padding is 0 on iOS.
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  // Tint the iOS Safari / PWA status bar to match the app background in each
  // theme so the notch area blends into the page instead of showing white.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbfb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1422" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "Hengo — Korean for Developers",
    template: "%s · Hengo",
  },
  description:
    "Practice workplace Korean, prepare for interviews, and build consistent learning habits with an AI coach made for developers.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/hengo-icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

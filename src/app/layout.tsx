import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Anuphan, Sarabun } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { skinBootScript } from "@/components/features/layout/skins";
import { th } from "@/i18n/th";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-anuphan",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: th.app.name, template: `%s · ${th.app.shortName}` },
  description: th.app.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1f8a55" },
    { media: "(prefers-color-scheme: dark)", color: "#1f8a55" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={`${sarabun.variable} ${anuphan.variable}`} suppressHydrationWarning>
      <head>
        {/* Static, code-defined script (no user input): applies the saved skin before paint. */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: skinBootScript }} />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-soft focus:bg-surface focus:px-4 focus:py-2 focus:shadow-raise"
        >
          {th.nav.skipToContent}
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

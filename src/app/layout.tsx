import type { Metadata, Viewport } from "next";
import AuthSync from "@/components/AuthSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "Set Rank",
  description: "Rank the festival sets you saw, one head-to-head at a time.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <AuthSync />
        {/* Phone-width column everywhere; pages marked data-wide (the home page) widen on bigger screens. */}
        <main className="mx-auto w-full max-w-md px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] md:has-[[data-wide]]:max-w-4xl">

          {children}
        </main>
      </body>
    </html>
  );
}

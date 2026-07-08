import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { UserNav } from "@/components/UserNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "D&M Logistics | Quote Calculator",
  description: "Dump truck hauling quote calculator and dispatch tool for D&M Logistics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <SessionProviderWrapper>
          <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 print:hidden">
            <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
              <Link href="/" className="font-semibold tracking-tight">
                D&amp;M Logistics
              </Link>
              <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                  Dashboard
                </Link>
                <Link href="/quote" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                  New Quote
                </Link>
                <Link href="/dispatch" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                  Dispatch Board
                </Link>
                <Link href="/users" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                  Users
                </Link>
              </div>
              <UserNav />
            </nav>
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

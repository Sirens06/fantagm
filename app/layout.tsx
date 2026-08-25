import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import HP from "./page"

export const metadata: Metadata = {
  title: "Fantagm",
  description: "Fantagm - Fanta Manager",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-body bg-gray-900 text-white min-h-screen flex flex-col">
        <nav className="sticky top-0">
          <div className="flex justify-between items-center bg-gray-800 p-4">
            <Link href="/">Home</Link>
            <Link href="/trade">Scambi suggeriti</Link>
            <Link href="/auction">Asta</Link>
            <Link href="/scouting">Scouting</Link>
            <Link href="/squad">Rose</Link>
          </div>
        </nav>
        <main className="p-3 w-full">{children}</main>
      </body>
    </html>
  );
}

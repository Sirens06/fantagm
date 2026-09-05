import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantagm",
  description: "Fantagm - Fanta Manager",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="font-body bg-campo text-gesso min-h-screen flex flex-col">
        <nav className="sticky top-0">
          <div className="flex justify-between items-center gap-3 overflow-x-auto border-b border-riga bg-superficie px-3 py-2 text-xs text-nebbia">
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

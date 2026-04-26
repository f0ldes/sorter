import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthGate } from "@/components/AuthGate";
import { Nav } from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Sorting Library",
  description: "Catalog your stuff with photos, tags, and storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
        <AuthGate>
          <Nav />
          <div className="flex-1">{children}</div>
        </AuthGate>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import { getOptionalSession, isAuthEnabled } from "@/lib/auth-optional";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Opportunity Tracker",
  description: "Track your job search opportunities",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getOptionalSession();

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">
        <AppShell
          user={session?.user ?? null}
          authEnabled={isAuthEnabled()}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getOptionalSession, isAuthEnabled } from "@/lib/auth-optional";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">
              Opportunity Tracker
            </Link>
            <div className="flex items-center gap-4">
              {session?.user && (
                <span className="text-sm text-muted-foreground">
                  {session.user.name ?? session.user.email}
                </span>
              )}
              {isAuthEnabled() && session?.user && (
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <Button variant="outline" size="sm" type="submit">
                    Sign out
                  </Button>
                </form>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

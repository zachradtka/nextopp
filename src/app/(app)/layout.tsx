import { getOptionalSession, isAuthEnabled } from "@/lib/auth-optional";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getOptionalSession();

  return (
    <AppShell user={session?.user ?? null} authEnabled={isAuthEnabled()}>
      {children}
    </AppShell>
  );
}

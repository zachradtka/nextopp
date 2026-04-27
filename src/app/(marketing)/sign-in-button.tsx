"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <Link href="/login">
      <Button size="sm" className="sm:h-8 sm:px-3">
        Sign in
      </Button>
    </Link>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function EmailSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending magic link..." : "Send magic link"}
    </Button>
  );
}

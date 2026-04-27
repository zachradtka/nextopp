"use server";

import { signIn } from "@/lib/auth";

export async function signInWithProviderAction(formData: FormData) {
  const provider = formData.get("provider")?.toString();
  const callbackUrl = formData.get("callbackUrl")?.toString() || "/opportunities";
  if (!provider) return;
  await signIn(provider, { redirectTo: callbackUrl });
}

export async function signInWithEmailAction(formData: FormData) {
  const email = formData.get("email")?.toString();
  const callbackUrl = formData.get("callbackUrl")?.toString() || "/opportunities";
  if (!email) return;
  await signIn("resend", { email, redirectTo: callbackUrl });
}

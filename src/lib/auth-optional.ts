import { auth } from "./auth";

export async function getOptionalSession() {
  if (process.env.AUTH_DISABLED === "true") {
    return { user: { name: "Local User", email: "local@localhost" } };
  }
  return await auth();
}

export function isAuthEnabled() {
  return process.env.AUTH_DISABLED !== "true";
}

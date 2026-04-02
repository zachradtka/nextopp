import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (process.env.AUTH_DISABLED === "true") {
    return NextResponse.next();
  }

  if (!req.auth && !req.nextUrl.pathname.startsWith("/api/auth")) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

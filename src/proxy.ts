import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (process.env.AUTH_DISABLED === "true") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const isPublicPath =
    pathname === "/" || pathname.startsWith("/api/auth");

  if (!req.auth && !isPublicPath) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

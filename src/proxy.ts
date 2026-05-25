import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (process.env.AUTH_DISABLED === "true") {
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;
  const isPublicPath =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth");

  if (!req.auth && !isPublicPath) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|marketing/).*)"],
};

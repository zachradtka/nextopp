import { type NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

// GitHub now sends an "iss" parameter in OAuth callbacks (RFC 9207), but
// Auth.js v5 uses a dummy issuer ("https://authjs.dev") for non-OIDC
// providers, so the issuer check always fails. Strip the parameter before
// Auth.js processes the request.
function stripIss(request: NextRequest): NextRequest {
  const url = new URL(request.url);
  if (url.searchParams.has("iss")) {
    url.searchParams.delete("iss");
    return new Request(url, request) as unknown as NextRequest;
  }
  return request;
}

export const GET = (request: NextRequest) => handlers.GET(stripIss(request));
export const POST = handlers.POST;

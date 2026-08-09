import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((request) => {
  const authenticated = Boolean(request.auth?.user);
  const onAuthPage = ["/login", "/forgot-password", "/verify-email", "/reset-password"].some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  if (!authenticated && !onAuthPage) return NextResponse.redirect(new URL("/login", request.url));
  if (authenticated && onAuthPage) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
});

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"] };

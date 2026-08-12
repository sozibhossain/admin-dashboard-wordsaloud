import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((request) => {
  const authenticated = Boolean(request.auth?.user);
  const onAuthPage = ["/login", "/forgot-password", "/verify-email", "/reset-password"].some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  if (!authenticated && !onAuthPage) return NextResponse.redirect(new URL("/login", request.url));
  if (authenticated && onAuthPage) return NextResponse.redirect(new URL("/", request.url));
  const role = request.auth?.user.role;
  const permissions = request.auth?.user.permissions || [];
  const permissionByPath = {
    "/dashboard": "dashboard",
    "/users": "users",
    "/advertisements": "advertisements",
  } as const;
  const requiredEntry = Object.entries(permissionByPath).find(([path]) => request.nextUrl.pathname.startsWith(path));
  const deniedSection = requiredEntry && role !== "super-admin" && !permissions.includes(requiredEntry[1]);
  const deniedAdminManagement = request.nextUrl.pathname.startsWith("/administrators") && role !== "super-admin";
  if (authenticated && (deniedSection || deniedAdminManagement)) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
});

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"] };

import "next-auth";
import type { AdminPermission } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: { _id: string; role: string; permissions: AdminPermission[]; name?: string | null; email?: string | null; image?: string | null };
  }
  interface User { role: string; permissions: AdminPermission[]; accessToken: string; refreshToken: string }
}

declare module "next-auth/jwt" {
  interface JWT { _id?: string; role?: string; permissions?: AdminPermission[]; accessToken?: string; refreshToken?: string }
}

import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: { _id: string; role: string; name?: string | null; email?: string | null; image?: string | null };
  }
  interface User { role: string; accessToken: string }
}

declare module "next-auth/jwt" {
  interface JWT { _id?: string; role?: string; accessToken?: string }
}

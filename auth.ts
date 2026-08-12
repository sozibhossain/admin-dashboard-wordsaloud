import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginApi } from "@/lib/api";
import type { AdminPermission } from "@/lib/types";

export const { handlers, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await loginApi({ email: String(credentials.email), password: String(credentials.password) });
        if (!["admin", "super-admin"].includes(user.role)) return null;
        return { id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.adminPermissions, accessToken: user.accessToken };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token._id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session({ session, token }) {
      session.user._id = String(token._id || token.sub || "");
      session.user.role = String(token.role || "");
      session.user.permissions = Array.isArray(token.permissions)
        ? token.permissions as AdminPermission[]
        : [];
      session.accessToken = String(token.accessToken || "");
      return session;
    },
  },
});

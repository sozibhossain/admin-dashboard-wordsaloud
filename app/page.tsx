import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const permissions = session.user.permissions || [];
  if (session.user.role === "super-admin" || permissions.includes("dashboard")) redirect("/dashboard");
  if (permissions.includes("users")) redirect("/users");
  if (permissions.includes("advertisements")) redirect("/advertisements");
  redirect("/settings");
}

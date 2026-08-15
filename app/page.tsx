import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const permissions = session.user.permissions || [];
  if (session.user.role === "super-admin" || permissions.includes("dashboard")) redirect("/dashboard");
  if (permissions.includes("users")) redirect("/users");
  if (permissions.includes("advertisements")) redirect("/advertisements");
  if (permissions.includes("verification")) redirect("/verification");
  if (permissions.includes("reviews")) redirect("/reviews");
  if (permissions.includes("categories")) redirect("/categories");
  if (permissions.includes("audit")) redirect("/audit-logs");
  if (permissions.includes("settings")) redirect("/platform-settings");
  redirect("/settings");
}

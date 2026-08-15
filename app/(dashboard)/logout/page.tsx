"use client";

import { useMutation } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { logoutApi } from "@/lib/api";

export default function LogoutPage() {
  const router = useRouter();
  const logout = useMutation({ mutationFn: logoutApi, onSettled: async () => { await signOut({ redirect: false }); router.push("/login"); router.refresh(); }, onSuccess: () => toast.success("Logged out successfully") });
  return <><PageHeading title="Log Out" /><section className="mx-auto mt-20 max-w-[920px] rounded-lg border border-black/10 bg-white px-6 py-28 text-center shadow-sm"><h2 className="text-3xl font-bold">Are you sure you want to log out?</h2><div className="mx-auto mt-9 grid max-w-[760px] gap-4 sm:grid-cols-2"><Button variant="outline" onClick={() => router.back()}>Cancel</Button><Button variant="danger" disabled={logout.isPending} onClick={() => logout.mutate()}>{logout.isPending ? "Logging out..." : "Log out"}</Button></div></section></>;
}

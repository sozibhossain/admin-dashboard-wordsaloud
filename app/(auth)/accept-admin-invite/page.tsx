"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { acceptAdministratorInvitation, validateAdministratorInvitation } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

function AcceptInvitationForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [showPassword, setShowPassword] = useState(false);
  const invitation = useQuery({
    queryKey: ["admin-invitation", token],
    queryFn: () => validateAdministratorInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });
  const accept = useMutation({
    mutationFn: acceptAdministratorInvitation,
    onSuccess: (response) => {
      toast.success(response.message);
      router.push("/login");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    accept.mutate({ token, password, confirmPassword });
  }

  if (!token || invitation.isError) {
    return <AuthFrame title="Invitation unavailable" subtitle={token ? errorMessage(invitation.error) : "The invitation link is incomplete"}><Button asChild className="w-full rounded-full"><Link href="/login">Return to sign in</Link></Button></AuthFrame>;
  }
  if (invitation.isLoading) {
    return <AuthFrame title="Checking invitation" subtitle="Please wait while we validate your secure link"><p className="text-sm text-muted">Validating...</p></AuthFrame>;
  }

  return <AuthFrame title="Set your password" subtitle="Activate your administrator account"><form onSubmit={submit} className="space-y-4 text-left"><label className="block text-sm font-medium">Administrator email<div className="relative mt-2"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input value={invitation.data?.email || ""} readOnly className="rounded-full bg-black/[0.03] pl-11" /></div></label><label className="block text-sm font-medium">Password<div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input name="password" type={showPassword ? "text" : "password"} minLength={8} required autoComplete="new-password" className="rounded-full pl-11 pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label><label className="block text-sm font-medium">Confirm password<Input name="confirmPassword" type={showPassword ? "text" : "password"} minLength={8} required autoComplete="new-password" className="mt-2 rounded-full" /></label><p className="text-xs leading-5 text-muted">Use at least 8 characters. This invitation can only be used once.</p><Button className="w-full rounded-full" disabled={accept.isPending}>{accept.isPending ? "Activating..." : "Activate account"}</Button></form></AuthFrame>;
}

export default function AcceptAdminInvitePage() {
  return <Suspense><AcceptInvitationForm /></Suspense>;
}

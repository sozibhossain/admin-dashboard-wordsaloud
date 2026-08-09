"use client";

import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordApi } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

function ResetForm() {
  const params = useSearchParams(); const router = useRouter(); const [show, setShow] = useState(false);
  const mutation = useMutation({ mutationFn: resetPasswordApi, onSuccess: () => { toast.success("Password changed successfully"); router.push("/login"); }, onError: (e) => toast.error(errorMessage(e)) });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const password = String(form.get("password")); const confirmPassword = String(form.get("confirmPassword")); if (password !== confirmPassword) return toast.error("Passwords do not match"); mutation.mutate({ email: params.get("email") || "", otp: params.get("otp") || "", password, confirmPassword }); }
  return <AuthFrame title="Reset Password" subtitle="Create a new password"><form onSubmit={submit} className="space-y-4"><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input name="password" type={show ? "text" : "password"} minLength={6} required placeholder="Create New Password" className="rounded-full pl-11 pr-12" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-label="Toggle password visibility">{show ? <EyeOff size={19} /> : <Eye size={19} />}</button></div><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input name="confirmPassword" type={show ? "text" : "password"} minLength={6} required placeholder="Confirm New Password" className="rounded-full pl-11" /></div><Button className="mt-5 w-full rounded-full" disabled={mutation.isPending}>{mutation.isPending ? "Changing..." : "Change Password"}</Button></form></AuthFrame>;
}
export default function ResetPasswordPage() { return <Suspense><ResetForm /></Suspense>; }

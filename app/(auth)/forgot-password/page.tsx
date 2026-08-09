"use client";

import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordApi } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const mutation = useMutation({ mutationFn: forgotPasswordApi, onSuccess: (response) => { toast.success(response.message); router.push(`/verify-email?email=${encodeURIComponent(response.data.email)}`); }, onError: (e) => toast.error(errorMessage(e)) });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); mutation.mutate(String(new FormData(event.currentTarget).get("email"))); }
  return <AuthFrame title="Forgot Password" subtitle="Enter your email to recover your password"><form onSubmit={submit} className="space-y-8 text-left"><label className="block text-sm font-medium">Email<div className="relative mt-2"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input name="email" type="email" required placeholder="you@gmail.com" className="rounded-full pl-11" /></div></label><Button className="w-full rounded-full" disabled={mutation.isPending}>{mutation.isPending ? "Sending..." : "Send OTP"}</Button></form></AuthFrame>;
}

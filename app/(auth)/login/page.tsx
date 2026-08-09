"use client";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false });
    setLoading(false);
    if (result?.error) return toast.error("Invalid admin email or password");
    toast.success("Welcome back"); router.push("/dashboard"); router.refresh();
  }
  return <AuthFrame title="Welcome" subtitle="Sign in to continue to your dashboard">
    <form onSubmit={submit} className="space-y-4 text-left">
      <label className="block text-sm font-medium">Email address<div className="relative mt-2"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input name="email" type="email" required autoComplete="email" placeholder="you@gmail.com" className="rounded-full pl-11" /></div></label>
      <label className="block text-sm font-medium">Password<div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input name="password" type={show ? "text" : "password"} required minLength={6} autoComplete="current-password" placeholder="Password" className="rounded-full pl-11 pr-12" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
      <div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="remember" className="size-4 accent-brand" />Remember me</label><Link href="/forgot-password" className="text-brand hover:underline">Forgot password?</Link></div>
      <Button className="mt-4 w-full rounded-full" disabled={loading}>{loading ? "Logging in..." : "Log In"}</Button>
    </form>
  </AuthFrame>;
}

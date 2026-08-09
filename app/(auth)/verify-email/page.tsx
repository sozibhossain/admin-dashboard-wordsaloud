"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { forgotPasswordApi, verifyResetOtpApi } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

function VerifyForm() {
  const params = useSearchParams(); const router = useRouter(); const email = params.get("email") || "";
  const [digits, setDigits] = useState(Array(6).fill("")); const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const verify = useMutation({ mutationFn: verifyResetOtpApi, onSuccess: () => { toast.success("Email verified"); router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${digits.join("")}`); }, onError: (e) => toast.error(errorMessage(e)) });
  const resend = useMutation({ mutationFn: forgotPasswordApi, onSuccess: () => toast.success("A new code was sent"), onError: (e) => toast.error(errorMessage(e)) });
  function change(index: number, value: string) { const next = [...digits]; next[index] = value.replace(/\D/g, "").slice(-1); setDigits(next); if (next[index] && index < 5) inputs.current[index + 1]?.focus(); }
  return <AuthFrame title="Verify Email" subtitle="Enter the OTP to verify your email"><div className="flex justify-center gap-2 sm:gap-5">{digits.map((digit, index) => <input key={index} ref={(node) => { inputs.current[index] = node; }} value={digit} onChange={(e) => change(index, e.target.value)} onKeyDown={(e) => { if (e.key === "Backspace" && !digit && index) inputs.current[index - 1]?.focus(); }} inputMode="numeric" aria-label={`OTP digit ${index + 1}`} className="size-12 rounded-md border border-[#6f6f6f] bg-white text-center text-lg outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 sm:size-16" />)}</div><p className="my-5 text-sm">Did not get a code? <button onClick={() => resend.mutate(email)} disabled={resend.isPending} className="text-brand">Resend</button></p><Button className="w-full rounded-full" disabled={digits.join("").length !== 6 || verify.isPending} onClick={() => verify.mutate({ email, otp: digits.join("") })}>{verify.isPending ? "Verifying..." : "Verify"}</Button></AuthFrame>;
}
export default function VerifyEmailPage() { return <Suspense><VerifyForm /></Suspense>; }

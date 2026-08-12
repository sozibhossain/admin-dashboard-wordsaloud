"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { changePassword, getProfile, updateProfile } from "@/lib/api";
import { cn, errorMessage, initials } from "@/lib/utils";

export default function SettingsPage() {
  const client = useQueryClient();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const update = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const password = useMutation({
    mutationFn: changePassword,
    onSuccess: (response) => toast.success(response.message),
    onError: (error) => toast.error(errorMessage(error)),
  });

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      firstName: String(form.get("firstName")),
      lastName: String(form.get("lastName")),
      phoneNumber: String(form.get("phoneNumber")),
      area: String(form.get("area")),
    });
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      currentPassword: String(form.get("currentPassword")),
      newPassword: String(form.get("newPassword")),
      confirmPassword: String(form.get("confirmPassword")),
    };

    if (values.newPassword !== values.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    password.mutate(values);
  }

  const user = profile.data;
  const name =
    user?.name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "Admin";

  return (
    <>
      <PageHeading title="Setting" />
      {profile.isLoading ? (
        <Skeleton className="mx-auto h-[650px] max-w-[1300px]" />
      ) : (
        <section className="mx-auto max-w-[1300px] rounded-lg bg-white p-5 shadow-md sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTab("profile")}
              className={cn(
                "h-14 rounded-md border border-brand text-sm font-bold text-brand",
                tab === "profile" && "bg-brand text-white",
              )}
            >
              Personal Information
            </button>
            <button
              type="button"
              onClick={() => setTab("password")}
              className={cn(
                "h-14 rounded-md border border-brand text-sm font-bold text-brand",
                tab === "password" && "bg-brand text-white",
              )}
            >
              Change Password
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4 rounded-lg border border-[#d5e8f5] p-5">
            <span className="grid size-14 place-items-center rounded-full bg-accent text-xl font-bold">
              {initials(name).slice(0, 1)}
            </span>
            <div>
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="text-sm capitalize">@{user?.role || "admin"}</p>
            </div>
          </div>

          {tab === "profile" ? (
            <form
              onSubmit={submitProfile}
              className="mt-8 rounded-lg border border-[#d5e8f5] p-5"
            >
              <h2 className="mb-6 text-xl font-bold">Personal Information</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First Name">
                  <Input name="firstName" required defaultValue={user?.firstName} />
                </Field>
                <Field label="Last Name">
                  <Input name="lastName" required defaultValue={user?.lastName} />
                </Field>
                <Field label="Email Address">
                  <Input value={user?.email || ""} disabled />
                </Field>
                <Field label="Phone">
                  <Input name="phoneNumber" required defaultValue={user?.phoneNumber} />
                </Field>
                <Field label="Area">
                  <Input name="area" defaultValue={user?.area} />
                </Field>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Button type="reset" variant="outline">
                  Cancel
                </Button>
                <Button disabled={update.isPending}>
                  {update.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={submitPassword}
              className="mt-8 rounded-lg border border-[#d5e8f5] p-5"
            >
              <h2 className="mb-6 text-xl font-bold">Change Password</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordField
                  label="Current Password"
                  name="currentPassword"
                  autoComplete="current-password"
                />
                <div className="hidden sm:block" />
                <PasswordField
                  label="New Password"
                  name="newPassword"
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm New Password"
                  name="confirmPassword"
                  autoComplete="new-password"
                />
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Button type="reset" variant="outline">
                  Cancel
                </Button>
                <Button disabled={password.isPending}>
                  {password.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </section>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

type PasswordFieldProps = {
  label: string;
  name: "currentPassword" | "newPassword" | "confirmPassword";
  autoComplete: "current-password" | "new-password";
};

function PasswordField({ label, name, autoComplete }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={6}
          required
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-[#667085] transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/30"
        >
          {isVisible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

export default function PlatformSettingsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["platform-settings"], queryFn: getPlatformSettings });
  const update = useMutation({ mutationFn: updatePlatformSettings, onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["platform-settings"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  if (query.isLoading) return <><PageHeading title="Platform Settings" /><p className="rounded-lg bg-white p-10 text-center text-muted">Loading settings...</p></>;
  if (query.isError || !query.data) return <><PageHeading title="Platform Settings" /><p className="rounded-lg bg-white p-10 text-center text-red-600">{errorMessage(query.error)}</p></>;
  const settings = query.data;
  return <><PageHeading title="Platform Settings" /><form key={settings.updatedAt} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); update.mutate({ vipSlotsPerCategory: Number(form.get("vipSlotsPerCategory")), sponsoredRotation: String(form.get("sponsoredRotation")) as typeof settings.sponsoredRotation, reviewModerationMode: String(form.get("reviewModerationMode")) as typeof settings.reviewModerationMode }); }} className="mx-auto max-w-4xl space-y-6 rounded-lg bg-white p-6 shadow-sm"><section><h2 className="text-lg font-bold">VIP Listings</h2><p className="mb-4 mt-1 text-sm text-muted">Control how many VIP tradesmen can be featured in each category.</p><label className="block max-w-sm text-sm font-semibold">VIP slots per category<Input name="vipSlotsPerCategory" type="number" min="1" max="20" required defaultValue={settings.vipSlotsPerCategory} className="mt-2" /></label></section><hr className="border-black/10" /><section><h2 className="text-lg font-bold">Sponsored Advertisement Rotation</h2><p className="mb-4 mt-1 text-sm text-muted">Choose how eligible active advertisements are ordered.</p><select name="sponsoredRotation" defaultValue={settings.sponsoredRotation} className="form-control max-w-sm"><option value="round-robin">Round robin</option><option value="priority">Priority</option><option value="random">Random</option></select></section><hr className="border-black/10" /><section><h2 className="text-lg font-bold">Review Moderation</h2><p className="mb-4 mt-1 text-sm text-muted">Decide whether new reviews appear immediately or wait for an administrator.</p><select name="reviewModerationMode" defaultValue={settings.reviewModerationMode} className="form-control max-w-sm"><option value="auto-approve">Auto-approve reviews</option><option value="require-review">Require administrator review</option></select></section><div className="flex justify-end"><Button disabled={update.isPending}>{update.isPending ? "Saving..." : "Save Platform Settings"}</Button></div></form></>;
}

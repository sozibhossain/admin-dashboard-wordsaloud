"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createAdvertisement,
  deleteAdvertisement,
  getAdInquiries,
  getAdvertisements,
  getCategoriesAdmin,
  updateAdInquiry,
  updateAdvertisement,
} from "@/lib/api";
import type { Advertisement } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

const localDateTime = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

function AdDialog({
  open,
  onOpenChange,
  advertisement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: Advertisement | null;
}) {
  const client = useQueryClient();
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesAdmin,
    enabled: open,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    advertisement?.categories || [],
  );
  const mutation = useMutation({
    mutationFn: (payload: FormData) =>
      advertisement
        ? updateAdvertisement(advertisement._id, payload)
        : createAdvertisement(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["advertisements"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("categories", JSON.stringify(selectedCategories));
    mutation.mutate(form);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>
          {advertisement ? "Edit Advertisement" : "Create Advertisement"}
        </DialogTitle>
        <form
          onSubmit={submit}
          className="mt-6 max-h-[75vh] space-y-5 overflow-y-auto pr-1"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Advertisement Title">
              <Input
                name="title"
                required
                defaultValue={advertisement?.title}
                placeholder="Campaign title"
              />
            </Field>
            <Field label="Target URL">
              <Input
                name="targetUrl"
                type="url"
                defaultValue={advertisement?.targetUrl}
                placeholder="https://example.com"
              />
            </Field>
          </div>
          <Field label="Advertisement Description">
            <textarea
              name="description"
              className="form-control min-h-28 resize-none"
              required
              defaultValue={advertisement?.description}
              placeholder="Campaign description"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Image or MP4 video">
              <Input
                name="media"
                type="file"
                accept="image/jpeg,image/png,video/mp4"
                required={!advertisement?.media?.url}
              />
            </Field>
            <Field label="Priority">
              <Input
                name="priority"
                type="number"
                min="0"
                defaultValue={advertisement?.priority || 0}
              />
            </Field>
          </div>
          {advertisement?.media?.url && (
            <a
              className="text-sm font-semibold text-brand hover:underline"
              href={advertisement.media.url}
              target="_blank"
              rel="noreferrer"
            >
              View current {advertisement.media.mediaType}
            </a>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start Date">
              <Input
                name="startDate"
                type="datetime-local"
                required
                defaultValue={
                  localDateTime(advertisement?.startDate) ||
                  localDateTime(new Date().toISOString())
                }
              />
            </Field>
            <Field label="End Date">
              <Input
                name="endDate"
                type="datetime-local"
                defaultValue={localDateTime(advertisement?.endDate)}
              />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">
              Trade Categories{" "}
              <span className="font-normal text-muted">
                (none = platform-wide)
              </span>
            </legend>
            <div className="grid max-h-44 gap-2 overflow-y-auto rounded-md border border-black/10 p-3 sm:grid-cols-2">
              {categories.data
                ?.filter((category) => category.isActive)
                .map((category) => (
                  <label
                    key={category._id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={(event) =>
                        setSelectedCategories((current) =>
                          event.target.checked
                            ? [...current, category.name]
                            : current.filter((name) => name !== category.name),
                        )
                      }
                    />
                    {category.icon || "🛠️"} {category.name}
                  </label>
                ))}
            </div>
          </fieldset>
          <section className="rounded-md border border-black/10 p-4">
            <h3 className="mb-4 font-bold">Advertiser Contact</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Name">
                <Input
                  name="advertiserName"
                  defaultValue={advertisement?.advertiser?.name}
                />
              </Field>
              <Field label="Email">
                <Input
                  name="advertiserEmail"
                  type="email"
                  defaultValue={advertisement?.advertiser?.email}
                />
              </Field>
              <Field label="Phone">
                <Input
                  name="advertiserPhone"
                  type="tel"
                  defaultValue={advertisement?.advertiser?.phone}
                />
              </Field>
            </div>
          </section>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving..."
                : advertisement
                  ? "Save Changes"
                  : "Create Advertisement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdvertisementsPage() {
  const client = useQueryClient();
  const [tab, setTab] = useState<"campaigns" | "inquiries">("campaigns");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const pageSize = 9;
  const query = useQuery({
    queryKey: ["advertisements"],
    queryFn: getAdvertisements,
  });
  const inquiries = useQuery({
    queryKey: ["ad-inquiries"],
    queryFn: getAdInquiries,
    enabled: tab === "inquiries",
  });
  const remove = useMutation({
    mutationFn: deleteAdvertisement,
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["advertisements"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const toggle = useMutation({
    mutationFn: (ad: Advertisement) =>
      updateAdvertisement(ad._id, { isActive: !ad.isActive }),
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["advertisements"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const inquiryStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "new" | "contacted" | "closed";
    }) => updateAdInquiry(id, status),
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["ad-inquiries"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const filtered = (query.data || []).filter(
    (ad) =>
      filter === "all" || (filter === "active" ? ad.isActive : !ad.isActive),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const ads = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  return (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <PageHeading title="Advertisements" />
        <div className="ml-auto flex items-center gap-3">
          {tab === "campaigns" && (
            <>
              <label className="relative">
                <span className="sr-only">Filter advertisements</span>
                <select
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value as typeof filter);
                    setPage(1);
                  }}
                  className="h-10 appearance-none rounded-full border border-black/10 bg-white pl-4 pr-10 text-sm shadow-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Filter
                  size={15}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                />
              </label>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus size={16} />
                Create Advertisement
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("campaigns")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "campaigns" ? "bg-brand text-white" : "bg-white"}`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setTab("inquiries")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "inquiries" ? "bg-brand text-white" : "bg-white"}`}
        >
          Advertiser Inquiries
        </button>
      </div>
      {tab === "campaigns" ? (
        query.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-80" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="rounded-lg bg-white p-10 text-center text-red-600">
            {errorMessage(query.error)}
          </p>
        ) : (
          <>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {ads.map((ad) => (
                <article
                  key={ad._id}
                  className="overflow-hidden rounded-lg bg-white shadow-sm"
                >
                  {ad.media?.url &&
                    (ad.media.mediaType === "video" ? (
                      <video
                        src={ad.media.url}
                        className="aspect-video w-full bg-black object-cover"
                        muted
                        playsInline
                        controls
                      />
                    ) : (
                      <img
                        src={ad.media.url}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    ))}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-bold">{ad.title}</h2>
                      <div className="flex gap-2">
                        <button
                          title="Edit advertisement"
                          onClick={() => {
                            setEditing(ad);
                            setOpen(true);
                          }}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          title="Delete advertisement"
                          onClick={() => {
                            if (confirm(`Delete ${ad.title}?`))
                              remove.mutate(ad._id);
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6">
                      {ad.description}
                    </p>
                    <p className="mt-3 text-xs text-muted">
                      {ad.categories?.length
                        ? ad.categories.join(", ")
                        : "Platform-wide"}
                    </p>
                    <button
                      onClick={() => toggle.mutate(ad)}
                      className={`mt-4 text-sm font-bold ${ad.isActive ? "text-green-700" : "text-red-600"}`}
                    >
                      {ad.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </article>
              ))}
            </section>
            {!ads.length && (
              <div className="rounded-lg bg-white p-16 text-center text-sm text-muted">
                No advertisements found.
              </div>
            )}
            <div className="mt-5 rounded-lg bg-white">
              <Pagination
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                pageSize={pageSize}
                onPage={setPage}
              />
            </div>
          </>
        )
      ) : (
        <section className="overflow-hidden rounded-lg bg-white shadow-sm">
          {inquiries.isLoading ? (
            <p className="p-10 text-center text-muted">Loading inquiries...</p>
          ) : inquiries.isError ? (
            <p className="p-10 text-center text-red-600">
              {errorMessage(inquiries.error)}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-brand-soft text-left text-xs uppercase">
                  <tr>
                    <th className="px-5 py-4">Business</th>
                    <th className="px-4 py-4">WhatsApp</th>
                    <th className="px-4 py-4">Categories</th>
                    <th className="px-4 py-4">Received</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.data?.map((inquiry) => (
                    <tr key={inquiry._id} className="border-b border-black/5">
                      <td className="px-5 py-4 font-semibold">
                        {inquiry.businessName}
                      </td>
                      <td className="px-4 py-4">{inquiry.whatsappPhone}</td>
                      <td className="px-4 py-4 text-sm">
                        {inquiry.tradesToAdvertiseTo?.join(", ") || "All"}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {new Date(inquiry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={inquiry.status}
                          onChange={(event) =>
                            inquiryStatus.mutate({
                              id: inquiry._id,
                              status: event.target
                                .value as typeof inquiry.status,
                            })
                          }
                          className="form-control w-auto"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      <AdDialog
        key={editing?._id || (open ? "new" : "closed")}
        open={open}
        onOpenChange={setOpen}
        advertisement={editing}
      />
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

import axios from "axios";
import type { AdInquiry, AdminNotificationData, AdminPermission, AdminReview, Administrator, Advertisement, ApiResponse, AuditLog, Category, DashboardData, LoginUser, PaginationMeta, PlatformSettings, User } from "./types";

const configuredUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://187.77.187.56:5056";
const serverBaseURL = configuredUrl.replace(/\/$/, "").endsWith("/api/v1")
  ? configuredUrl.replace(/\/$/, "")
  : `${configuredUrl.replace(/\/$/, "")}/api/v1`;
const baseURL = typeof window === "undefined" ? serverBaseURL : "/api/proxy";

export const api = axios.create({ baseURL, timeout: 20000 });

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

export async function loginApi(payload: { email: string; password: string }) {
  const { data } = await api.post<ApiResponse<LoginUser>>("/auth/login", payload);
  return data.data;
}

export async function refreshAccessTokenApi(refreshToken: string) {
  const { data } = await api.post<ApiResponse<{ accessToken: string }>>("/auth/refresh-token", { refreshToken });
  return data.data.accessToken;
}

export async function forgotPasswordApi(email: string) {
  const { data } = await api.post<ApiResponse<{ email: string; otp?: string }>>("/auth/forget-password", { email });
  return data;
}

export async function verifyResetOtpApi(payload: { email: string; otp: string }) {
  const { data } = await api.post<ApiResponse<{ email: string; resetOtpVerified: boolean }>>("/auth/verify-reset-otp", payload);
  return data;
}

export async function resetPasswordApi(payload: { email: string; otp: string; password: string; confirmPassword: string }) {
  const { data } = await api.post<ApiResponse<never>>("/auth/reset-password", payload);
  return data;
}

export async function logoutApi() {
  const { data } = await api.post<ApiResponse<Record<string, never>>>("/auth/logout");
  return data;
}

export async function getDashboard() {
  const { data } = await api.get<ApiResponse<DashboardData>>("/admin/dashboard");
  return data.data;
}

export async function getOptions() {
  const { data } = await api.get<ApiResponse<{ skills: string[]; travelRanges: string[]; rateUnits: string[] }>>("/options");
  return data.data;
}

export async function getUsers(params: { type: string; page: number; limit: number; search?: string; verificationStatus?: string }) {
  const { data } = await api.get<ApiResponse<User[]>>("/admin/users", { params });
  return { users: data.data, meta: data.meta as PaginationMeta };
}

export async function toggleUserBlock(userId: string) {
  const { data } = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/toggle-block`);
  return data;
}

export async function deleteUser(userId: string) {
  const { data } = await api.delete<ApiResponse<never>>(`/admin/users/${userId}`);
  return data;
}

export type VipPayload = {
  userId: string; homeArea: string;
  travelRange: string; pitch: string; rateAmount: number; rateUnit: string; mainSkill: string;
};

export async function createVip(payload: VipPayload) {
  const { data } = await api.post<ApiResponse<unknown>>("/admin/users/vip", payload);
  return data;
}

export async function updateVerification(profileId: string, status: "verified" | "rejected", reason = "") {
  const { data } = await api.put<ApiResponse<unknown>>(`/admin/tradesman/${profileId}/verification`, { status, reason });
  return data;
}

export async function bulkUserAction(payload: { ids: string[]; action: "verify" | "reject" | "block" | "unblock" | "delete"; reason?: string }) {
  const { data } = await api.post<ApiResponse<{ affected: number }>>("/admin/users/bulk", payload);
  return data;
}

export async function bulkVerificationAction(payload: { ids: string[]; action: "verify" | "reject"; reason?: string }) {
  const { data } = await api.post<ApiResponse<{ affected: number }>>("/admin/verification/bulk", payload);
  return data;
}

export async function exportUsers(params: { type: string; search?: string }) {
  const response = await api.get("/admin/export/users", { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportReviews() {
  const response = await api.get("/admin/export/reviews", { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reviews-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getAdvertisements() {
  const { data } = await api.get<ApiResponse<Advertisement[]>>("/admin/advertisements");
  return data.data;
}

export async function createAdvertisement(payload: FormData) {
  const { data } = await api.post<ApiResponse<Advertisement>>("/admin/advertisements", payload);
  return data;
}

export async function updateAdvertisement(id: string, payload: FormData | Partial<Pick<Advertisement, "title" | "description" | "isActive">>) {
  const { data } = await api.patch<ApiResponse<Advertisement>>(`/admin/advertisements/${id}`, payload);
  return data;
}

export async function deleteAdvertisement(id: string) {
  const { data } = await api.delete<ApiResponse<never>>(`/admin/advertisements/${id}`);
  return data;
}

export async function getProfile() {
  const { data } = await api.get<ApiResponse<User>>("/user/me");
  return data.data;
}

export async function updateProfile(payload: { firstName: string; lastName: string; phoneNumber: string; area?: string }) {
  const { data } = await api.put<ApiResponse<User>>("/user/me", payload);
  return data;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  const { data } = await api.put<ApiResponse<never>>("/user/change-password", payload);
  return data;
}

export async function getAdministrators() {
  const { data } = await api.get<ApiResponse<Administrator[]>>("/admin/administrators");
  return data.data;
}

export type AdministratorPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: "admin" | "super-admin";
  permissions: AdminPermission[];
};

export async function createAdministrator(payload: AdministratorPayload) {
  const { data } = await api.post<ApiResponse<Administrator>>("/admin/administrators", payload);
  return data;
}

export async function updateAdministrator(
  adminId: string,
  payload: { role?: "admin" | "super-admin"; permissions?: AdminPermission[]; isBlocked?: boolean },
) {
  const { data } = await api.patch<ApiResponse<Administrator>>(`/admin/administrators/${adminId}`, payload);
  return data;
}

export async function getCategoriesAdmin() {
  const { data } = await api.get<ApiResponse<Category[]>>("/admin/categories");
  return data.data;
}

export async function createCategory(payload: { name: string; icon?: string; order?: number }) {
  const { data } = await api.post<ApiResponse<Category>>("/admin/categories", payload);
  return data;
}

export async function updateCategory(id: string, payload: Partial<Pick<Category, "name" | "icon" | "order" | "isActive">>) {
  const { data } = await api.patch<ApiResponse<Category>>(`/admin/categories/${id}`, payload);
  return data;
}

export async function getPlatformSettings() {
  const { data } = await api.get<ApiResponse<PlatformSettings>>("/admin/platform-settings");
  return data.data;
}

export async function updatePlatformSettings(payload: Pick<PlatformSettings, "vipSlotsPerCategory" | "sponsoredRotation" | "reviewModerationMode">) {
  const { data } = await api.patch<ApiResponse<PlatformSettings>>("/admin/platform-settings", payload);
  return data;
}

export async function getAuditLogs(params: { page: number; limit: number; search?: string; action?: string }) {
  const { data } = await api.get<ApiResponse<AuditLog[]>>("/admin/audit-logs", { params });
  return { logs: data.data, meta: data.meta as PaginationMeta };
}

export async function getNotifications() {
  const { data } = await api.get<ApiResponse<AdminNotificationData>>("/admin/notifications");
  return data.data;
}

export async function getReviewsAdmin(params: { page: number; limit: number; status?: string }) {
  const { data } = await api.get<ApiResponse<AdminReview[]>>("/admin/reviews", { params });
  return { reviews: data.data, meta: data.meta as PaginationMeta };
}

export async function moderateReview(id: string, payload: { status: "approved" | "rejected"; note?: string }) {
  const { data } = await api.patch<ApiResponse<AdminReview>>(`/admin/reviews/${id}`, payload);
  return data;
}

export async function getAdInquiries() {
  const { data } = await api.get<ApiResponse<AdInquiry[]>>("/admin/advertisement-inquiries");
  return data.data;
}

export async function updateAdInquiry(id: string, status: AdInquiry["status"]) {
  const { data } = await api.patch<ApiResponse<AdInquiry>>(`/admin/advertisement-inquiries/${id}`, { status });
  return data;
}

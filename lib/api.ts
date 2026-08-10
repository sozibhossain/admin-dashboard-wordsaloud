import axios from "axios";
import type { Advertisement, ApiResponse, DashboardData, LoginUser, PaginationMeta, User } from "./types";

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

export async function getUsers(params: { type: string; page: number; limit: number }) {
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

export async function updateVerification(profileId: string, status: "verified" | "rejected") {
  const { data } = await api.put<ApiResponse<unknown>>(`/admin/tradesman/${profileId}/verification`, { status });
  return data;
}

export async function getAdvertisements() {
  const { data } = await api.get<ApiResponse<Advertisement[]>>("/admin/advertisements");
  return data.data;
}

export async function createAdvertisement(payload: Pick<Advertisement, "title" | "description">) {
  const { data } = await api.post<ApiResponse<Advertisement>>("/admin/advertisements", payload);
  return data;
}

export async function updateAdvertisement(id: string, payload: Partial<Pick<Advertisement, "title" | "description" | "isActive">>) {
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

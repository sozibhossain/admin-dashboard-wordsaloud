export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type LoginUser = {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  area?: string;
  accessToken: string;
  refreshToken?: string;
};

export type TradesmanProfile = {
  _id: string;
  mainSkill?: string;
  homeArea?: string;
  travelRange?: string;
  pitch?: string;
  typicalRate?: { amount: number; unit: string };
  verificationStatus?: "pending" | "verified" | "rejected";
  isLive?: boolean;
  isVip?: boolean;
};

export type User = {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  role: "client" | "tradesman" | "admin";
  area?: string;
  isBlocked?: boolean;
  profileImage?: { url?: string };
  tradesmanProfile?: TradesmanProfile | null;
};

export type DashboardData = {
  totalUser: number;
  totalClient: number;
  totalTradesman: number;
  totalAdvertisement: number;
  monthlyOccupancyRate: { day: string; rate: number }[];
  userRegistrationRate: { month: string; count: number }[];
};

export type Advertisement = {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
};

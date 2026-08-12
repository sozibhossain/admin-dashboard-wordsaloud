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
  adminPermissions: AdminPermission[];
  area?: string;
  accessToken: string;
  refreshToken?: string;
};

export type AdminPermission = "dashboard" | "users" | "advertisements";

export type TradesmanProfile = {
  _id: string;
  mainSkill?: string;
  extraSkills?: string[];
  homeArea?: string;
  travelRange?: string;
  pitch?: string;
  typicalRate?: { amount: number; unit: string };
  workPhotos?: { public_id?: string; url?: string }[];
  verificationStatus?: "pending" | "verified" | "rejected";
  isLive?: boolean;
  isVip?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  jobsCount?: number;
  contactChangeRequest?: {
    requestedName?: string;
    requestedPhoneNumber?: string;
    reason?: string;
    status?: "none" | "pending" | "resolved";
    requestedAt?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  role: "client" | "tradesman" | "admin" | "super-admin";
  adminPermissions?: AdminPermission[];
  area?: string;
  isEmailVerified?: boolean;
  isProfileComplete?: boolean;
  isBlocked?: boolean;
  profileImage?: { public_id?: string; url?: string };
  tradesmanProfile?: TradesmanProfile | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Administrator = {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  role: "admin" | "super-admin";
  adminPermissions: AdminPermission[];
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
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

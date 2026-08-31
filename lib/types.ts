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

export type AdminPermission =
  | "dashboard"
  | "users"
  | "verification"
  | "advertisements"
  | "reviews"
  | "categories"
  | "exports"
  | "audit"
  | "settings";

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
  verification?: {
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    rejectionReason?: string;
    submittedAt?: string | null;
  };
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
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  role: "admin" | "super-admin";
  adminPermissions: AdminPermission[];
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminInvitation = {
  _id: string;
  email: string;
  status: "pending" | "expired" | "revoked" | "accepted";
  expiresAt: string;
  createdAt?: string;
  acceptUrl?: string;
  invitedBy?: { firstName?: string; lastName?: string; email: string };
};

export type DashboardData = {
  totalUser: number;
  totalClient: number;
  totalTradesman: number;
  totalAdvertisement: number;
  dailyTradesmanSignups: { day: string; date: string; count: number }[];
  userRegistrationRate: { month: string; count: number }[];
};

export type Advertisement = {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  media?: { mediaType: "image" | "video" | "none"; public_id?: string; url?: string; width?: number; height?: number; duration?: number };
  targetUrl?: string;
  categories?: string[];
  startDate?: string;
  endDate?: string | null;
  priority?: number;
  advertiser?: { name?: string; email?: string; phone?: string };
  createdAt: string;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  isActive: boolean;
  tradesmanCount: number;
  isNew?: boolean;
  newUntil?: string | null;
};

export type PlatformSettings = {
  _id: string;
  vipSlotsPerCategory: number;
  sponsoredRotation: "round-robin" | "priority" | "random";
  reviewModerationMode: "auto-approve" | "require-review";
  updatedAt: string;
};

export type AuditLog = {
  _id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  ip: string;
  createdAt: string;
};

export type AdminNotificationData = {
  unreadCount: number;
  counts: { verification: number; inquiries: number; reviews: number };
  items: { id: string; type: string; title: string; message: string; createdAt: string; href: string }[];
};

export type AdminReview = {
  _id: string;
  rating: number;
  ratingLabel: string;
  reviewText: string;
  moderationStatus: "pending" | "approved" | "rejected";
  moderationNote?: string;
  reviewer?: { firstName?: string; lastName?: string; email?: string };
  tradesman?: { user?: { firstName?: string; lastName?: string; email?: string } };
  createdAt: string;
};

export type AdInquiry = {
  _id: string;
  businessName: string;
  whatsappPhone: string;
  tradesToAdvertiseTo: string[];
  status: "new" | "contacted" | "closed";
  createdAt: string;
};

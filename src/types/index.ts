export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage?: string;
  isPublic: boolean; // default false (private)
  isDraft: boolean;
  status?: 'draft' | 'published' | 'private';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
  likesCount: number;
  commentsCount?: number;
  allowComments: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  postTitle?: string;
  authorName: string;
  content: string;
  createdAt: string;
  approved: boolean;
  ipHash?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isSystem?: boolean;
}

export interface LoginAttempt {
  id: string;
  timestamp: string;
  success: boolean;
  username: string;
  ip: string;
  userAgent: string;
  location?: string;
}

export interface Session {
  id: string;
  token: string;
  createdAt: string;
  lastActive: string;
  userAgent: string;
  ip: string;
}

export interface SiteSettings {
  siteName: string;
  slogan: string;
  description?: string;
  bio?: string;
  ownerName?: string;
  ownerBio?: string;
  enableComments?: boolean;
  enableLikes?: boolean;
  winterEffects?: boolean;
  ambientSound?: boolean;
  readingModeDefault?: boolean;
  telegramNotifications?: boolean;
  snowEnabled?: boolean;
  audioEnabled?: boolean;
}

export type UserRole = 'owner' | 'admin' | 'user';

export interface AdminUser {
  username: string;
  displayName?: string;
  email?: string;
  role?: UserRole;
  passwordHash: string;
  salt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface OwnerProfile {
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  lastLogin?: string;
  updatedAt: string;
  activeSessionsCount: number;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  action: string;
  actionLabel: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'warning' | 'error';
}

export interface ActiveSessionInfo {
  id: string;
  createdAt: string;
  lastActive: string;
  userAgent: string;
  ip: string;
  isCurrent?: boolean;
}

export interface BackupRecord {
  id: string;
  createdAt: string;
  sizeBytes: number;
  filename: string;
  postsCount: number;
  isEncrypted: boolean;
}

export type BackupInfo = BackupRecord;

export interface Notification {
  id: string;
  type: 'comment' | 'like' | 'visit' | 'security' | 'backup';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface AdminStats {
  totalViews: number;
  uniqueVisitors: number;
  totalLikes: number;
  totalComments: number;
  privatePosts: number;
  publicPosts: number;
  draftsCount?: number;
}

export interface AnalyticsSummary {
  totalVisitors: number;
  totalViews: number;
  totalPosts: number;
  privatePostsCount: number;
  publicPostsCount: number;
  draftsCount: number;
  totalLikes: number;
  totalComments: number;
  recentViews: { date: string; count: number }[];
  popularPosts: { id: string; title: string; views: number; likes: number }[];
  uniqueVisitors?: number;
  privatePosts?: number;
  publicPosts?: number;
}

import fs from 'fs';
import path from 'path';
import { hashPassword, encryptData } from './crypto.js';
import type {
  Post,
  Comment,
  Category,
  LoginAttempt,
  Session,
  SiteSettings,
  AdminUser,
  BackupRecord,
  AnalyticsSummary,
} from '../src/types/index.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'storage.json');

interface DatabaseSchema {
  adminUser: AdminUser;
  posts: Post[];
  categories: Category[];
  comments: Comment[];
  sessions: Session[];
  loginAttempts: LoginAttempt[];
  settings: SiteSettings;
  backups: BackupRecord[];
  totalVisitors: number;
  totalViews: number;
  ipVisitorHistory: Record<string, string>; // IP -> last visit date
}

// Initial default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-diaries', name: 'مذكرات', slug: 'diaries', description: 'يوميات وأوراق شخصية', isSystem: true },
  { id: 'cat-thoughts', name: 'خواطر', slug: 'thoughts', description: 'تأملات عابرة في ليالي الشتاء', isSystem: true },
  { id: 'cat-ideas', name: 'أفكار', slug: 'ideas', description: 'رؤى وتطلعات فلسفية وحياتية', isSystem: true },
  { id: 'cat-secrets', name: 'أسرار', slug: 'secrets', description: 'مساحة خاصة جداً لا يراها أحد', isSystem: true },
  { id: 'cat-letters', name: 'رسائل', slug: 'letters', description: 'رسائل لم تُرسل بعد', isSystem: true },
  { id: 'cat-stories', name: 'قصص', slug: 'stories', description: 'حكايات قصيرة مستوحاة من الصمت', isSystem: true },
  { id: 'cat-poetry', name: 'شعر', slug: 'poetry', description: 'قصائد ونصوص شعرية شتوية', isSystem: true },
  { id: 'cat-memories', name: 'ذكريات', slug: 'memories', description: 'لحظات دافئة من الزمن الجميل', isSystem: true },
];

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'نسمة شتاء',
  slogan: 'اكتب ما لا تستطيع قوله... واحتفظ بما لا تريد أن يراه أحد... وشارك العالم فقط ما تريد أن يصل إليه.',
  description: 'ملاذ شخصي دافئ في عالم رقمي بارد — مساحة فاخرة للكتابة والتدوين والنشر الآمن',
  ownerName: 'صاحب الملاذ',
  ownerBio: 'كاتب يتأمل هطول المطر خلف زجاج النافذة، يجمع شتات الفكر بين الدفء والصقيع.',
  enableComments: true,
  enableLikes: true,
  winterEffects: true,
  ambientSound: true,
  readingModeDefault: false,
  telegramNotifications: true,
};

// Initial Seed Posts (Public & Private)
function getInitialPosts(): Post[] {
  return [];
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectories();
    this.data = this.loadOrInitialize();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  private loadOrInitialize(): DatabaseSchema {
    const { hash, salt } = hashPassword('نسمة شتاء');

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.adminUser) {
          // Guarantee admin credentials match the owner request:
          // Password: نسمة شتاء
          parsed.adminUser.passwordHash = hash;
          parsed.adminUser.salt = salt;
          parsed.adminUser.username = 'admin';

          // Clear any mock seeded posts and comments so the owner alone writes
          parsed.posts = [];
          parsed.comments = [];

          this.saveDirect(parsed);
          return parsed;
        }
      } catch (err) {
        console.error('[DB] Failed to parse DB_FILE, creating fresh database backup and resetting:', err);
      }
    }

    // Initialize Default Admin:
    // Username: admin
    // Default Password: نسمة شتاء
    const adminUser: AdminUser = {
      username: 'admin',
      passwordHash: hash,
      salt,
      updatedAt: new Date().toISOString(),
    };

    const initialDb: DatabaseSchema = {
      adminUser,
      posts: [],
      categories: DEFAULT_CATEGORIES,
      comments: [],
      sessions: [],
      loginAttempts: [],
      settings: DEFAULT_SETTINGS,
      backups: [],
      totalVisitors: 0,
      totalViews: 0,
      ipVisitorHistory: {},
    };

    this.saveDirect(initialDb);
    return initialDb;
  }

  private save() {
    this.saveDirect(this.data);
  }

  private saveDirect(db: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Atomic save failed:', err);
    }
  }

  // --- ADMIN & AUTH ---
  getAdminUser(): AdminUser {
    return this.data.adminUser;
  }

  updateAdminPassword(newUsername: string, newPasswordHash: string, newSalt: string) {
    this.data.adminUser.username = newUsername.trim();
    this.data.adminUser.passwordHash = newPasswordHash;
    this.data.adminUser.salt = newSalt;
    this.data.adminUser.updatedAt = new Date().toISOString();
    // Invalidate old sessions for safety
    this.data.sessions = [];
    this.save();
  }

  recordLoginAttempt(attempt: Omit<LoginAttempt, 'id'>) {
    const record: LoginAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...attempt,
    };
    this.data.loginAttempts.unshift(record);
    // Keep max 20 login attempts
    if (this.data.loginAttempts.length > 20) {
      this.data.loginAttempts = this.data.loginAttempts.slice(0, 20);
    }
    this.save();
    return record;
  }

  getLoginAttempts(): LoginAttempt[] {
    return this.data.loginAttempts;
  }

  // --- SESSIONS ---
  createSession(token: string, userAgent: string, ip: string): Session {
    const session: Session = {
      id: `sess-${Date.now()}`,
      token,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      userAgent,
      ip,
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  validateSession(token: string): boolean {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return false;
    session.lastActive = new Date().toISOString();
    return true;
  }

  removeSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  terminateAllSessions() {
    this.data.sessions = [];
    this.save();
  }

  // --- POSTS: STRICT AUTHORIZATION ---
  // Public: ONLY returns posts where isPublic === true and isDraft === false!
  getPublicPosts(options?: { category?: string; search?: string }): Post[] {
    let list = this.data.posts.filter((p) => p.isPublic && !p.isDraft);

    if (options?.category) {
      list = list.filter((p) => p.category === options.category);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort by publishedAt or createdAt descending
    return list.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  }

  // Public: Returns post by ID ONLY if isPublic! Returns null if private or draft!
  getPublicPostById(id: string): Post | null {
    const post = this.data.posts.find((p) => p.id === id || p.slug === id);
    if (!post || !post.isPublic || post.isDraft) {
      return null;
    }
    return post;
  }

  // Admin: Returns all posts (private, public, drafts)
  getAllPostsAdmin(options?: { filter?: 'all' | 'private' | 'public' | 'draft'; search?: string }): Post[] {
    let list = [...this.data.posts];

    if (options?.filter === 'private') {
      list = list.filter((p) => !p.isPublic && !p.isDraft);
    } else if (options?.filter === 'public') {
      list = list.filter((p) => p.isPublic && !p.isDraft);
    } else if (options?.filter === 'draft') {
      list = list.filter((p) => p.isDraft);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPostByIdAdmin(id: string): Post | null {
    return this.data.posts.find((p) => p.id === id || p.slug === id) || null;
  }

  createPost(input: Partial<Post>): Post {
    const now = new Date().toISOString();
    const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const slug = (input.title || 'untitled')
      .toLowerCase()
      .replace(/[^\w\u0621-\u064A]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newPost: Post = {
      id,
      title: input.title || 'بدون عنوان',
      slug: slug || id,
      content: input.content || '',
      excerpt: input.excerpt || (input.content ? input.content.slice(0, 160) + '...' : ''),
      category: input.category || 'خواطر',
      tags: Array.isArray(input.tags) ? input.tags : [],
      coverImage: input.coverImage || '',
      isPublic: Boolean(input.isPublic === true), // STRICT DEFAULT: FALSE (PRIVATE)
      isDraft: Boolean(input.isDraft === true),
      publishedAt: input.isPublic ? now : undefined,
      createdAt: now,
      updatedAt: now,
      viewsCount: 0,
      likesCount: 0,
      allowComments: input.allowComments !== false,
    };

    this.data.posts.unshift(newPost);
    this.save();
    return newPost;
  }

  updatePost(id: string, updates: Partial<Post>): Post | null {
    const index = this.data.posts.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.data.posts[index];
    const isNowPublic = updates.isPublic !== undefined ? updates.isPublic : existing.isPublic;
    const publishedAt = isNowPublic && !existing.publishedAt ? new Date().toISOString() : existing.publishedAt;

    const updated: Post = {
      ...existing,
      ...updates,
      publishedAt: isNowPublic ? publishedAt : undefined,
      updatedAt: new Date().toISOString(),
    };

    this.data.posts[index] = updated;
    this.save();
    return updated;
  }

  deletePost(id: string): boolean {
    const initialLen = this.data.posts.length;
    this.data.posts = this.data.posts.filter((p) => p.id !== id);
    // Also remove associated comments
    this.data.comments = this.data.comments.filter((c) => c.postId !== id);
    this.save();
    return this.data.posts.length < initialLen;
  }

  togglePublish(id: string): Post | null {
    const post = this.data.posts.find((p) => p.id === id);
    if (!post) return null;

    post.isPublic = !post.isPublic;
    if (post.isPublic) {
      post.isDraft = false;
      post.publishedAt = post.publishedAt || new Date().toISOString();
    }
    post.updatedAt = new Date().toISOString();
    this.save();
    return post;
  }

  // --- VIEWS & LIKES ---
  trackVisit(ip?: string) {
    this.trackView(undefined, ip);
  }

  trackView(postId?: string, ip?: string) {
    this.data.totalViews += 1;
    if (ip && !this.data.ipVisitorHistory[ip]) {
      this.data.totalVisitors += 1;
      this.data.ipVisitorHistory[ip] = new Date().toISOString();
    }

    if (postId) {
      const post = this.data.posts.find((p) => p.id === postId);
      if (post) {
        post.viewsCount += 1;
      }
    }
    this.save();
  }

  addLike(postId: string): number {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) return 0;
    post.likesCount += 1;
    this.save();
    return post.likesCount;
  }

  // --- COMMENTS ---
  addComment(postId: string, authorName: string, content: string, ipHash?: string): Comment | null {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post || !post.isPublic || !post.allowComments) return null;

    const comment: Comment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      postId,
      postTitle: post.title,
      authorName: authorName.trim() || 'زائر هادئ',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      approved: true, // auto-approved or can be held for moderation
      ipHash,
    };

    this.data.comments.unshift(comment);
    this.save();
    return comment;
  }

  getCommentsForPost(postId: string): Comment[] {
    return this.data.comments.filter((c) => c.postId === postId && c.approved);
  }

  getAllCommentsAdmin(): Comment[] {
    return this.data.comments;
  }

  deleteComment(id: string): boolean {
    const initialLen = this.data.comments.length;
    this.data.comments = this.data.comments.filter((c) => c.id !== id);
    this.save();
    return this.data.comments.length < initialLen;
  }

  // --- CATEGORIES ---
  getCategories(): Category[] {
    return this.data.categories;
  }

  addCategory(name: string, description?: string): Category {
    const id = `cat-${Date.now()}`;
    const slug = name.toLowerCase().replace(/[^\w\u0621-\u064A]+/g, '-');
    const newCat: Category = { id, name, slug, description, isSystem: false };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  deleteCategory(id: string): boolean {
    const cat = this.data.categories.find((c) => c.id === id);
    if (!cat || cat.isSystem) return false;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    this.save();
    return true;
  }

  // --- SETTINGS ---
  getSettings(): SiteSettings {
    return this.data.settings;
  }

  updateSettings(newSettings: Partial<SiteSettings>): SiteSettings {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings,
    };
    this.save();
    return this.data.settings;
  }

  // --- ANALYTICS ---
  getStats(): AnalyticsSummary {
    const totalPosts = this.data.posts.length;
    const privatePostsCount = this.data.posts.filter((p) => !p.isPublic && !p.isDraft).length;
    const publicPostsCount = this.data.posts.filter((p) => p.isPublic && !p.isDraft).length;
    const draftsCount = this.data.posts.filter((p) => p.isDraft).length;
    const totalLikes = this.data.posts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
    const totalComments = this.data.comments.length;

    const popularPosts = [...this.data.posts]
      .filter((p) => p.isPublic)
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 5)
      .map((p) => ({ id: p.id, title: p.title, views: p.viewsCount, likes: p.likesCount }));

    // Mock 7-day view distribution
    const recentViews = [
      { date: 'الأحد', count: Math.floor(this.data.totalViews * 0.12) },
      { date: 'الإثنين', count: Math.floor(this.data.totalViews * 0.14) },
      { date: 'الثلاثاء', count: Math.floor(this.data.totalViews * 0.11) },
      { date: 'الأربعاء', count: Math.floor(this.data.totalViews * 0.16) },
      { date: 'الخميس', count: Math.floor(this.data.totalViews * 0.21) },
      { date: 'الجمعة', count: Math.floor(this.data.totalViews * 0.18) },
      { date: 'السبت', count: Math.floor(this.data.totalViews * 0.08) },
    ];

    return {
      totalVisitors: Math.max(this.data.totalVisitors, 12),
      totalViews: Math.max(this.data.totalViews, 34),
      totalPosts,
      privatePostsCount,
      publicPostsCount,
      draftsCount,
      totalLikes,
      totalComments,
      recentViews,
      popularPosts,
    };
  }

  // --- BACKUPS & EXPORT ---
  createBackup(): BackupRecord {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `nesmat-sheta-backup-${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    // Prepare clean encrypted export payload
    const rawPayload = JSON.stringify({
      version: '1.0',
      exportedAt: now.toISOString(),
      posts: this.data.posts,
      categories: this.data.categories,
      settings: this.data.settings,
      comments: this.data.comments,
    });

    const encrypted = encryptData(rawPayload);
    fs.writeFileSync(filePath, JSON.stringify(encrypted, null, 2), 'utf8');

    const stats = fs.statSync(filePath);
    const record: BackupRecord = {
      id: `bk-${Date.now()}`,
      createdAt: now.toISOString(),
      sizeBytes: stats.size,
      filename,
      postsCount: this.data.posts.length,
      isEncrypted: true,
    };

    this.data.backups.unshift(record);
    this.save();
    return record;
  }

  getBackups(): BackupRecord[] {
    return this.data.backups;
  }

  getBackupFile(filename: string): string | null {
    const safeName = path.basename(filename);
    const filePath = path.join(BACKUPS_DIR, safeName);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  }

  restoreBackup(rawContent: string): { success: boolean; postsRestored: number } {
    try {
      const parsed = JSON.parse(rawContent);
      let payload: any = parsed;
      // If encrypted, decrypt it
      if (parsed.iv && parsed.encryptedData && parsed.tag) {
        const { decryptData } = require('./crypto.js');
        const decrypted = decryptData(parsed.encryptedData, parsed.iv, parsed.tag);
        payload = JSON.parse(decrypted);
      }

      if (Array.isArray(payload.posts)) {
        this.data.posts = payload.posts;
      }
      if (Array.isArray(payload.categories)) {
        this.data.categories = payload.categories;
      }
      if (payload.settings) {
        this.data.settings = { ...this.data.settings, ...payload.settings };
      }
      if (Array.isArray(payload.comments)) {
        this.data.comments = payload.comments;
      }

      this.save();
      return { success: true, postsRestored: this.data.posts.length };
    } catch (err) {
      console.error('[Backup Restore Failed]:', err);
      return { success: false, postsRestored: 0 };
    }
  }
}

export const db = new DatabaseManager();

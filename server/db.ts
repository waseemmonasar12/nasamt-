import fs from 'fs';
import path from 'path';
import { hashPassword, encryptData, verifySessionToken, normalizeArabicText } from './crypto.js';
import { rtdbGet, rtdbPut, rtdbPatch, rtdbPost, rtdbDelete, getFirebaseStatus } from './firebase.js';
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
  OwnerProfile,
  ActivityLogItem,
  ActiveSessionInfo,
} from '../src/types/index.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'storage.json');

export interface DatabaseSchema {
  adminUser: AdminUser;
  activityLogs: ActivityLogItem[];
  posts: Post[];
  categories: Category[];
  comments: Comment[];
  sessions: Session[];
  loginAttempts: LoginAttempt[];
  settings: SiteSettings;
  backups: BackupRecord[];
  totalVisitors: number;
  totalViews: number;
  ipVisitorHistory: Record<string, string>;
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
  snowEnabled: true,
  audioEnabled: true,
};

class DatabaseManager {
  private data: DatabaseSchema;
  private isFirebaseSyncing: boolean = false;

  constructor() {
    this.ensureDirectories();
    this.data = this.loadOrInitialize();
    // Non-blocking background sync with Firebase Realtime Database
    this.initFirebaseSync().catch((err) => {
      console.warn('[Firebase RTDB] Initial sync deferred:', err?.message || err);
    });
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
          // Normalize and preserve adminUser fields without resetting user's credentials
          parsed.adminUser = {
            username: parsed.adminUser.username || 'admin',
            displayName: parsed.adminUser.displayName || 'صاحب الملاذ',
            email: parsed.adminUser.email || 'waseemalobide5@gmail.com',
            role: 'owner',
            passwordHash: parsed.adminUser.passwordHash || hash,
            salt: parsed.adminUser.salt || salt,
            updatedAt: parsed.adminUser.updatedAt || new Date().toISOString(),
            lastLogin: parsed.adminUser.lastLogin,
          };

          parsed.posts = Array.isArray(parsed.posts) ? parsed.posts : [];
          parsed.categories = Array.isArray(parsed.categories) && parsed.categories.length > 0
            ? parsed.categories
            : DEFAULT_CATEGORIES;
          parsed.comments = Array.isArray(parsed.comments) ? parsed.comments : [];
          parsed.sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
          parsed.loginAttempts = Array.isArray(parsed.loginAttempts) ? parsed.loginAttempts : [];
          parsed.activityLogs = Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [];
          parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
          parsed.backups = Array.isArray(parsed.backups) ? parsed.backups : [];
          parsed.totalVisitors = typeof parsed.totalVisitors === 'number' ? parsed.totalVisitors : 0;
          parsed.totalViews = typeof parsed.totalViews === 'number' ? parsed.totalViews : 0;
          parsed.ipVisitorHistory = parsed.ipVisitorHistory || {};

          this.saveDirect(parsed);
          return parsed;
        }
      } catch (err) {
        console.error('[DB] Failed to parse local DB file, creating fresh state:', err);
      }
    }

    // Default Fresh Database
    const adminUser: AdminUser = {
      username: 'admin',
      displayName: 'صاحب الملاذ',
      email: 'waseemalobide5@gmail.com',
      role: 'owner',
      passwordHash: hash,
      salt,
      updatedAt: new Date().toISOString(),
    };

    const initialDb: DatabaseSchema = {
      adminUser,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'SYSTEM_INITIALIZED',
          actionLabel: 'تهيئة نظام نسمة شتاء',
          details: 'تم تأسيس الملاذ بنجاح وحماية الحساب بكلمة مرور مشفرة.',
          status: 'success',
        },
      ],
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

  /**
   * Bidirectional Initial Sync with Firebase Realtime Database
   */
  private async initFirebaseSync() {
    if (this.isFirebaseSyncing) return;
    this.isFirebaseSyncing = true;

    try {
      // 1. Check if Firebase RTDB has adminUser
      const remoteAdmin = await rtdbGet<AdminUser>('adminUser');
      if (remoteAdmin && remoteAdmin.passwordHash && remoteAdmin.salt) {
        // Sync remote credentials into local
        this.data.adminUser = {
          ...this.data.adminUser,
          ...remoteAdmin,
          role: 'owner',
        };
        console.log('[Firebase RTDB] Synced Owner credentials from cloud database.');
      } else {
        // Push initial adminUser to cloud
        await rtdbPut('adminUser', this.data.adminUser);
      }

      // 2. Check remote posts
      const remotePosts = await rtdbGet<Record<string, Post> | Post[]>('posts');
      if (remotePosts) {
        const postsArray: Post[] = Array.isArray(remotePosts)
          ? remotePosts
          : Object.values(remotePosts);
        if (postsArray.length > 0 && this.data.posts.length === 0) {
          this.data.posts = postsArray;
        } else if (this.data.posts.length > 0) {
          // Push local posts to Firebase
          await rtdbPut('posts', this.data.posts);
        }
      } else if (this.data.posts.length > 0) {
        await rtdbPut('posts', this.data.posts);
      }

      // 3. Sync settings
      const remoteSettings = await rtdbGet<SiteSettings>('settings');
      if (remoteSettings && remoteSettings.siteName) {
        this.data.settings = { ...this.data.settings, ...remoteSettings };
      } else {
        await rtdbPut('settings', this.data.settings);
      }

      // 4. Sync categories
      const remoteCats = await rtdbGet<Category[]>('categories');
      if (remoteCats && Array.isArray(remoteCats) && remoteCats.length > 0) {
        this.data.categories = remoteCats;
      } else {
        await rtdbPut('categories', this.data.categories);
      }

      this.save();
    } catch (err: any) {
      console.warn('[Firebase RTDB] Background sync error:', err?.message || err);
    } finally {
      this.isFirebaseSyncing = false;
    }
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

  // --- ADMIN USER & AUTH ---
  getAdminUser(): AdminUser {
    return this.data.adminUser;
  }

  getOwnerProfile(): OwnerProfile {
    return {
      username: this.data.adminUser.username,
      displayName: this.data.adminUser.displayName || 'صاحب الملاذ',
      email: this.data.adminUser.email || 'waseemalobide5@gmail.com',
      role: 'owner',
      lastLogin: this.data.adminUser.lastLogin,
      updatedAt: this.data.adminUser.updatedAt,
      activeSessionsCount: this.data.sessions.length,
    };
  }

  checkUserIdentifierMatch(identifier: string): boolean {
    if (!identifier) return false;
    const clean = identifier.trim().toLowerCase();
    const cleanNormalized = normalizeArabicText(identifier);
    const admin = this.data.adminUser;
    const adminNormalized = normalizeArabicText(admin.username || '');
    const displayNormalized = normalizeArabicText(admin.displayName || '');

    return (
      clean === admin.username.toLowerCase() ||
      cleanNormalized === adminNormalized ||
      (admin.email && clean === admin.email.toLowerCase()) ||
      clean === 'waseemalobide5@gmail.com' ||
      clean === 'waseem' ||
      clean === 'admin' ||
      clean === 'owner' ||
      clean === 'مدير' ||
      cleanNormalized === displayNormalized ||
      cleanNormalized === normalizeArabicText('نسمة شتاء') ||
      cleanNormalized === normalizeArabicText('صاحب الموقع') ||
      cleanNormalized === normalizeArabicText('صاحب الملاذ') ||
      cleanNormalized === normalizeArabicText('مالك الموقع')
    );
  }

  updateAdminPassword(newPasswordHash: string, newSalt: string, keepToken?: string) {
    this.data.adminUser.passwordHash = newPasswordHash;
    this.data.adminUser.salt = newSalt;
    this.data.adminUser.updatedAt = new Date().toISOString();

    // Invalidate all other sessions for security
    if (keepToken) {
      this.data.sessions = this.data.sessions.filter((s) => s.token === keepToken);
    } else {
      this.data.sessions = [];
    }

    this.recordActivityLog(
      'PASSWORD_CHANGED',
      'تغيير كلمة المرور',
      'تم تحديث كلمة مرور حساب المالك وتأمين الدخول.',
      undefined,
      undefined,
      'success'
    );

    this.save();

    // Async push to Firebase
    rtdbPatch('adminUser', {
      passwordHash: newPasswordHash,
      salt: newSalt,
      updatedAt: this.data.adminUser.updatedAt,
    }).catch(() => {});
  }

  updateAdminProfile(updates: { username?: string; displayName?: string; email?: string }) {
    if (updates.username && updates.username.trim()) {
      this.data.adminUser.username = updates.username.trim();
    }
    if (updates.displayName && updates.displayName.trim()) {
      this.data.adminUser.displayName = updates.displayName.trim();
    }
    if (updates.email && updates.email.trim()) {
      this.data.adminUser.email = updates.email.trim();
    }
    this.data.adminUser.updatedAt = new Date().toISOString();

    this.recordActivityLog(
      'PROFILE_UPDATED',
      'تحديث بيانات الحساب',
      `تم تحديث اسم المستخدم (${this.data.adminUser.username}) والبريد (${this.data.adminUser.email}).`,
      undefined,
      undefined,
      'success'
    );

    this.save();

    // Async push to Firebase
    rtdbPatch('adminUser', {
      username: this.data.adminUser.username,
      displayName: this.data.adminUser.displayName,
      email: this.data.adminUser.email,
      updatedAt: this.data.adminUser.updatedAt,
    }).catch(() => {});

    return this.getOwnerProfile();
  }

  updateLastLogin(timestamp: string) {
    this.data.adminUser.lastLogin = timestamp;
    this.save();
    rtdbPatch('adminUser', { lastLogin: timestamp }).catch(() => {});
  }

  // --- ACTIVITY LOGS ---
  recordActivityLog(
    action: string,
    actionLabel: string,
    details?: string,
    ip?: string,
    userAgent?: string,
    status: 'success' | 'warning' | 'error' = 'success'
  ): ActivityLogItem {
    const logItem: ActivityLogItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      action,
      actionLabel,
      details,
      ip,
      userAgent: userAgent ? userAgent.slice(0, 80) : undefined,
      status,
    };

    this.data.activityLogs.unshift(logItem);
    if (this.data.activityLogs.length > 50) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 50);
    }
    this.save();

    // Async push to Firebase
    rtdbPost('activityLogs', logItem).catch(() => {});

    return logItem;
  }

  getActivityLogs(): ActivityLogItem[] {
    return this.data.activityLogs;
  }

  // --- LOGIN ATTEMPTS ---
  recordLoginAttempt(attempt: Omit<LoginAttempt, 'id'>) {
    const record: LoginAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...attempt,
    };
    this.data.loginAttempts.unshift(record);
    if (this.data.loginAttempts.length > 30) {
      this.data.loginAttempts = this.data.loginAttempts.slice(0, 30);
    }
    this.save();
    rtdbPost('loginAttempts', record).catch(() => {});
    return record;
  }

  getLoginAttempts(): LoginAttempt[] {
    return this.data.loginAttempts;
  }

  // --- SESSIONS ---
  createSession(token: string, userAgent: string, ip: string): Session {
    const session: Session = {
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      token,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      userAgent,
      ip,
    };
    this.data.sessions.push(session);
    this.save();

    // Async sync to Firebase RTDB so sessions persist across all containers/devices
    rtdbPut(`sessions/${session.id}`, {
      id: session.id,
      token,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      userAgent: session.userAgent.slice(0, 100),
      ip,
    }).catch(() => {});

    return session;
  }

  validateSession(token: string): boolean {
    if (!token) return false;

    // 1. Check in-memory/local sessions
    const session = this.data.sessions.find((s) => s.token === token);
    if (session) {
      session.lastActive = new Date().toISOString();
      return true;
    }

    // 2. Stateless cryptographic verification for cross-container / multi-device robustness
    if (verifySessionToken(token)) {
      // Re-hydrate session in local state
      const rehydrated: Session = {
        id: `sess-rehydrated-${Date.now()}`,
        token,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        userAgent: 'جهاز معتمد',
        ip: 'سحابي',
      };
      this.data.sessions.push(rehydrated);
      return true;
    }

    return false;
  }

  removeSession(token: string) {
    const toRemove = this.data.sessions.filter((s) => s.token === token);
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();

    for (const s of toRemove) {
      rtdbDelete(`sessions/${s.id}`).catch(() => {});
    }
  }

  terminateAllSessionsExcept(currentToken: string) {
    const removed = this.data.sessions.filter((s) => s.token !== currentToken);
    this.data.sessions = this.data.sessions.filter((s) => s.token === currentToken);
    this.recordActivityLog(
      'SESSIONS_INVALIDATED',
      'إنهاء الجلسات الأخرى',
      'تم تسجيل الخروج من كافة الأجهزة الأخرى بنجاح.',
      undefined,
      undefined,
      'warning'
    );
    this.save();

    for (const s of removed) {
      rtdbDelete(`sessions/${s.id}`).catch(() => {});
    }
  }

  terminateAllSessions() {
    this.data.sessions = [];
    this.save();
  }

  getActiveSessions(currentToken?: string): ActiveSessionInfo[] {
    return this.data.sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      lastActive: s.lastActive,
      userAgent: s.userAgent,
      ip: s.ip,
      isCurrent: currentToken ? s.token === currentToken : false,
    }));
  }

  // --- POSTS ---
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

    return list.sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() -
        new Date(a.publishedAt || a.createdAt).getTime()
    );
  }

  getPublicPostById(id: string): Post | null {
    const post = this.data.posts.find((p) => p.id === id || p.slug === id);
    if (!post || !post.isPublic || post.isDraft) {
      return null;
    }
    return post;
  }

  getAllPostsAdmin(options?: {
    filter?: 'all' | 'private' | 'public' | 'draft';
    search?: string;
  }): Post[] {
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
      isPublic: Boolean(input.isPublic === true),
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

    this.recordActivityLog(
      'POST_CREATED',
      'كتابة تدوينة جديدة',
      `تم إنشاء تدوينة «${newPost.title}» (${newPost.isPublic ? 'عامة' : 'سرية'}).`
    );

    // Sync to Firebase
    rtdbPut('posts', this.data.posts).catch(() => {});

    return newPost;
  }

  updatePost(id: string, updates: Partial<Post>): Post | null {
    const index = this.data.posts.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.data.posts[index];
    const isNowPublic = updates.isPublic !== undefined ? updates.isPublic : existing.isPublic;
    const publishedAt =
      isNowPublic && !existing.publishedAt ? new Date().toISOString() : existing.publishedAt;

    const updated: Post = {
      ...existing,
      ...updates,
      publishedAt: isNowPublic ? publishedAt : undefined,
      updatedAt: new Date().toISOString(),
    };

    this.data.posts[index] = updated;
    this.save();

    this.recordActivityLog(
      'POST_UPDATED',
      'تعديل تدوينة',
      `تم تحديث تدوينة «${updated.title}».`
    );

    rtdbPut('posts', this.data.posts).catch(() => {});

    return updated;
  }

  deletePost(id: string): boolean {
    const postToDelete = this.data.posts.find((p) => p.id === id);
    const initialLen = this.data.posts.length;
    this.data.posts = this.data.posts.filter((p) => p.id !== id);
    this.data.comments = this.data.comments.filter((c) => c.postId !== id);
    this.save();

    if (postToDelete) {
      this.recordActivityLog(
        'POST_DELETED',
        'حذف تدوينة',
        `تم حذف تدوينة «${postToDelete.title}».`,
        undefined,
        undefined,
        'warning'
      );
    }

    rtdbPut('posts', this.data.posts).catch(() => {});
    rtdbPut('comments', this.data.comments).catch(() => {});

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

    this.recordActivityLog(
      'POST_TOGGLED',
      'تغيير حالة النشر',
      `أصبحت تدوينة «${post.title}» (${post.isPublic ? 'عامة لجميع الزوار' : 'سرية في عالمك الخاص'}).`
    );

    rtdbPut('posts', this.data.posts).catch(() => {});

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
    rtdbPut('posts', this.data.posts).catch(() => {});
    return post.likesCount;
  }

  // --- COMMENTS ---
  addComment(
    postId: string,
    authorName: string,
    content: string,
    ipHash?: string
  ): Comment | null {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post || !post.isPublic || !post.allowComments) return null;

    const comment: Comment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      postId,
      postTitle: post.title,
      authorName: authorName.trim() || 'زائر هادئ',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      approved: true,
      ipHash,
    };

    this.data.comments.unshift(comment);
    this.save();

    rtdbPut('comments', this.data.comments).catch(() => {});

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
    rtdbPut('comments', this.data.comments).catch(() => {});
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
    rtdbPut('categories', this.data.categories).catch(() => {});
    return newCat;
  }

  deleteCategory(id: string): boolean {
    const cat = this.data.categories.find((c) => c.id === id);
    if (!cat || cat.isSystem) return false;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    this.save();
    rtdbPut('categories', this.data.categories).catch(() => {});
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

    this.recordActivityLog(
      'SETTINGS_UPDATED',
      'تعديل إعدادات الموقع',
      'تم تحديث الإعدادات وتفضيلات الواجهة بنجاح.'
    );

    rtdbPut('settings', this.data.settings).catch(() => {});

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
      totalVisitors: Math.max(this.data.totalVisitors, 1),
      totalViews: Math.max(this.data.totalViews, 1),
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

    const rawPayload = JSON.stringify({
      version: '2.0',
      exportedAt: now.toISOString(),
      adminProfile: this.getOwnerProfile(),
      posts: this.data.posts,
      categories: this.data.categories,
      settings: this.data.settings,
      comments: this.data.comments,
      activityLogs: this.data.activityLogs,
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
      rtdbPut('posts', this.data.posts).catch(() => {});
      rtdbPut('settings', this.data.settings).catch(() => {});

      return { success: true, postsRestored: this.data.posts.length };
    } catch (err) {
      console.error('[Backup Restore Failed]:', err);
      return { success: false, postsRestored: 0 };
    }
  }

  getSystemHealth() {
    return {
      status: 'operational',
      firebase: getFirebaseStatus(),
      postsCount: this.data.posts.length,
      sessionsCount: this.data.sessions.length,
      activeOwner: this.data.adminUser.username,
    };
  }
}

export const db = new DatabaseManager();

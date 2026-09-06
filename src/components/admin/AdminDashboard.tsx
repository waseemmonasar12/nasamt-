import React, { useState, useEffect } from 'react';
import {
  Home,
  Feather,
  Lock,
  Plus,
  BarChart3,
  Bell,
  Shield,
  Settings,
  Database,
  LogOut,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Eye,
  Heart,
  UserCheck,
  Send,
  User,
} from 'lucide-react';
import type { Post, Category, SiteSettings, Comment, AdminStats, Notification } from '../../types/index.js';
import { apiRequest, setAuthToken } from '../../utils/api.js';
import { SecretSanctuary } from './SecretSanctuary.js';
import { PostEditor } from './PostEditor.js';
import { PostsManager } from './PostsManager.js';
import { SecurityTab } from './SecurityTab.js';
import { BackupsTab } from './BackupsTab.js';
import { SettingsTab } from './SettingsTab.js';
import { CommentsTab } from './CommentsTab.js';
import { AccountManagementTab } from './AccountManagementTab.js';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigatePublic: (view: string, postId?: string) => void;
}

type AdminNavTab =
  | 'home'
  | 'account'
  | 'sanctuary'
  | 'posts'
  | 'new_post'
  | 'comments'
  | 'stats'
  | 'notifications'
  | 'security'
  | 'settings'
  | 'backups';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onNavigatePublic,
}) => {
  const [activeTab, setActiveTab] = useState<AdminNavTab>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Editing post state
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [postsRes, catsRes, settingsRes, commentsRes, notifsRes, statsRes] = await Promise.allSettled([
        apiRequest<{ success: boolean; posts: Post[] }>('/api/admin/posts'),
        apiRequest<{ success: boolean; categories: Category[] }>('/api/public/categories'),
        apiRequest<{ success: boolean; settings: SiteSettings }>('/api/public/settings'),
        apiRequest<{ success: boolean; comments: Comment[] }>('/api/admin/comments'),
        apiRequest<{ success: boolean; notifications: Notification[] }>('/api/admin/notifications'),
        apiRequest<{ success: boolean; stats: AdminStats }>('/api/admin/stats'),
      ]);

      if (postsRes.status === 'fulfilled' && postsRes.value?.posts) {
        setPosts(postsRes.value.posts);
      }
      if (catsRes.status === 'fulfilled' && catsRes.value?.categories) {
        setCategories(catsRes.value.categories);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.settings) {
        setSettings(settingsRes.value.settings);
      }
      if (commentsRes.status === 'fulfilled' && commentsRes.value?.comments) {
        setComments(commentsRes.value.comments);
      }
      if (notifsRes.status === 'fulfilled' && notifsRes.value?.notifications) {
        setNotifications(notifsRes.value.notifications);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
        setStats(statsRes.value.stats);
      }
    } catch (err: any) {
      console.warn('[Admin data load note]:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await apiRequest('/api/admin/logout', { method: 'POST' });
    } catch {}
    setAuthToken(null);
    onLogout();
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await apiRequest('/api/admin/notifications/mark-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleStartEdit = (post: Post) => {
    setEditingPost(post);
    setActiveTab('new_post');
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setActiveTab('new_post');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  if (loading && !stats) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-4" />
        <p className="text-sm text-slate-400">جاري فتح لوحة تحكم «نسمة شتاء»...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 shadow-md">
              ❄️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-white">
                  نسمة شتاء — لوحة التحكم
                </span>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                  صاحب الموقع 👑
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-light">
                مساحتك الإدارية الآمنة • مربوط بنظام تيليجرام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Public Site button */}
            <button
              onClick={() => onNavigatePublic('home')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:text-cyan-200 px-3 py-1.5 text-xs text-slate-300 transition"
              title="معاينة الموقع العام كما يراه الزوار"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">معاينة الموقع العام</span>
            </button>

            {/* Logout button */}
            <button
              id="btn-admin-logout"
              onClick={handleLogoutClick}
              className="flex items-center gap-1.5 rounded-xl border border-red-900/40 bg-red-950/30 hover:bg-red-900/50 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Navigation Tabs Bar */}
        <nav className="mb-8 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
          <button
            onClick={() => { setEditingPost(null); setActiveTab('home'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>الرئيسية</span>
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('account'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            <span>إدارة الحساب 👑</span>
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('sanctuary'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'sanctuary'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-900/30'
                : 'text-amber-300/80 hover:bg-amber-950/30 hover:text-amber-200'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>🔒 عالمك السري</span>
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('posts'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'posts'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Feather className="h-4 w-4" />
            <span>كتاباتي ({posts.length})</span>
          </button>

          <button
            onClick={handleCreateNew}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'new_post'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>{editingPost ? 'تعديل كتابة' : 'كتابة جديدة'}</span>
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('comments'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'comments'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>التعليقات ({comments.length})</span>
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('stats'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>الإحصائيات</span>
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('notifications'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap relative ${
              activeTab === 'notifications'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>الإشعارات</span>
            {unreadNotificationsCount > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('security'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>الأمان</span>
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('settings'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>الإعدادات</span>
          </button>

          <button
            onClick={() => { setEditingPost(null); setActiveTab('backups'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'backups'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>النسخ الاحتياطية</span>
          </button>
        </nav>

        {/* Tab Content Display */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>المشاهدات</span>
                  <Eye className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {stats?.totalViews || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>الزوار الفريدون</span>
                  <UserCheck className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {stats?.uniqueVisitors || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>الإعجابات</span>
                  <Heart className="h-4 w-4 text-rose-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {stats?.totalLikes || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>التعليقات</span>
                  <MessageSquare className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {stats?.totalComments || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-amber-400 mb-2">
                  <span>كتابات خاصة 🔒</span>
                  <Lock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-amber-200">
                  {stats?.privatePosts || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-cyan-400 mb-2">
                  <span>منشور للعامة 🌍</span>
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-cyan-200">
                  {stats?.publicPosts || 0}
                </div>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-white mb-2">
                    مرحباً بك في ملاذك الشتوي
                  </h3>
                  <p className="text-sm text-slate-300 font-light max-w-xl leading-relaxed">
                    يمكنك البدء بكتابة خاطرة خاصة في غرفتك السرية، أو تصفح التعليقات وإدارة ما ينشر للعامة. البوت مربوط بحسابك على تيليجرام ويقوم بإشعارك بكل جديد لحظة بلحظة.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 text-xs transition shadow-lg shadow-cyan-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>كتابة خاطرة جديدة</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('sanctuary')}
                    className="flex items-center gap-2 rounded-xl border border-amber-600/40 bg-amber-950/40 hover:bg-amber-900/50 px-5 py-2.5 text-xs font-bold text-amber-200 transition"
                  >
                    <Lock className="h-4 w-4" />
                    <span>دخول عالمك السري</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Writings & Notifications Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Writings */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-serif text-lg font-bold text-white">آخر الكتابات</h4>
                  <button
                    onClick={() => setActiveTab('posts')}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    عرض الكل ({posts.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {posts.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleStartEdit(p)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:border-slate-700 cursor-pointer transition"
                    >
                      <div className="space-y-0.5 truncate max-w-xs">
                        <p className="text-sm font-bold text-white truncate">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.category}</p>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          p.isPublic
                            ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
                            : 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        {p.isPublic ? 'عام' : 'خاص 🔒'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity / Notifications */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-serif text-lg font-bold text-white">آخر الإشعارات</h4>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="space-y-3">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 flex items-start gap-3"
                    >
                      <span className="text-base">
                        {n.type === 'comment' ? '💬' : n.type === 'like' ? '❤️' : n.type === 'security' ? '🔐' : '🔔'}
                      </span>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-slate-200">{n.title}</p>
                        <p className="text-slate-400 text-[11px]">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sanctuary' && (
          <SecretSanctuary
            posts={posts}
            onCreateNew={handleCreateNew}
            onEditPost={handleStartEdit}
            onViewPost={(id) => onNavigatePublic('post', id)}
          />
        )}

        {activeTab === 'posts' && (
          <PostsManager
            posts={posts}
            onCreateNew={handleCreateNew}
            onEditPost={handleStartEdit}
            onViewPost={(id) => onNavigatePublic('post', id)}
            onRefresh={loadAllAdminData}
          />
        )}

        {activeTab === 'new_post' && (
          <PostEditor
            initialPost={editingPost}
            categories={categories}
            onSaved={() => {
              loadAllAdminData();
              setActiveTab('posts');
            }}
            onCancel={() => {
              setEditingPost(null);
              setActiveTab('posts');
            }}
          />
        )}

        {activeTab === 'comments' && (
          <CommentsTab comments={comments} onRefresh={loadAllAdminData} />
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-cyan-400" />
                <span>إحصائيات الموقع والتفاعل</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تقرير شامل عن الزيارات، قراءات المقالات، وتفاعل الزوار.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs text-slate-400 mb-1">إجمالي مشاهدات الصفحات</p>
                <p className="font-mono text-3xl font-bold text-cyan-300">{stats?.totalViews}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs text-slate-400 mb-1">الزوار الفريدون</p>
                <p className="font-mono text-3xl font-bold text-white">{stats?.uniqueVisitors}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs text-slate-400 mb-1">إجمالي الإعجابات</p>
                <p className="font-mono text-3xl font-bold text-rose-400">{stats?.totalLikes}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-xs text-slate-400 mb-1">إجمالي التعليقات</p>
                <p className="font-mono text-3xl font-bold text-cyan-400">{stats?.totalComments}</p>
              </div>
            </div>

            {/* Popular Posts */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="font-serif text-lg font-bold text-white mb-4">أكثر الكتابات تفاعلاً</h3>
              <div className="space-y-3">
                {posts
                  .sort((a, b) => b.viewsCount - a.viewsCount)
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                      <div className="space-y-0.5 truncate max-w-sm">
                        <p className="text-sm font-bold text-white truncate">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.category}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <span>👁️ {p.viewsCount}</span>
                        <span>❤️ {p.likesCount}</span>
                        <span>💬 {p.commentsCount}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                  <Bell className="h-6 w-6 text-cyan-400" />
                  <span>سجل الإشعارات ({notifications.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  جميع الإشعارات المسجلة، والتي تُرسل أيضاً فورياً إلى حسابك في تيليجرام.
                </p>
              </div>

              {unreadNotificationsCount > 0 && (
                <button
                  onClick={handleMarkNotificationsRead}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs text-slate-300 hover:text-white transition"
                >
                  تحديد الكل كمقروء ✓
                </button>
              )}
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">لا توجد إشعارات حالياً.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                      n.isRead
                        ? 'border-slate-800 bg-slate-900/30 text-slate-300'
                        : 'border-cyan-500/40 bg-cyan-950/20 text-white shadow-sm'
                    }`}
                  >
                    <div className="text-xl pt-0.5">
                      {n.type === 'comment' ? '💬' : n.type === 'like' ? '❤️' : n.type === 'security' ? '🔐' : '🔔'}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{n.title}</p>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.createdAt).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-light">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <AccountManagementTab
            onLogout={handleLogoutClick}
            onProfileUpdated={() => loadAllAdminData()}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab onPasswordChanged={loadAllAdminData} />
        )}

        {activeTab === 'settings' && settings && (
          <SettingsTab
            settings={settings}
            categories={categories}
            onSettingsUpdated={(newSet) => setSettings(newSet)}
            onCategoriesUpdated={loadAllAdminData}
          />
        )}

        {activeTab === 'backups' && <BackupsTab />}
      </div>
    </div>
  );
};

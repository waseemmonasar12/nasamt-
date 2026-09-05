import React, { useState } from 'react';
import {
  Search,
  Lock,
  Globe,
  Plus,
  Trash2,
  Edit3,
  Eye,
  FileDown,
  Clock,
  Heart,
  MessageSquare,
} from 'lucide-react';
import type { Post } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';
import { exportPostToPdf } from '../../utils/exportPdf.js';

interface PostsManagerProps {
  posts: Post[];
  onCreateNew: () => void;
  onEditPost: (post: Post) => void;
  onViewPost: (id: string) => void;
  onRefresh: () => void;
}

export const PostsManager: React.FC<PostsManagerProps> = ({
  posts,
  onCreateNew,
  onEditPost,
  onViewPost,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'private' | 'public' | 'draft'>('all');
  const [search, setSearch] = useState('');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const handleTogglePublish = async (post: Post) => {
    setLoadingActionId(post.id);
    try {
      const newPublicState = !post.isPublic;
      await apiRequest(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isPublic: newPublicState,
          status: newPublicState ? 'published' : 'private',
        }),
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل تغيير حالة النشر');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`هل أنت متأكد من حذف «${post.title}» نهائياً؟`)) return;

    setLoadingActionId(post.id);
    try {
      await apiRequest(`/api/admin/posts/${post.id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف التدوينة');
    } finally {
      setLoadingActionId(null);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'private' && p.isPublic) return false;
    if (filter === 'public' && !p.isPublic) return false;
    if (filter === 'draft' && p.status !== 'draft') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action & search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث في جميع كتاباتك (الخاصة والعامة)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 pr-10 pl-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Create Button */}
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 text-xs transition shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>كتابة جديدة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl px-4 py-1.5 text-xs font-medium transition ${
            filter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          الكل ({posts.length})
        </button>

        <button
          onClick={() => setFilter('private')}
          className={`rounded-xl px-4 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
            filter === 'private'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>الكتابات الخاصة ({posts.filter((p) => !p.isPublic).length})</span>
        </button>

        <button
          onClick={() => setFilter('public')}
          className={`rounded-xl px-4 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
            filter === 'public'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>الكتابات العامة ({posts.filter((p) => p.isPublic).length})</span>
        </button>

        <button
          onClick={() => setFilter('draft')}
          className={`rounded-xl px-4 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
            filter === 'draft'
              ? 'bg-slate-700/50 text-slate-200 border border-slate-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>المسودات ({posts.filter((p) => p.status === 'draft').length})</span>
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/20">
            <p className="font-serif text-lg text-slate-300">لا توجد كتابات في هذا القسم</p>
            <p className="text-xs text-slate-500 mt-1">اضغط على «كتابة جديدة» للبدء في التدوين.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm hover:border-slate-700 transition"
            >
              {/* Post Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  {post.isPublic ? (
                    <span className="flex items-center gap-1 rounded bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-[11px] text-cyan-300 font-medium">
                      <Globe className="h-3 w-3" />
                      <span>منشور للعامة</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 text-[11px] text-amber-300 font-medium">
                      <Lock className="h-3 w-3" />
                      <span>خاص — محمي</span>
                    </span>
                  )}

                  <span className="text-slate-400 font-medium">{post.category}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(post.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-white truncate">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-1 font-light">
                  {post.excerpt || post.content}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{post.viewsCount} مشاهدة</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{post.likesCount} إعجاب</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{post.commentsCount} تعليق</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Toggle Publish button */}
                <button
                  onClick={() => handleTogglePublish(post)}
                  disabled={loadingActionId === post.id}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    post.isPublic
                      ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 border border-amber-700/40'
                      : 'bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50 border border-cyan-700/40'
                  }`}
                  title={post.isPublic ? 'إلغاء النشر وإعادتها خاصة' : 'نشر التدوينة للعامة'}
                >
                  {post.isPublic ? 'إلغاء النشر 🔒' : 'نشر للعامة 🌍'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => onEditPost(post)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition"
                  title="تعديل الكتابة"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>

                {/* PDF */}
                <button
                  onClick={() => exportPostToPdf(post)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition"
                  title="تصدير كـ PDF"
                >
                  <FileDown className="h-3.5 w-3.5" />
                </button>

                {/* View */}
                <button
                  onClick={() => onViewPost(post.id)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition"
                  title="معاينة"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(post)}
                  disabled={loadingActionId === post.id}
                  className="rounded-xl border border-red-900/40 bg-red-950/30 hover:bg-red-900/50 p-2 text-red-400 transition"
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

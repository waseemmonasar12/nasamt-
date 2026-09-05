import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Heart,
  Share2,
  Calendar,
  Eye,
  BookOpen,
  Printer,
  MessageSquare,
  Send,
  Check,
} from 'lucide-react';
import type { Post, Comment } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';
import { exportPostToPdf } from '../../utils/exportPdf.js';

interface PostDetailViewProps {
  postId: string;
  onBack: () => void;
  isReadingMode: boolean;
  onToggleReadingMode: () => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  postId,
  onBack,
  isReadingMode,
  onToggleReadingMode,
}) => {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Like state
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Share state
  const [copied, setCopied] = useState(false);

  // Comment submission form
  const [authorName, setAuthorName] = useState(() => {
    try {
      return localStorage.getItem('nesmat_visitor_name') || '';
    } catch {
      return '';
    }
  });
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    loadPost();
    // Track view
    apiRequest('/api/public/track-view', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    }).catch(() => {});
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ success: boolean; post: Post; comments: Comment[] }>(
        `/api/public/posts/${postId}`
      );
      setPost(data.post);
      setLikeCount(data.post.likesCount);
      setComments(data.comments || []);
    } catch (err: any) {
      setError(err.message || 'عذراً، هذه التدوينة خاصة أو غير متاحة.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (hasLiked || !post) return;
    try {
      setHasLiked(true);
      setLikeCount((prev) => prev + 1);
      const res = await apiRequest<{ success: boolean; likesCount: number }>(
        `/api/public/posts/${post.id}/like`,
        { method: 'POST' }
      );
      if (res.likesCount) {
        setLikeCount(res.likesCount);
      }
    } catch {
      setHasLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    const cleanAuthor = authorName.trim() || 'زائر هادئ';
    try {
      localStorage.setItem('nesmat_visitor_name', cleanAuthor);
    } catch {}

    setIsSubmittingComment(true);
    try {
      const res = await apiRequest<{ success: boolean; comment: Comment }>(
        `/api/public/posts/${post.id}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            authorName: cleanAuthor,
            content: commentText.trim(),
          }),
        }
      );

      if (res.comment) {
        setComments((prev) => [res.comment, ...prev]);
        setCommentText('');
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'تعذر إرسال التعليق.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-4" />
        <p className="text-sm text-slate-400">جاري فتح أوراق التدوينة...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center px-4">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/20 text-red-400 text-2xl">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2 font-serif">المحتوى محمي أو غير متاح</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {error || 'هذه التدوينة خاصة في ملاذ صاحب الموقع السري ولا يمكن للزوار الوصول إليها.'}
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة للكتابات العامة</span>
        </button>
      </div>
    );
  }

  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={`mx-auto transition-all ${isReadingMode ? 'max-w-2xl py-12 px-6' : 'max-w-3xl py-10 px-4 sm:px-6'}`}>
      {!isReadingMode && (
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
          <button
            id="btn-back-to-posts"
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة إلى جميع الكتابات</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-reading-mode"
              onClick={onToggleReadingMode}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition backdrop-blur-md"
              title="وضع القراءة الهادئ"
            >
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">وضع القراءة الهادئ</span>
            </button>

            <button
              id="btn-print-pdf"
              onClick={() => exportPostToPdf(post)}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition backdrop-blur-md"
              title="تصدير كـ PDF أو طباعة"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">طباعة / PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Article */}
      <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-10 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-xs text-white/50 mb-4">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-cyan-300 font-medium uppercase tracking-wider text-[11px]">
            {post.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-white/40" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-white/40" />
            {post.viewsCount + 1} مشاهدة
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-white mb-6">
          {post.title}
        </h1>

        {post.tags && post.tags.length > 0 && !isReadingMode && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((t, i) => (
              <span key={i} className="text-xs text-cyan-300/80 bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/20">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div
          className={`font-serif text-slate-200 leading-loose tracking-wide whitespace-pre-line text-justify ${
            isReadingMode ? 'text-xl leading-10 text-slate-100' : 'text-lg leading-9'
          }`}
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {post.content}
        </div>
      </article>

      {/* Action Footer */}
      {!isReadingMode && (
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-b border-white/10 py-6">
          <div className="flex items-center gap-3">
            <button
              id="btn-like-post"
              onClick={handleLike}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
                hasLiked
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-white/5 border border-white/15 text-white/80 hover:border-rose-500/40 hover:text-rose-300'
              }`}
            >
              <Heart className={`h-4 w-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{hasLiked ? 'أعجبك' : 'أعجبني'} ({likeCount})</span>
            </button>

            <button
              id="btn-share-post"
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              <span>{copied ? 'تم نسخ الرابط ✓' : 'مشاركة'}</span>
            </button>
          </div>

          <span className="text-xs text-white/40 italic">
            «نسمة شتاء — ملاذك الهادئ للكلمات والخواطر»
          </span>
        </div>
      )}

      {/* Visitor Comments */}
      {!isReadingMode && post.allowComments && (
        <section className="mt-12 pt-4">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            <h2 className="font-serif text-xl font-bold text-white">
              تعليقات الزوار ({comments.length})
            </h2>
          </div>

          <form onSubmit={handleCommentSubmit} className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3">
              <input
                type="text"
                placeholder="اسمك أو لقبك (اختياري، الافتراضي: زائر هادئ)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={40}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <div className="mb-3">
              <textarea
                placeholder="اكتب أثرك أو خاطرتك حول هذه الكلمات..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                required
                maxLength={800}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3.5 text-sm text-white placeholder-white/40 focus:border-cyan-400/60 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              {commentSuccess ? (
                <span className="text-xs text-emerald-400 font-medium">تم إرسال تعليقك وإشعار صاحب الموقع فورياً ✓</span>
              ) : (
                <span className="text-[11px] text-slate-500">يصل تعليقك فوراً إلى صاحب الموقع عبر تيليجرام</span>
              )}

              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmittingComment ? 'جاري الإرسال...' : 'إضافة تعليق'}</span>
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center py-6 text-sm text-slate-500 italic">
                كن أول من يترك أثراً وكلمة طيبة تحت هذه التدوينة.
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-300">{c.authorName}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-light whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
};

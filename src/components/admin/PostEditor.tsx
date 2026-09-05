import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Globe,
  Save,
  Check,
  AlertCircle,
  ArrowRight,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import type { Post, Category } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';

interface PostEditorProps {
  initialPost?: Post | null;
  categories: Category[];
  onSaved: (post: Post) => void;
  onCancel: () => void;
}

export const PostEditor: React.FC<PostEditorProps> = ({
  initialPost,
  categories,
  onSaved,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [category, setCategory] = useState(initialPost?.category || (categories[0]?.name || 'خواطر'));
  const [tagsInput, setTagsInput] = useState(initialPost?.tags.join(', ') || '');
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || '');
  const [allowComments, setAllowComments] = useState(initialPost ? initialPost.allowComments : true);

  // Requirement 11: Default MUST BE PRIVATE!
  const [isPublic, setIsPublic] = useState(initialPost ? initialPost.isPublic : false);
  const [status, setStatus] = useState<'draft' | 'published' | 'private'>(
    initialPost?.status || 'private'
  );

  // Auto-save statuses: 'idle' | 'saving' | 'saved' | 'offline_saved' | 'synced'
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'offline_saved' | 'synced'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(initialPost?.id);
  const autoSaveTimerRef = useRef<any>(null);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync local draft if exists
      const offlineDraft = localStorage.getItem('nesmat_offline_draft');
      if (offlineDraft) {
        setAutoSaveStatus('synced');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save debounce effect
  useEffect(() => {
    if (!title.trim() && !content.trim()) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!isOnline) {
        // Save local backup fallback as required in requirement #15
        localStorage.setItem(
          'nesmat_offline_draft',
          JSON.stringify({ title, content, category, tags: tagsInput, isPublic, status, timestamp: Date.now() })
        );
        setAutoSaveStatus('offline_saved');
        return;
      }

      setAutoSaveStatus('saving');
      try {
        const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
        const excerpt = content.slice(0, 180).trim() + (content.length > 180 ? '...' : '');

        if (currentPostId) {
          await apiRequest(`/api/admin/posts/${currentPostId}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: title.trim(),
              content: content.trim(),
              excerpt,
              category,
              tags,
              coverImage: coverImage.trim() || undefined,
              isPublic,
              status,
              allowComments,
            }),
          });
        } else {
          const res = await apiRequest<{ success: boolean; post: Post }>('/api/admin/posts', {
            method: 'POST',
            body: JSON.stringify({
              title: title.trim() || 'خاطرة بلا عنوان',
              content: content.trim(),
              excerpt,
              category,
              tags,
              coverImage: coverImage.trim() || undefined,
              isPublic,
              status,
              allowComments,
            }),
          });
          if (res.post?.id) {
            setCurrentPostId(res.post.id);
          }
        }
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [title, content, category, tagsInput, isPublic, status, coverImage, allowComments, isOnline, currentPostId]);

  // Explicit Save / Action Handlers
  const handleSaveAction = async (targetPublic: boolean, targetStatus: 'draft' | 'published' | 'private') => {
    if (!title.trim() || !content.trim()) {
      alert('يرجى كتابة العنوان والنص أولاً.');
      return;
    }

    setIsPublic(targetPublic);
    setStatus(targetStatus);
    setAutoSaveStatus('saving');

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const excerpt = content.slice(0, 180).trim() + (content.length > 180 ? '...' : '');

    try {
      let savedPost: Post;
      if (currentPostId) {
        const res = await apiRequest<{ success: boolean; post: Post }>(`/api/admin/posts/${currentPostId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            excerpt,
            category,
            tags,
            coverImage: coverImage.trim() || undefined,
            isPublic: targetPublic,
            status: targetStatus,
            allowComments,
          }),
        });
        savedPost = res.post;
      } else {
        const res = await apiRequest<{ success: boolean; post: Post }>('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            excerpt,
            category,
            tags,
            coverImage: coverImage.trim() || undefined,
            isPublic: targetPublic,
            status: targetStatus,
            allowComments,
          }),
        });
        savedPost = res.post;
      }

      setAutoSaveStatus('saved');
      localStorage.removeItem('nesmat_offline_draft');
      onSaved(savedPost);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ الكتابة.');
      setAutoSaveStatus('idle');
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-slate-100">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowRight className="h-4 w-4" />
            <span>إلغاء والعودة</span>
          </button>
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span>{initialPost ? 'تعديل الكتابة' : 'كتابة شتوية جديدة'}</span>
          </h2>
        </div>

        {/* Real-time Auto-save Indicator (Requirement #15) */}
        <div className="flex items-center gap-2 text-xs">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>جاري الحفظ...</span>
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Check className="h-3.5 w-3.5" />
              <span>تم الحفظ ✓</span>
            </span>
          )}
          {autoSaveStatus === 'offline_saved' && (
            <span className="flex items-center gap-1 text-amber-400">
              <WifiOff className="h-3.5 w-3.5" />
              <span>أنت غير متصل — تم حفظ نسخة محلية</span>
            </span>
          )}
          {autoSaveStatus === 'synced' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              <span>تمت المزامنة ✓</span>
            </span>
          )}
        </div>
      </div>

      {/* Editor Form */}
      <div className="space-y-6">
        {/* Title input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            عنوان الكتابة
          </label>
          <input
            id="editor-title-input"
            type="text"
            placeholder="اكتب عنواناً يلامس الروح..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 font-serif text-xl sm:text-2xl font-bold text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Content textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            نص الخاطرة أو المقال
          </label>
          <textarea
            id="editor-content-textarea"
            placeholder="اكتب ما لا تستطيع قوله في العلن... انثر كلماتك هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 font-serif text-lg leading-loose text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none resize-y"
            style={{ fontFamily: "'Amiri', serif" }}
          />
        </div>

        {/* Meta details: Category, Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              التصنيف
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name} className="bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              الوسوم (مفصولة بفاصلة)
            </label>
            <input
              type="text"
              placeholder="شتاء, ليل, ذكريات, هدوء"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Visibility Setting: Default is PRIVATE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isPublic ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {isPublic ? 'نشر للعامة (مرئي للزوار)' : 'كتابة خاصة (مخفية ومحمية)'}
                </p>
                <p className="text-xs text-slate-400">
                  {isPublic
                    ? 'سيتمكن الزوار من قراءة هذه التدوينة والتفاعل معها.'
                    : 'الافتراضي الآمن: ستبقى هذه الكتابة في غرفتك الخاصة ولا يمكن لأي شخص أو API الوصول إليها.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                isPublic
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
              }`}
            >
              {isPublic ? 'تحويل إلى خاصة 🔒' : 'نشر للعامة 🌍'}
            </button>
          </div>
        </div>

        {/* Action Buttons: حفظ خاص، حفظ كمسودة، نشر للعامة */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => handleSaveAction(false, 'draft')}
            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 transition"
          >
            حفظ كمسودة 📝
          </button>

          <button
            type="button"
            onClick={() => handleSaveAction(false, 'private')}
            className="flex items-center gap-2 rounded-xl border border-amber-600/40 bg-amber-950/40 hover:bg-amber-900/50 px-6 py-2.5 text-xs font-bold text-amber-200 transition shadow-md"
          >
            <Lock className="h-4 w-4" />
            <span>حفظ خاص (في عالمك السري)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAction(true, 'published')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-2.5 text-xs font-bold text-slate-950 transition shadow-lg shadow-cyan-950/40"
          >
            <Globe className="h-4 w-4" />
            <span>نشر للعامة 🌍</span>
          </button>
        </div>
      </div>
    </div>
  );
};

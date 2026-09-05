import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Lock, Compass, Send } from 'lucide-react';
import type { Post, Category } from '../../types/index.js';
import { PostCard } from './PostCard.js';
import { apiRequest } from '../../utils/api.js';

interface PublicHomeViewProps {
  onSelectPost: (id: string) => void;
  onNavigateLogin: () => void;
  onOpenBook?: () => void;
  onOpenAbout: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const PublicHomeView: React.FC<PublicHomeViewProps> = ({
  onSelectPost,
  onNavigateLogin,
  onOpenAbout,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicData();
  }, [selectedCategory]);

  const loadPublicData = async () => {
    setLoading(true);
    try {
      const catParam = selectedCategory !== 'all' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const [postsRes, catsRes] = await Promise.all([
        apiRequest<{ success: boolean; posts: Post[] }>(`/api/public/posts${catParam}`),
        apiRequest<{ success: boolean; categories: Category[] }>('/api/public/categories'),
      ]);
      setPosts(postsRes.posts || []);
      setCategories(catsRes.categories || []);
    } catch (err) {
      console.error('Failed to load public data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 text-center px-4">
        {/* Glowing Orbs */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute top-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-cyan-400/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl flex flex-col items-center">
          {/* Logo with falling/floating snowflake animation */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl transition-transform duration-700 hover:rotate-12">
              <span className="text-3xl animate-bounce" style={{ animationDuration: '3.5s' }}>❄️</span>
            </div>
          </div>

          <div className="mb-6 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm inline-flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80 font-bold">
              مساحة للكتابة والتدوين الفاخر
            </span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-serif mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 leading-tight">
            نسمة شتاء
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed mb-10 font-light italic font-serif">
            «اكتب ما لا تستطيع قوله... واحتفظ بما لا تريد أن يراه أحد... وشارك العالم فقط ما تريد أن يصل إليه.»
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a
              href="#writings-section"
              className="group relative px-8 sm:px-10 py-3.5 sm:py-4 overflow-hidden rounded-xl bg-white text-slate-900 font-semibold shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all flex items-center gap-2.5 text-sm"
            >
              <Compass className="h-4 w-4" />
              <span className="relative z-10">اكتشف الكتابات</span>
            </a>

            <button
              onClick={onNavigateLogin}
              className="group px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all flex items-center gap-2.5 text-sm text-white shadow-sm"
            >
              <Lock className="h-4 w-4 text-amber-300" />
              <span>دخول الإدارة</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area: Writings & Filters */}
      <section id="writings-section" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Search & Categories Header */}
        <div className="mb-10 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">
                الكتابات المنشورة
              </h2>
              <p className="text-xs uppercase tracking-widest text-white/50">
                خواطر وأوراق شاركها صاحب الموقع مع زواره
              </p>
            </div>

            {/* Public Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                id="input-public-search"
                type="text"
                placeholder="ابحث في الكلمات، العناوين، والوسوم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-white/15 bg-white/[0.03] pr-11 pl-5 py-2.5 text-sm text-white placeholder-white/40 focus:border-cyan-400/60 focus:outline-none backdrop-blur-md transition"
              />
            </div>
          </div>

          {/* Categories Filter Chips */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-5 py-2 text-xs uppercase tracking-wider font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                  : 'border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/25'
              }`}
            >
              جميع التصنيفات
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`rounded-full px-5 py-2 text-xs uppercase tracking-wider font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.name
                    ? 'bg-white text-slate-900 font-bold shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                    : 'border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/25'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] p-6 animate-pulse"
              />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          posts.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-xl mx-auto backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-950/30 text-3xl">
                ❄️
              </div>
              <h3 className="font-serif text-2xl font-bold text-white mb-2">الملاذ بانتظار همسات الحرف الأولى</h3>
              <p className="text-sm text-white/60 max-w-md mx-auto font-light leading-relaxed mb-6">
                لم يتم نشر أي كتابات عامة حتى الآن. عندما يبدأ صاحب الموقع في تدوين ونشر خواطره، ستجدها متألقة هنا.
              </p>
              <button
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 text-xs text-amber-200 transition font-medium"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>دخول الإدارة لكتابة التدوينة الأولى</span>
              </button>
            </div>
          ) : (
            <div className="py-20 text-center rounded-2xl border border-white/10 bg-white/[0.02] p-8">
              <p className="font-serif text-xl text-white/80 mb-2">لا توجد كتابات منشورة تطابق بحثك</p>
              <p className="text-xs text-white/40">جرب البحث بكلمة مختلفة أو اختر تصنيفاً آخر.</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} onClick={onSelectPost} />
            ))}
          </div>
        )}
      </section>

      {/* Footer styled to match Immersive UI specification */}
      <footer className="mt-20 border-t border-white/5 bg-gradient-to-t from-[#020617] to-transparent py-14 px-6 lg:px-12 text-slate-400 text-xs">
        <div className="mx-auto max-w-6xl space-y-10">
          {/* Main Footer Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            {/* Meta stats / status */}
            <div className="flex flex-wrap gap-8 sm:gap-12">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-white/40">آخر الخواطر</span>
                <span className="text-sm text-white/80 font-serif">
                  {posts[0]?.title ? posts[0].title.slice(0, 28) + '...' : 'الملاذ في سكون الشتاء'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-white/40">حالة العالم</span>
                <span className="text-sm text-cyan-400 flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>متصل - آمن 🔒</span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-white/40">إجمالي الزيارات</span>
                <span className="text-sm text-white/80 font-mono">
                  {posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0)} قراءة
                </span>
              </div>
            </div>

            {/* Glowing dots & signature */}
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
              </div>
              <p className="text-[10px] text-white/30 tracking-[0.2em] font-mono uppercase">
                DESIGNED FOR SOULS WHO SEEK SILENCE
              </p>
            </div>
          </div>

          {/* Links & Copyright bar */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-semibold text-white/90">نسمة شتاء</span>
              <span className="text-white/20">|</span>
              <span className="text-[11px] text-white/40">ملاذ شخصي للكتابة والتأمل الآمن</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[11px] text-white/60">
              <button onClick={onOpenAbout} className="hover:text-white transition-colors">
                عن المشروع
              </button>
              <button onClick={onOpenPrivacy} className="hover:text-white transition-colors">
                سياسة الخصوصية
              </button>
              <button onClick={onOpenTerms} className="hover:text-white transition-colors">
                شروط الاستخدام
              </button>
              <button onClick={onNavigateLogin} className="hover:text-amber-200 transition-colors text-amber-300 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>دخول الإدارة</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

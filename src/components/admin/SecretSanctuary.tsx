import React, { useState } from 'react';
import { Flame, Lock, Plus, Sparkles, Volume2, VolumeX, Eye, BookOpen, Feather } from 'lucide-react';
import type { Post } from '../../types/index.js';
import { ambientSound } from '../../utils/audio.js';
import { PrivateBookManager } from './PrivateBookManager.js';

interface SecretSanctuaryProps {
  posts: Post[];
  onCreateNew: () => void;
  onEditPost: (post: Post) => void;
  onViewPost: (id: string) => void;
}

export const SecretSanctuary: React.FC<SecretSanctuaryProps> = ({
  posts,
  onCreateNew,
  onEditPost,
  onViewPost,
}) => {
  const [fireplacePlaying, setFireplacePlaying] = useState(false);
  const [sanctuaryTab, setSanctuaryTab] = useState<'book' | 'notes'>('book');
  const privatePosts = posts.filter((p) => !p.isPublic);

  const toggleFireplaceAudio = () => {
    if (fireplacePlaying) {
      ambientSound.stop();
      setFireplacePlaying(false);
    } else {
      ambientSound.play('fireplace');
      setFireplacePlaying(true);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-900/30 bg-gradient-to-br from-[#1c120c] via-[#140e0b] to-[#080d16] p-6 sm:p-10 shadow-2xl text-amber-100">
      {/* Warm fireplace ambient lighting effects */}
      <div className="pointer-events-none absolute -top-12 right-1/4 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-orange-700/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-64 w-64 rounded-full bg-cyan-900/10 blur-3xl" />

      {/* Sanctuary Header */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-amber-900/40 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-md mb-3">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>ملاذك السري الخاص — ليلة شتوية دافئة</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-amber-50">
            🔒 عالمك السري
          </h2>
          <p className="font-serif text-sm sm:text-base text-amber-200/80 font-light mt-1 max-w-xl">
            هنا تُحفظ أسرارك، ديوانك الخاص، ومذكراتك التي لم تفتح نافذتها للعالم بعد. مشفرة ومحفوظة بعيداً عن أعين الزوار.
          </p>
        </div>

        {/* Quick controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleFireplaceAudio}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-medium transition ${
              fireplacePlaying
                ? 'border-amber-500/50 bg-amber-950/60 text-amber-200 shadow-md shadow-amber-950/50'
                : 'border-amber-900/50 bg-stone-900/60 text-stone-300 hover:border-amber-600/40 hover:text-amber-100'
            }`}
          >
            {fireplacePlaying ? (
              <>
                <Volume2 className="h-4 w-4 text-amber-400 animate-pulse" />
                <span>طقطقة المدفأة: مشتعلة 🔥</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                <span>إشعال صوت المدفأة 🔥</span>
              </>
            )}
          </button>

          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-lg shadow-amber-950/50 transition"
          >
            <Plus className="h-4 w-4" />
            <span>تدوين سر جديد</span>
          </button>
        </div>
      </div>

      {/* Internal Sanctuary Sub-tabs */}
      <div className="relative z-10 my-6 flex items-center gap-2 border-b border-amber-900/30 pb-3">
        <button
          onClick={() => setSanctuaryTab('book')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            sanctuaryTab === 'book'
              ? 'bg-amber-600/80 text-stone-950 shadow-md'
              : 'text-amber-300/70 hover:bg-stone-900/60 hover:text-amber-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>ديوان الخواطر والشعر السري</span>
        </button>

        <button
          onClick={() => setSanctuaryTab('notes')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            sanctuaryTab === 'notes'
              ? 'bg-amber-600/80 text-stone-950 shadow-md'
              : 'text-amber-300/70 hover:bg-stone-900/60 hover:text-amber-100'
          }`}
        >
          <Feather className="h-4 w-4" />
          <span>المذكرات السرية ({privatePosts.length})</span>
        </button>
      </div>

      {/* Tab 1: Private Book */}
      {sanctuaryTab === 'book' && (
        <div className="relative z-10">
          <PrivateBookManager />
        </div>
      )}

      {/* Tab 2: Private Notes Grid */}
      {sanctuaryTab === 'notes' && (
        <div className="relative z-10 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              <span>الكتابات السرية المحفوظة ({privatePosts.length})</span>
            </h3>
            <span className="text-xs text-amber-300/60 font-light">
              لا تظهر في أي صفحة عامة أو نتائج بحث
            </span>
          </div>

          {privatePosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-900/40 bg-amber-950/10 py-16 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-amber-400/50 mb-3" />
              <p className="font-serif text-lg text-amber-200 mb-1">عالمك السري هادئ الليلة</p>
              <p className="text-xs text-amber-400/60 mb-4">
                لم تسجل أي كتابات خاصة بعد. اضغط أدناه لتدوين خاطرة أو سر لا يراه غيرك.
              </p>
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700/40 hover:bg-amber-700/60 px-4 py-2 text-xs font-semibold text-amber-200 border border-amber-600/40 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ابدأ بالكتابة الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {privatePosts.map((post) => (
                <div
                  key={post.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-amber-900/40 bg-stone-950/60 p-5 backdrop-blur-md hover:border-amber-500/40 hover:bg-stone-900/60 transition shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-2 text-amber-400/80">
                      <span className="rounded bg-amber-950/80 px-2 py-0.5 border border-amber-800/40">
                        🔒 {post.category}
                      </span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="font-serif text-lg font-bold text-amber-100 group-hover:text-amber-300 transition line-clamp-2">
                      {post.title}
                    </h4>

                    <p className="mt-2 text-xs text-stone-300/80 leading-relaxed font-light line-clamp-3">
                      {post.content}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-amber-900/30 pt-3 text-xs">
                    <span className="text-[10px] text-stone-500">
                      {post.status === 'draft' ? 'مسودة' : 'محفوظ خاص'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditPost(post)}
                        className="rounded-lg bg-amber-950/80 hover:bg-amber-900 px-2.5 py-1 text-amber-200 text-[11px] border border-amber-700/40 transition"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => onViewPost(post.id)}
                        className="rounded-lg bg-stone-900 hover:bg-stone-800 px-2.5 py-1 text-stone-300 text-[11px] border border-stone-800 transition flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>معاينة</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

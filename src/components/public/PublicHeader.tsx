import React from 'react';
import { Sparkles, BookOpen, KeyRound, Home, BookText, User, Lock } from 'lucide-react';
import { AudioControlWidget } from '../winter/AudioControlWidget.js';

interface PublicHeaderProps {
  currentView: string;
  onNavigate: (view: string, postId?: string) => void;
  isReadingMode: boolean;
  onToggleReadingMode: () => void;
  snowEnabled: boolean;
  onToggleSnow: () => void;
  visitorName?: string | null;
  onOpenVisitorGate?: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentView,
  onNavigate,
  isReadingMode,
  onToggleReadingMode,
  snowEnabled,
  onToggleSnow,
  visitorName,
  onOpenVisitorGate,
}) => {
  if (isReadingMode) {
    return (
      <header className="fixed top-4 left-4 z-50">
        <button
          id="btn-exit-reading-mode"
          onClick={onToggleReadingMode}
          className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs text-slate-300 backdrop-blur-md hover:bg-slate-800 transition"
        >
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          <span>الخروج من وضع القراءة الهادئ</span>
        </button>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#020617]/70 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        {/* Brand */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
          id="brand-header-link"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md shadow-lg group-hover:border-white/40 transition">
            <span className="text-xl">❄️</span>
          </div>
          <div>
            <span className="font-serif text-2xl tracking-widest text-white/90 group-hover:text-cyan-200 transition font-medium">
              نسمة شتاء
            </span>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-light hidden sm:block">
              ملاذ الكلمات والخواطر الهادئة
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 text-xs tracking-widest uppercase text-white/60">
          <button
            id="nav-home"
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              currentView === 'home'
                ? 'text-white font-semibold bg-white/10'
                : 'hover:text-white'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>عن المشروع</span>
          </button>

          <button
            id="nav-posts"
            onClick={() => onNavigate('posts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              currentView === 'posts'
                ? 'text-white font-semibold bg-white/10'
                : 'hover:text-white'
            }`}
          >
            <BookText className="h-3.5 w-3.5" />
            <span>الكتابات العامة</span>
          </button>

          <div className="h-4 w-[1px] bg-white/20 mx-1"></div>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <AudioControlWidget />

          {/* Snow toggle */}
          <button
            id="btn-toggle-snow"
            onClick={onToggleSnow}
            className={`hidden sm:flex items-center gap-1.5 rounded-full px-4 py-2 text-xs border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all ${
              snowEnabled
                ? 'text-cyan-300 border-cyan-400/40 bg-cyan-950/20'
                : 'text-white/60'
            }`}
            title="تبديل تساقط الثلج"
          >
            <Sparkles className="h-3 w-3" />
            <span>{snowEnabled ? 'الثلج: نشط' : 'الثلج: متوقف'}</span>
          </button>

          {/* Visitor badge */}
          {visitorName && (
            <button
              onClick={onOpenVisitorGate}
              title="تعديل اسم الزائر"
              className="hidden lg:flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3 py-1.5 text-xs text-cyan-200/90 hover:bg-cyan-900/40 transition"
            >
              <User className="h-3 w-3 text-cyan-400" />
              <span className="font-light">مرحباً، {visitorName}</span>
            </button>
          )}

          {/* Admin Entrance */}
          <button
            id="btn-secret-owner-login"
            onClick={() => onNavigate('login')}
            className="group px-3.5 sm:px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-lg hover:bg-white/10 text-xs text-white/90 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            title="تسجيل دخول الإدارة"
          >
            <Lock className="h-3.5 w-3.5 text-amber-300" />
            <span>دخول الإدارة</span>
          </button>
        </div>
      </div>
    </header>
  );
};

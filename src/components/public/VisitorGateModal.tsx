import React, { useState } from 'react';
import { Sparkles, User, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../../utils/api.js';

interface VisitorGateModalProps {
  isOpen: boolean;
  onRegistered: (name: string) => void;
}

export const VisitorGateModal: React.FC<VisitorGateModalProps> = ({
  isOpen,
  onRegistered,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setError('يرجى كتابة اسمك أو لقبك للمتابعة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('nesmat_visitor_name', cleanName);
      // Register with backend to track & alert Telegram
      await apiRequest('/api/public/visitor-register', {
        method: 'POST',
        body: JSON.stringify({ visitorName: cleanName }),
      }).catch(() => {});

      onRegistered(cleanName);
    } catch {
      localStorage.setItem('nesmat_visitor_name', cleanName);
      onRegistered(cleanName);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAnonymous = async () => {
    const defaultName = 'قارئ عابر';
    localStorage.setItem('nesmat_visitor_name', defaultName);
    await apiRequest('/api/public/visitor-register', {
      method: 'POST',
      body: JSON.stringify({ visitorName: defaultName }),
    }).catch(() => {});
    onRegistered(defaultName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#0a1128]/95 to-[#020617]/95 p-6 sm:p-8 shadow-2xl text-center">
        {/* Glow orb */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40 text-2xl shadow-lg mb-4">
            ❄️
          </div>

          <span className="text-[11px] uppercase tracking-[0.25em] text-cyan-300 font-bold mb-1">
            أهلاً بك في نسمة شتاء
          </span>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
            ملاذ الكلمات والخواطر
          </h3>

          <p className="text-sm text-white/70 leading-relaxed max-w-xs mb-6 font-light">
            لتخصيص تجربتك وحفظ جلساتك ومشاركاتك، يرجى تدوين اسمك أو اللقب الذي تحب أن تُنادى به:
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative text-right">
              <input
                type="text"
                id="visitor-name-input"
                autoFocus
                placeholder="اكتب اسمك أو لقبك هنا..."
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setError('');
                }}
                maxLength={40}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3.5 pl-10 text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:bg-white/10 focus:outline-none transition shadow-inner"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            </div>

            {error && (
              <p className="text-xs text-rose-400 text-right">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              id="btn-submit-visitor-name"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-900/30 hover:shadow-cyan-900/50 transition flex items-center justify-center gap-2"
            >
              <span>دخول الملاذ</span>
              <ArrowLeft className="h-4 w-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={handleGuestAnonymous}
            className="mt-4 text-xs text-white/50 hover:text-white/80 transition underline underline-offset-4"
          >
            المتابعة كـ (قارئ عابر)
          </button>
        </div>
      </div>
    </div>
  );
};

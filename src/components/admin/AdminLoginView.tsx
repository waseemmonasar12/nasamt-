import React, { useState } from 'react';
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { apiRequest, setAuthToken } from '../../utils/api.js';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password || loading) return;

    setLoading(true);
    setErrorMessage(null);
    setRateLimitSeconds(null);

    try {
      const res = await apiRequest<{
        success: boolean;
        token: string;
        user: { username: string; displayName?: string; email?: string; role?: string };
      }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: identifier.trim(),
          password,
        }),
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        onLoginSuccess();
      } else {
        setErrorMessage('بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور.');
      }
    } catch (err: any) {
      if (err.status === 429) {
        setRateLimitSeconds(err.waitSeconds || 30);
        setErrorMessage(`تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار ${err.waitSeconds || 30} ثانية.`);
      } else {
        setErrorMessage(
          err.message || 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم أو البريد الإلكتروني وكلمة المرور.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[90vh] items-center justify-center px-4 py-10 sm:py-16">
      {/* Back button */}
      <button
        id="btn-back-home-from-login"
        onClick={onBackToHome}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs text-slate-300 backdrop-blur-md hover:border-cyan-500/40 hover:text-white transition"
      >
        <ArrowRight className="h-4 w-4" />
        <span>العودة إلى الموقع العام</span>
      </button>

      {/* Elegant Login Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950/85 p-6 sm:p-10 shadow-2xl shadow-cyan-950/60 backdrop-blur-2xl text-center">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-44 w-44 rounded-full bg-cyan-500/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-blue-600/15 blur-2xl" />

        {/* ❄️ Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/70 to-blue-950/50 text-3xl shadow-inner shadow-cyan-500/20">
          ❄️
        </div>

        {/* Title & Slogan */}
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
          نسمة شتاء
        </h1>
        <p className="font-serif text-sm sm:text-base text-cyan-200/90 font-light mb-6">
          عالمك ينتظرك • تسجيل دخول المالك
        </p>

        {/* Error / Rate Limit Message */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-200 leading-relaxed text-right">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 mr-1">
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <input
              id="input-login-username"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="اسم المستخدم أو البريد الإلكتروني"
              disabled={loading || rateLimitSeconds !== null}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 mr-1">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="input-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور الخاصة بك"
                disabled={loading || rateLimitSeconds !== null}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 pl-11 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition disabled:opacity-50"
              />
              <button
                type="button"
                id="btn-toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition p-1"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading || rateLimitSeconds !== null || !identifier.trim() || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-900/40 transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري التحقق والفتح...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>دخول إلى عالمك</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security assurance badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>اتصال سحابي آمن ومربوط بقاعدة Firebase Realtime</span>
        </div>

        <p className="mt-4 text-xs text-slate-500 font-light">
          مساحتك الخاصة لا تُفتح إلا بك من أي جهاز مصرح لك به.
        </p>
      </div>
    </div>
  );
};

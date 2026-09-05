import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { apiRequest, setAuthToken } from '../../utils/api.js';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setErrorMessage(null);
    setRateLimitSeconds(null);

    try {
      const res = await apiRequest<{
        success: boolean;
        token: string;
        user: { id: string; username: string };
      }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        onLoginSuccess();
      } else {
        setErrorMessage('بيانات الدخول غير صحيحة.');
      }
    } catch (err: any) {
      if (err.status === 429) {
        setRateLimitSeconds(err.waitSeconds || 30);
        setErrorMessage(`تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار ${err.waitSeconds || 30} ثانية.`);
      } else {
        // Strict security requirement: Do not reveal whether username or password was wrong
        setErrorMessage('بيانات الدخول غير صحيحة. يرجى التأكد والمحاولة مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[90vh] items-center justify-center px-4 py-12">
      {/* Back button */}
      <button
        id="btn-back-home-from-login"
        onClick={onBackToHome}
        className="absolute top-6 right-6 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-300 backdrop-blur-md hover:border-cyan-500/40 hover:text-white transition"
      >
        <ArrowRight className="h-4 w-4" />
        <span>العودة إلى الموقع العام</span>
      </button>

      {/* Elegant Login Card matching requirement #43 */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-8 sm:p-10 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl text-center">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-44 w-44 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-blue-600/10 blur-2xl" />

        {/* ❄️ Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/60 to-blue-950/40 text-3xl shadow-inner shadow-cyan-500/20">
          ❄️
        </div>

        {/* Title & Slogan */}
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-1">
          نسمة شتاء
        </h1>
        <p className="font-serif text-lg text-cyan-200/90 font-light mb-8">
          عالمك ينتظرك
        </p>

        {/* Error / Rate Limit Message */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-200">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 mr-1">
              اسم المستخدم
            </label>
            <input
              id="input-login-username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              disabled={loading || rateLimitSeconds !== null}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 mr-1">
              كلمة المرور
            </label>
            <input
              id="input-login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading || rateLimitSeconds !== null}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition disabled:opacity-50"
            />
          </div>

          <div className="pt-3">
            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading || rateLimitSeconds !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-900/40 transition-all disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>{loading ? 'جاري فتح عالمك...' : 'دخول إلى عالمك'}</span>
            </button>
          </div>
        </form>

        {/* Footer note from requirement #43 */}
        <p className="mt-8 text-xs text-slate-500 font-light">
          مساحتك الخاصة لا تُفتح إلا بك.
        </p>

        {/* Friendly Owner Credential Guide */}
        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-400">
          <p className="text-cyan-300 font-semibold mb-1">بيانات الدخول الافتراضية:</p>
          <div className="font-mono text-slate-300 flex justify-between items-center py-0.5">
            <span>اسم المستخدم:</span>
            <code className="text-cyan-400 select-all">admin</code>
          </div>
          <div className="font-mono text-slate-300 flex justify-between items-center py-0.5">
            <span>كلمة المرور:</span>
            <code className="text-cyan-400 select-all">NesmatSheta2026!*</code>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            (يمكنك تغييرها في أي وقت من تبويب «الأمان» داخل لوحة التحكم)
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  Smartphone,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  Laptop,
} from 'lucide-react';
import type { OwnerProfile, ActiveSessionInfo, ActivityLogItem } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';

interface AccountManagementTabProps {
  onLogout: () => void;
  onProfileUpdated?: (newProfile: OwnerProfile) => void;
}

export const AccountManagementTab: React.FC<AccountManagementTabProps> = ({
  onLogout,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [sessions, setSessions] = useState<ActiveSessionInfo[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [invalidateOthers, setInvalidateOthers] = useState(true);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sessions action state
  const [terminatingSessions, setTerminatingSessions] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    setLoading(true);
    try {
      const [accRes, logsRes] = await Promise.all([
        apiRequest<{ success: boolean; profile: OwnerProfile; sessions: ActiveSessionInfo[] }>(
          '/api/admin/account'
        ),
        apiRequest<{ success: boolean; logs: ActivityLogItem[] }>('/api/admin/activity-logs'),
      ]);

      if (accRes.profile) {
        setProfile(accRes.profile);
        setDisplayName(accRes.profile.displayName || '');
        setUsername(accRes.profile.username || '');
        setEmail(accRes.profile.email || '');
      }

      setSessions(accRes.sessions || []);
      setActivityLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load account details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const res = await apiRequest<{ success: boolean; profile: OwnerProfile; message: string }>(
        '/api/admin/account/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            displayName: displayName.trim(),
            username: username.trim(),
            email: email.trim(),
          }),
        }
      );

      if (res.success && res.profile) {
        setProfile(res.profile);
        setProfileMessage({ type: 'success', text: 'تم تحديث بيانات الحساب بنجاح ✓' });
        if (onProfileUpdated) onProfileUpdated(res.profile);
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء تحديث البيانات.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 أحرف.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string }>(
        '/api/admin/account/change-password',
        {
          method: 'POST',
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
            invalidateOtherSessions: invalidateOthers,
          }),
        }
      );

      if (res.success) {
        setPasswordMessage({ type: 'success', text: res.message || 'تم تغيير كلمة المرور بنجاح ✓' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        loadAccountData();
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'كلمة المرور الحالية غير صحيحة.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من جميع الأجهزة الأخرى؟')) return;

    setTerminatingSessions(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>(
        '/api/admin/account/sessions/terminate-others',
        { method: 'POST' }
      );
      if (res.success) {
        alert(res.message || 'تم إنهاء كافة الجلسات الأخرى بنجاح ✓');
        loadAccountData();
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إنهاء الجلسات.');
    } finally {
      setTerminatingSessions(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm">جاري تحميل بيانات حساب المالك الآمنة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Overview Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-950 to-cyan-950/40 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-950/60 text-3xl shadow-inner shadow-cyan-400/20">
              👑
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-950">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-2xl font-bold text-white">
                  {profile?.displayName || 'صاحب الملاذ'}
                </h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  👑 المالك الأساسي (Owner)
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  حساب نشط ومحمي
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                @{profile?.username} • {profile?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/60 hover:border-rose-500/50 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>خروج من هذا الجهاز</span>
            </button>
          </div>
        </div>

        {/* Quick Account Highlights */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-6">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              آخر تسجيل دخول
            </span>
            <span className="text-xs font-medium text-slate-200">
              {profile?.lastLogin
                ? new Date(profile.lastLogin).toLocaleString('ar-EG')
                : 'الآن (جلسة حالية)'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5 text-cyan-400" />
              الأجهزة النشطة حالياً
            </span>
            <span className="text-xs font-medium text-slate-200">
              {sessions.length} {sessions.length === 1 ? 'جهاز نشط' : 'أجهزة نشطة'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3.5">
            <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              قاعدة البيانات السحابية
            </span>
            <span className="text-xs font-medium text-emerald-300">
              Firebase Realtime Database ✓
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Profile Edit & Password Change */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Details Form */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-cyan-400" />
            <h3 className="font-serif text-lg font-bold text-white">بيانات الحساب الشخصي</h3>
          </div>

          {profileMessage && (
            <div
              className={`mb-5 rounded-2xl p-3.5 text-xs ${
                profileMessage.type === 'success'
                  ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
                  : 'border border-rose-500/30 bg-rose-950/40 text-rose-200'
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                الاسم المعروض (Display Name)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="صاحب الملاذ"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                اسم المستخدم لتسجيل الدخول (Username)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm font-mono text-cyan-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                يمكنك تسجيل الدخول به من أي جهاز أو هاتف.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-cyan-400" />
                البريد الإلكتروني لحساب المالك
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="waseemalobide5@gmail.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                يمكنك أيضاً استخدام هذا البريد الإلكتروني لتسجيل الدخول بدلاً من اسم المستخدم.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 transition disabled:opacity-50"
              >
                {profileSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>حفظ بيانات الحساب</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Key className="h-5 w-5 text-cyan-400" />
            <h3 className="font-serif text-lg font-bold text-white">تغيير كلمة المرور الآمن</h3>
          </div>

          {passwordMessage && (
            <div
              className={`mb-5 rounded-2xl p-3.5 text-xs ${
                passwordMessage.type === 'success'
                  ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
                  : 'border border-rose-500/30 bg-rose-950/40 text-rose-200'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                كلمة المرور الحالية للتأكيد
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-1"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة مرور قوية (6 أحرف على الأقل)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-1"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="check-invalidate-others"
                checked={invalidateOthers}
                onChange={(e) => setInvalidateOthers(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-400"
              />
              <label htmlFor="check-invalidate-others" className="text-xs text-slate-300 select-none cursor-pointer">
                تسجيل الخروج من كافة الأجهزة الأخرى بعد التغيير (موصى به للأمان)
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSaving || !currentPassword || !newPassword}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
              >
                {passwordSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>جاري التحديث والتشفير...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <span>تحديث كلمة المرور</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Active Sessions & Devices Manager */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                الجلسات والأجهزة النشطة ({sessions.length})
              </h3>
              <p className="text-xs text-slate-400">
                إدارة الأجهزة المتصلة بحساب المالك مع إمكانية إنهاء الجلسات عن بُعد
              </p>
            </div>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={handleTerminateOtherSessions}
              disabled={terminatingSessions}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/60 hover:border-amber-500/50 transition self-start sm:self-auto disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج من جميع الأجهزة الأخرى</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                sess.isCurrent
                  ? 'border-cyan-500/40 bg-cyan-950/20 shadow-sm'
                  : 'border-slate-800/80 bg-slate-950/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    sess.isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {sess.userAgent.includes('Mobile') ? 'هاتف محمول' : 'جهاز كمبيوتر / متصفح'}
                    </span>
                    {sess.isCurrent && (
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                        هذا الجهاز الحالي
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                    {sess.userAgent}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">عنوان IP</span>
                  <span>{sess.ip}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">آخر نشاط</span>
                  <span>{new Date(sess.lastActive).toLocaleTimeString('ar-EG')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Activity Logs Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="font-serif text-lg font-bold text-white">سجل النشاطات الإدارية</h3>
              <p className="text-xs text-slate-400">
                تسجيل موثوق لكافة العمليات الإدارية المهمة (تسجيل الدخول، تعديل الحساب، النشر)
              </p>
            </div>
          </div>
          <button
            onClick={loadAccountData}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تحديث السجل</span>
          </button>
        </div>

        {activityLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">لا توجد سجلات نشاط مسجلة بعد.</div>
        ) : (
          <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {activityLogs.slice(0, 15).map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      log.status === 'success'
                        ? 'bg-emerald-400'
                        : log.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{log.actionLabel}</span>
                      <span className="text-[10px] font-mono text-slate-500">{log.action}</span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-400 mt-0.5">{log.details}</p>
                    )}
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono block">
                    {new Date(log.timestamp).toLocaleDateString('ar-EG')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('ar-EG')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

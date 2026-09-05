import React, { useState, useEffect } from 'react';
import { Settings, Send, Check, Sparkles, FolderPlus, Tag, ExternalLink, RefreshCw } from 'lucide-react';
import type { SiteSettings, Category } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';

interface SettingsTabProps {
  settings: SiteSettings;
  categories: Category[];
  onSettingsUpdated: (settings: SiteSettings) => void;
  onCategoriesUpdated: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  categories,
  onSettingsUpdated,
  onCategoriesUpdated,
}) => {
  const [siteName, setSiteName] = useState(settings.siteName);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [bio, setBio] = useState(settings.bio);
  const [snowEnabled, setSnowEnabled] = useState(settings.snowEnabled);
  const [audioEnabled, setAudioEnabled] = useState(settings.audioEnabled);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Telegram state
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [telegramInfo, setTelegramInfo] = useState<{
    botUsername: string;
    botUrl: string;
    chatId: string;
    isActivated: boolean;
  }>({
    botUsername: 'nasamatshtabot',
    botUrl: 'https://t.me/nasamatshtabot',
    chatId: '8607243024',
    isActivated: false,
  });
  const [customChatId, setCustomChatId] = useState('');
  const [updatingChatId, setUpdatingChatId] = useState(false);

  // Add category state
  const [newCatName, setNewCatName] = useState('');
  const [catAdding, setCatAdding] = useState(false);

  useEffect(() => {
    fetchTelegramStatus();
  }, []);

  const fetchTelegramStatus = async () => {
    try {
      const res = await apiRequest<{
        success: boolean;
        botUsername: string;
        botUrl: string;
        chatId: string;
        isActivated: boolean;
      }>('/api/admin/telegram/status');
      if (res && res.chatId) {
        setTelegramInfo(res);
        setCustomChatId(res.chatId);
      }
    } catch {
      // Ignore background fetch error
    }
  };

  const handleUpdateChatId = async () => {
    if (!customChatId.trim()) return;
    setUpdatingChatId(true);
    try {
      await apiRequest('/api/admin/telegram/update-chat', {
        method: 'POST',
        body: JSON.stringify({ chatId: customChatId.trim() }),
      });
      setTelegramStatus('تم تحديث معرف المحادثة بنجاح.');
      fetchTelegramStatus();
    } catch (err: any) {
      setTelegramStatus(`فشل التحديث: ${err.message}`);
    } finally {
      setUpdatingChatId(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; settings: SiteSettings }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          siteName,
          slogan,
          bio,
          snowEnabled,
          audioEnabled,
        }),
      });
      onSettingsUpdated(res.settings);
      setSuccessMsg('تم حفظ إعدادات الموقع بنجاح ✓');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTelegramTesting(true);
    setTelegramStatus(null);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/telegram/test', {
        method: 'POST',
      });
      setTelegramStatus(res.message || 'تم إرسال رسالة تجريبية ناجحة إلى حسابك في تيليجرام!');
      fetchTelegramStatus();
    } catch (err: any) {
      setTelegramStatus(`⚠️ ${err.message || 'تعذر الإرسال'}`);
      fetchTelegramStatus();
    } finally {
      setTelegramTesting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatAdding(true);
    try {
      await apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      setNewCatName('');
      onCategoriesUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة التصنيف');
    } finally {
      setCatAdding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-cyan-400" />
          <span>إعدادات الموقع وتيليجرام والتصنيفات</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          تخصيص الهوية الشتوية وربط بوت التيليجرام للتحكم والإشعارات.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 backdrop-blur-md">
          <h3 className="font-serif text-lg font-bold text-white mb-2">هوية الموقع والمظهر</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              اسم الموقع
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              العبارة الأساسية (Slogan)
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              نبذة عن الملاذ (Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-6 pt-2 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={snowEnabled}
                onChange={(e) => setSnowEnabled(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>تفعيل تساقط الثلج افتراضياً</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span>إتاحة مشغل الأصوات الشتوية</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition disabled:opacity-50 mt-2"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>

        {/* Telegram Bot Integration Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-cyan-400" />
                <span>ربط بوت تيليجرام للتحكم والإشعارات</span>
              </h3>
              {telegramInfo.isActivated ? (
                <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>متصل ومفعل ✓</span>
                </span>
              ) : (
                <span className="rounded-full bg-amber-950/80 border border-amber-500/30 px-2.5 py-0.5 text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>بانتظار الضغط على Start ⏳</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-light">
              يتم إرسال إشعارات فورية إلى حسابك بتيليجرام عند: زيارة جديدة للموقع، تعليق من زائر، إعجاب، محاولة تسجيل دخول، أو إنشاء نسخة احتياطية.
            </p>

            {/* Direct Bot Link Box */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3.5 mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-cyan-200">
                  معرّف البوت الرسمي: @{telegramInfo.botUsername}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  افتح البوت واضغط <b>Start</b> لبدء استقبال الإشعارات والتحكم.
                </p>
              </div>
              <a
                href={telegramInfo.botUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition"
              >
                <span>فتح في تيليجرام</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs space-y-2.5 text-slate-300 font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">معرف المحادثة (Chat ID):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customChatId}
                    onChange={(e) => setCustomChatId(e.target.value)}
                    className="w-28 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-cyan-300 focus:border-cyan-400 focus:outline-none"
                    placeholder="Chat ID"
                  />
                  <button
                    onClick={handleUpdateChatId}
                    disabled={updatingChatId}
                    className="rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] text-slate-300 transition"
                  >
                    {updatingChatId ? '...' : 'تحديث'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">حالة الاستماع (Polling):</span>
                <span className="text-emerald-400">استماع مستمر للأوامر 🟢</span>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-sans">
                الأوامر المدعومة من تيليجرام:
                <br />
                <code className="text-cyan-300">/stats</code> — إحصائيات الموقع الشاملة
                <br />
                <code className="text-cyan-300">/posts</code> — جرد التدوينات الخاصة والعامة
                <br />
                <code className="text-cyan-300">/security</code> — تقرير الأمان وآخر المحاولات
                <br />
                <code className="text-cyan-300">/backup</code> — إنشاء وتشفير نسخة احتياطية فورية
              </div>
            </div>

            {telegramStatus && (
              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-xs text-cyan-200">
                {telegramStatus}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleTestTelegram}
              disabled={telegramTesting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 py-2.5 text-xs font-bold text-cyan-200 transition disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{telegramTesting ? 'جاري الإرسال للتليجرام...' : 'إرسال رسالة تجريبية'}</span>
            </button>
            <button
              onClick={fetchTelegramStatus}
              title="تحديث الحالة"
              className="rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 p-2.5 text-slate-300 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Management */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <h3 className="font-serif text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-cyan-400" />
          <span>إدارة التصنيفات ({categories.length})</span>
        </h3>

        {/* Existing Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((c) => (
            <span
              key={c.id}
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200"
            >
              {c.name}
            </span>
          ))}
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex gap-3 max-w-md">
          <input
            type="text"
            placeholder="اسم تصنيف جديد..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={catAdding || !newCatName.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition disabled:opacity-50"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>إضافة</span>
          </button>
        </form>
      </div>
    </div>
  );
};

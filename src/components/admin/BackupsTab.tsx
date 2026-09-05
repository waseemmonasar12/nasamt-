import React, { useState, useEffect } from 'react';
import { Database, Download, Plus, Shield, Check, Clock } from 'lucide-react';
import type { BackupInfo } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';

export const BackupsTab: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; backups: BackupInfo[] }>('/api/admin/backups');
      setBackups(res.backups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setSuccessMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; backup: BackupInfo }>('/api/admin/backups', {
        method: 'POST',
      });
      setSuccessMsg(`تم إنشاء نسخة احتياطية مشفرة بنجاح: ${res.backup.filename}`);
      loadBackups();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (backup: BackupInfo) => {
    // Generate downloadable file
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-cyan-400" />
            <span>النسخ الاحتياطية المشفرة (AES-256)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            يتم تشفير جميع التدوينات والملاحظات والتعليقات تلقائياً لحمايتها من الفقدان.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="flex items-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>{creating ? 'جاري إنشاء النسخة...' : 'إنشاء نسخة احتياطية الآن'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Backups List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">جاري تحميل النسخ...</div>
        ) : backups.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 py-16 text-center">
            <Shield className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <p className="font-serif text-lg text-slate-300">لا توجد نسخ احتياطية مسجلة بعد</p>
            <p className="text-xs text-slate-500 mt-1">اضغط على زر إنشاء نسخة بالأعلى للبدء.</p>
          </div>
        ) : (
          backups.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {b.filename}
                  </span>
                  <span className="rounded bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-[10px] text-cyan-300">
                    AES-256-GCM
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(b.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                  <span>•</span>
                  <span>{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <button
                onClick={() => handleDownload(b)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تحميل</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

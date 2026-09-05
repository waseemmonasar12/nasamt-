import React, { useState } from 'react';
import { MessageSquare, Trash2, CheckCircle, Clock } from 'lucide-react';
import type { Comment } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';

interface CommentsTabProps {
  comments: Comment[];
  onRefresh: () => void;
}

export const CommentsTab: React.FC<CommentsTabProps> = ({ comments, onRefresh }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    setDeletingId(commentId);
    try {
      await apiRequest(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف التعليق');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-cyan-400" />
          <span>إدارة تعليقات الزوار ({comments.length})</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          مراجعة التعليقات المتروكة من الزوار على تدويناتك العامة.
        </p>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 py-16 text-center">
            <p className="font-serif text-lg text-slate-300">لا توجد أي تعليقات حتى الآن</p>
            <p className="text-xs text-slate-500 mt-1">ستظهر تعليقات الزوار هنا فور إرسالها.</p>
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm hover:border-slate-700 transition"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-300">{c.authorName}</span>
                  <span className="text-slate-500 text-[10px]">•</span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString('ar-EG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-light">
                  {c.content}
                </p>
              </div>

              <button
                onClick={() => handleDelete(c.id)}
                disabled={deletingId === c.id}
                className="rounded-xl border border-red-900/40 bg-red-950/30 hover:bg-red-900/50 p-2 text-red-400 transition self-end sm:self-center"
                title="حذف التعليق"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

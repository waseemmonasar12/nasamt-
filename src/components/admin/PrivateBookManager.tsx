import React, { useState, useEffect } from 'react';
import {
  Book,
  ChevronRight,
  ChevronLeft,
  Plus,
  Edit3,
  Trash2,
  Printer,
  Sparkles,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import {
  BookPage,
  INITIAL_BOOK_PAGES,
  getSavedBookPages,
  saveBookPages,
} from '../../data/bookData.js';

export const PrivateBookManager: React.FC = () => {
  const [pages, setPages] = useState<BookPage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for adding/editing
  const [editType, setEditType] = useState<'poetry' | 'prose' | 'cover' | 'conclusion'>('prose');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPoetry, setEditPoetry] = useState('');

  useEffect(() => {
    setPages(getSavedBookPages());
  }, []);

  const currentPage = pages[currentIndex] || pages[0];

  const handleNext = () => {
    if (currentIndex < pages.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleOpenEdit = () => {
    if (!currentPage) return;
    setEditType(currentPage.type);
    setEditTitle(currentPage.title || '');
    setEditContent(currentPage.content || '');
    setEditPoetry(currentPage.poetry || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...pages];
    updated[currentIndex] = {
      ...currentPage,
      type: editType,
      title: editTitle.trim() || undefined,
      content: editContent.trim() || undefined,
      poetry: editPoetry.trim() || undefined,
    };
    setPages(updated);
    saveBookPages(updated);
    setIsEditing(false);
  };

  const handleOpenAdd = () => {
    setEditType('prose');
    setEditTitle('');
    setEditContent('');
    setEditPoetry('');
    setIsAdding(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newPage: BookPage = {
      id: `page-${Date.now()}`,
      type: editType,
      title: editTitle.trim() || undefined,
      content: editContent.trim() || undefined,
      poetry: editPoetry.trim() || undefined,
    };
    const updated = [...pages, newPage];
    setPages(updated);
    saveBookPages(updated);
    setCurrentIndex(updated.length - 1);
    setIsAdding(false);
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) {
      alert('لا يمكن حذف الصفحة الوحيدة في الديوان');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه الصفحة من ديوانك الخاص؟')) {
      const updated = pages.filter((_, idx) => idx !== currentIndex);
      setPages(updated);
      saveBookPages(updated);
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'هل تريد استعادة النسخة الأصلية للديوان (30 صفحة من الخواطر والشعر)؟'
      )
    ) {
      setPages(INITIAL_BOOK_PAGES);
      saveBookPages(INITIAL_BOOK_PAGES);
      setCurrentIndex(0);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentPage) return null;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-900/30 bg-amber-950/20 p-4 sm:p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-amber-400" />
            <h3 className="font-serif text-xl font-bold text-amber-100">
              ديوان الخواطر والشعر السري
            </h3>
            <span className="rounded-full border border-amber-500/30 bg-amber-950/60 px-2 py-0.5 text-[10px] text-amber-300 font-bold">
              خاص بك فقط 🔒
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-400/60 font-light">
            كتابك الخاص («إلى أختي التي لم تنجبها أمي») — محفوظ ومحمي، يمكنك قراءته، تعديل صفحاته، وإضافة خواطر جديدة.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-700/30 hover:bg-amber-700/50 px-3 py-1.5 text-xs text-amber-200 transition font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة صفحة</span>
          </button>

          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/80 hover:bg-stone-800 px-3 py-1.5 text-xs text-stone-200 transition"
          >
            <Edit3 className="h-3.5 w-3.5 text-amber-400" />
            <span>تعديل الصفحة</span>
          </button>

          <button
            onClick={handleDeletePage}
            className="flex items-center gap-1.5 rounded-xl border border-rose-900/40 bg-rose-950/30 hover:bg-rose-900/50 px-3 py-1.5 text-xs text-rose-300 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>حذف</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/80 hover:bg-stone-800 px-3 py-1.5 text-xs text-stone-300 transition"
            title="طباعة أو حفظ بصيغة PDF"
          >
            <Printer className="h-3.5 w-3.5 text-cyan-400" />
            <span>طباعة</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1 rounded-xl border border-stone-800/60 bg-stone-950 px-2.5 py-1.5 text-[11px] text-stone-400 hover:text-stone-200 transition"
            title="استعادة الـ 30 صفحة الأصلية"
          >
            <RotateCcw className="h-3 w-3" />
            <span>استعادة الأصل</span>
          </button>
        </div>
      </div>

      {/* Book Frame / Reader */}
      <div className="relative mx-auto max-w-2xl rounded-3xl border border-amber-900/40 bg-gradient-to-br from-[#1c131d] via-[#130d17] to-[#0a070c] p-8 sm:p-12 shadow-2xl shadow-purple-950/50 text-center min-h-[380px] flex flex-col justify-between">
        {/* Subtle Watermark */}
        <div className="text-center font-serif text-xs tracking-widest text-amber-200/30 uppercase flex items-center justify-center gap-2">
          <span>❄️</span>
          <span>نسمة شتاء — الديوان السري</span>
          <span>❄️</span>
        </div>

        {/* Page Content Rendering */}
        <div className="my-8 flex flex-col items-center justify-center">
          {currentPage.type === 'cover' && (
            <div className="space-y-4 max-w-lg">
              <span className="text-xs uppercase tracking-[0.3em] text-amber-400/80 font-bold">
                غلاف الديوان
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100 leading-tight">
                {currentPage.title || 'إلى أختي التي لم تنجبها أمي'}
              </h2>
              <div className="mx-auto w-16 h-0.5 bg-amber-500/40 my-3" />
              <p className="text-sm text-stone-300 leading-relaxed font-light italic">
                {currentPage.content}
              </p>
            </div>
          )}

          {currentPage.type === 'prose' && (
            <div className="space-y-4 max-w-lg">
              {currentPage.title && (
                <h4 className="font-serif text-lg font-bold text-amber-200 mb-2">
                  {currentPage.title}
                </h4>
              )}
              <p className="font-serif text-lg sm:text-xl text-stone-200 leading-loose font-light">
                «{currentPage.content}»
              </p>
            </div>
          )}

          {currentPage.type === 'poetry' && (
            <div className="space-y-4 max-w-lg">
              {currentPage.title && (
                <h4 className="font-serif text-base font-bold text-amber-300 mb-2">
                  {currentPage.title}
                </h4>
              )}
              <div className="rounded-2xl border border-amber-900/30 bg-amber-950/20 py-6 px-6 sm:px-10">
                <p className="font-serif text-xl sm:text-2xl text-amber-200 leading-loose whitespace-pre-line tracking-wide font-medium">
                  {currentPage.poetry}
                </p>
              </div>
            </div>
          )}

          {currentPage.type === 'conclusion' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="font-serif text-2xl font-bold text-amber-300">
                {currentPage.title || 'ختاماً'}
              </h3>
              <div className="mx-auto w-16 h-0.5 bg-amber-500/40 my-3" />
              <p className="font-serif text-base sm:text-lg text-stone-300 leading-loose whitespace-pre-line font-light">
                {currentPage.content}
              </p>
            </div>
          )}
        </div>

        {/* Page navigation controls */}
        <div className="flex items-center justify-between border-t border-amber-900/30 pt-6">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 rounded-full border border-amber-900/40 bg-stone-900/60 px-4 py-2 text-xs text-stone-300 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronRight className="h-4 w-4" />
            <span>الصفحة السابقة</span>
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs text-amber-300/80 font-mono">
              صفحة {currentIndex + 1} من {pages.length}
            </span>
            <input
              type="range"
              min={0}
              max={pages.length - 1}
              value={currentIndex}
              onChange={(e) => setCurrentIndex(Number(e.target.value))}
              className="w-32 h-1 accent-amber-500 bg-stone-800 rounded-lg cursor-pointer mt-1"
            />
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === pages.length - 1}
            className="flex items-center gap-1.5 rounded-full border border-amber-900/40 bg-stone-900/60 px-4 py-2 text-xs text-stone-300 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <span>الصفحة التالية</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit Page Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-amber-900/50 bg-[#140e18] p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-amber-900/30 pb-4 mb-4">
              <h4 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-400" />
                <span>تعديل الصفحة رقم {currentIndex + 1}</span>
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs text-amber-300/80 mb-1">نوع المحتوى</label>
                <select
                  value={editType}
                  onChange={(e: any) => setEditType(e.target.value)}
                  className="w-full rounded-xl border border-amber-900/40 bg-stone-950 p-2.5 text-xs text-stone-200"
                >
                  <option value="prose">خاطرة / نثر</option>
                  <option value="poetry">أبيات شعرية</option>
                  <option value="cover">صفحة غلاف</option>
                  <option value="conclusion">خاتمة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">العنوان (اختياري)</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="عنوان الصفحة أو البيت..."
                  className="w-full rounded-xl border border-amber-900/40 bg-stone-950 p-2.5 text-xs text-stone-200"
                />
              </div>

              {editType === 'poetry' ? (
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">الأبيات الشعرية (الصدر والعجز)</label>
                  <textarea
                    rows={4}
                    value={editPoetry}
                    onChange={(e) => setEditPoetry(e.target.value)}
                    placeholder="اكتب الأبيات الشعرية هنا مع مراعاة الشطرين..."
                    className="w-full rounded-xl border border-amber-900/40 bg-stone-950 p-2.5 text-xs text-stone-200 font-serif"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">نص الخاطرة / النثر</label>
                  <textarea
                    rows={5}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="اكتب الخاطرة هنا..."
                    className="w-full rounded-xl border border-amber-900/40 bg-stone-950 p-2.5 text-xs text-stone-200 font-serif"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-lg transition"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Page Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-amber-900/50 bg-[#140e18] p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-amber-900/30 pb-4 mb-4">
              <h4 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-400" />
                <span>إضافة صفحة جديدة للديوان</span>
              </h4>
              <button
                onClick={() => setIsAdding(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-amber-300/80 mb-1">نوع المحتوى</label>
                <select
                  value={editType}
                  onChange={(e: any) => setEditType(e.target.value)}
                  className="w-full rounded-xl border border-amber-900/40 bg-stone-950 p-2.5 text-xs text-stone-200"
                >
                  <option value="prose">خاطرة / نثر</option>
                  <option value="poetry">أبيات شعرية</option>
                  <option value="conclusion">خاتمة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">العنوان (اختياري)</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="عنوان الصفحة..."
                  className="w-full rounded-xl border border-amber-900/40 bg-stone-950 p-2.5 text-xs text-stone-200"
                />
              </div>

              {editType === 'poetry' ? (
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">الأبيات الشعرية</label>
                  <textarea
                    rows={4}
                    value={editPoetry}
                    onChange={(e) => setEditPoetry(e.target.value)}
                    placeholder="اكتب الأبيات الشعرية هنا..."
                    className="w-full rounded-xl border border-amber-900/40 bg-stone-950 p-2.5 text-xs text-stone-200 font-serif"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">نص الخاطرة / النثر</label>
                  <textarea
                    rows={5}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="اكتب كلماتك وخواطرك هنا..."
                    className="w-full rounded-xl border border-amber-900/40 bg-stone-950 p-2.5 text-xs text-stone-200 font-serif"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-lg transition"
                >
                  إضافة الصفحة للديوان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

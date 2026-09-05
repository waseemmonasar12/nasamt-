import React from 'react';
import { X, ShieldCheck, FileText, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-w-lg w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8 text-slate-200">
        <button onClick={onClose} className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-4 text-cyan-400">
          <Info className="h-6 w-6" />
          <h2 className="font-serif text-2xl font-bold text-white">عن «نسمة شتاء»</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300 font-light">
          <p>
            «نسمة شتاء» هو ملاذ رقمي شخصي فاخر وهادئ، صُمم ليكون مساحة دافئة في عالم رقمي بارد، حيث يدوّن صاحب الموقع أفكاره وخواطره وذكرياته.
          </p>
          <p>
            الموقع ليس شبكة تواصل عامة أو منصة تدوين مفتوحة للجميع، بل مساحة حصرية يمتلك فيها صاحب الموقع وحده صلاحيات الكتابة والإدارة والتحكم في ما يُشارك مع الزوار وما يبقى سرياً ومشفراً داخل الغرفة الخاصة.
          </p>
          <p className="text-cyan-300 font-serif italic pt-2">
            «اكتب ما لا تستطيع قوله... واحتفظ بما لا تريد أن يراه أحد... وشارك العالم فقط ما تريد أن يصل إليه.»
          </p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-w-lg w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8 text-slate-200">
        <button onClick={onClose} className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-4 text-emerald-400">
          <ShieldCheck className="h-6 w-6" />
          <h2 className="font-serif text-2xl font-bold text-white">سياسة الخصوصية والأمان</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300 font-light">
          <p>
            نحن نحترم خصوصية جميع الزوار إلى أقصى حد:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-xs">
            <li>لا نستخدم أي ملفات تعريف ارتباط (Cookies) لتتبع الزوار إعلانياً.</li>
            <li>لا نجمع بيانات شخصية إلزامية من الزائر، والاسم في التعليق اختياري.</li>
            <li>الكتابات الخاصة لصاحب الموقع مشفرة ومحمية ببروتوكول AES-256 ولا يمكن لأي زائر الوصول إليها برمجياً أو عبر الـ API.</li>
            <li>تسجيل الدخول محمي بنظام Rate Limiting وحماية من محاولات التخمين.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const TermsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-w-lg w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8 text-slate-200">
        <button onClick={onClose} className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-4 text-cyan-400">
          <FileText className="h-6 w-6" />
          <h2 className="font-serif text-2xl font-bold text-white">شروط الاستخدام</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300 font-light">
          <p>
            جميع النصوص والخواطر المنشورة في موقع «نسمة شتاء» هي حقوق فكرية وأدبية محفوظة لصاحب الموقع.
          </p>
          <p>
            يُسمح للزوار بقراءة ومشاركة الروابط مع ذكر المصدر، ويُحظر نسخ المحتوى أو إعادة نشره لأغراض تجارية دون إذن مسبق.
          </p>
          <p>
            يخضع أي تعليق يتركه الزائر للمراجعة من قبل صاحب الموقع، ويحق له حذف أي محتوى مسيء فوراً.
          </p>
        </div>
      </div>
    </div>
  );
};

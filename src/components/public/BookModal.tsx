import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Book } from 'lucide-react';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BOOK_PAGES = [
  {
    type: 'cover',
    title: 'إلى أختي التي لم تنجبها أمي',
    content: 'إهداءٌ يليقُ بنقاءِ قلبكِ، وجمالِ روحكِ، ومقامكِ المحفوظ في صحائف الاحترام.',
  },
  {
    type: 'prose',
    content: 'بعضُ الأرواحِ تُخلقُ من نور، لا تجمعنا بهم قرابةُ الدم، بل تربطنا بهم قرابةُ القلوب وصفاء النوايا العالية. وأنتِ أولهم.',
  },
  {
    type: 'poetry',
    poetry: 'أُخَيَّةَ الرُّوحِ لا أُمٌّ لَنا جَمَعَتْ\nبَلْ جَمَّعَ اللهُ أَرْواحاً عَلى الطِّيبِ',
  },
  {
    type: 'prose',
    content: 'أنتِ نسمةُ الشتاءِ التي لا تحملُ البرد، بل تحملُ غيثاً يغسلُ تعبَ الأيام ويُحيي في النفسِ الأملَ بوجود الخير.',
  },
  {
    type: 'poetry',
    poetry: 'كَالغَيْثِ أَنْتِ إِذا حَلَّتْ مَواكِبُهُ\nيَكْسُو القُلوبَ رَبيعاً بَعْدَ تَجْدِيبِ',
  },
  {
    type: 'prose',
    content: 'في الشدائدِ تُعرفُ المعادن الأصيلة، ومعدنكِ أنقى من الذهب. صبركِ وتحملكِ للمشقة يُدرّس، وقوتكِ المغلفة بالوقار هي أعظم مزاياكِ.',
  },
  {
    type: 'poetry',
    poetry: 'بِنْتُ الأُصُولِ إِذا هَبَّتْ عَواصِفُها\nرَسَتْ كَطَوْدٍ مَهِيبٍ غَيْرِ مَغْلوبِ',
  },
  {
    type: 'prose',
    content: 'مواقفكِ النبيلة تقف شاهدة على أصالتك، كشجرةٍ طيبةٍ أصلها ثابت وتعطي بلا منّ ولا أذى، فاستحققتِ كل التقدير.',
  },
  {
    type: 'poetry',
    poetry: 'في مَجْلِسِ الذِّكْرِ وَالأَخْلاقِ حاضِرَةٌ\nطِيبُ الأُصولِ لَها ثَوْبٌ مِنَ الأَدَبِ',
  },
  {
    type: 'prose',
    content: 'نقاءُ قلبكِ يشبهُ بياضَ الثلجِ في شتاءٍ هادئ، لا يحملُ حقداً ولا ضغينة، بل يفيضُ تسامحاً ونبلاً يلحظه كل من عرفك.',
  },
  {
    type: 'poetry',
    poetry: 'بَيْضاءُ قَلْبٍ كَثَلْجٍ في نَقاوَتِهِ\nما خالَطَتْها ظُنُونُ الشَّكِ وَالرِّيبِ',
  },
  {
    type: 'prose',
    content: 'الأخوةُ الراقية لا تُقاس بكثرة اللقاء ولا بكثرة الحديث، بل بصدق الدعوات ونبل المواقف. وأنتِ أثبتِّ أن النقاء لا يزال موجوداً.',
  },
  {
    type: 'poetry',
    poetry: 'أُخْتٌ كَريمَةُ أَخْلاقٍ وَمَنْزِلَةٍ\nكَالنَّجْمِ يَسْطَعُ في لَيْلٍ بِلا سُحُبِ',
  },
  {
    type: 'prose',
    content: 'حضوركِ الهادئ وحديثكِ المتزن يتركان أثراً طيباً، وكأنكِ تنثرين الاحترام أينما حللتِ، وتفرِضين التقدير بأخلاقكِ.',
  },
  {
    type: 'poetry',
    poetry: 'يَفُوحُ مِنْ ذِكْرِها طِيبٌ وَمَكْرُمَةٌ\nوَحُسْنُ سِيرَتِها يَسْرِي مَعَ الحِقَبِ',
  },
  {
    type: 'prose',
    content: 'لو كُتبتْ قصائدُ المديحِ في حُسنِ الخلق، لكنتِ أنتِ مطلعَ القصيدةِ وختامها. لأنكِ تجمعين الحشمة، والرزانة، والوقار.',
  },
  {
    type: 'poetry',
    poetry: 'مُتَوَّجٌ بِحَياءٍ كُلُّ مَنْطِقِها\nوَحُسْنُ أَخْلاقِها نِبْراسُ مَطْلُوبِ',
  },
  {
    type: 'prose',
    content: 'نسمةُ الشتاءِ قد تكون باردة للبعض، لكنها بالنسبةِ لي هي النسيمُ النقي الذي يُذكّرني بأن الدنيا لا تزال بخير بوجود أمثالك.',
  },
  {
    type: 'poetry',
    poetry: 'تَنْسابُ كَالرُّوحِ في الأَبْدانِ طاهِرَةً\nفَتُبْرِئُ النَّفْسَ مِنْ هَمٍّ وَمِنْ تَعَبِ',
  },
  {
    type: 'prose',
    content: 'لم نولد في نفسِ الدار، لكننا نلتقي عند نفسِ القناعات، والمبادئ، واحترام الذات. وهذا هو أعظم أنواعِ الرقي الإنساني.',
  },
  {
    type: 'poetry',
    poetry: 'تَواصَلَتْ رُوحُنا في صِدْقِ مَقْصَدِها\nعَلى النَّقاءِ بِلا زَيْفٍ وَتَكْذِيبِ',
  },
  {
    type: 'prose',
    content: 'أفخرُ بكل الصعاب التي تغلبتِ عليها بشموخ، وكأنكِ تخبرين الحياة أنكِ أكبر من كل تحدٍ، وأن الكسر لا يعرف طريقاً إليكِ.',
  },
  {
    type: 'poetry',
    poetry: 'شامِخَةٌ كَنُجُومِ اللَّيْلِ عالِيَةٌ\nلا تَنْحَنِي لِصُرُوفِ الدَّهْرِ وَالنُّوبِ',
  },
  {
    type: 'prose',
    content: 'أدعو الله في كل حين، أن يديمَ عليكِ هذا النقاء، وأن يجنبكِ كلَّ حزنٍ، وأن يجعل أيامكِ القادمة بياضاً كبياض قلبك.',
  },
  {
    type: 'poetry',
    poetry: 'دَعَوْتُ رَبِّيَ أَنْ تَبْقَى مُنَعَّمَةً\nفِي حِفْظِهِ مِنْ جَمِيعِ الهَمِّ وَالكَرَبِ',
  },
  {
    type: 'prose',
    content: 'معرفةُ الأشخاصِ المخلصين في هذا الزمان رزق، وأنتِ رزقٌ ساقه الله ليعلمنا أن الأخوة لا تتطلب سوى قلبٍ نظيف وعقلٍ راجح.',
  },
  {
    type: 'poetry',
    poetry: 'رِزْقٌ مِنَ اللهِ في دُنْيا مُلَوَّثَةٍ\nأَخْلاقُها كَشُعاعِ الشَّمْسِ في السُّحُبِ',
  },
  {
    type: 'prose',
    content: 'ستبقين دائماً في مكانةٍ عالية، أختٌ أعتز بها، ومثالٌ للرقي أذكره بالخير، وأدعو لها في ظهر الغيب بما يليق بصفائها.',
  },
  {
    type: 'poetry',
    poetry: 'عَهْدٌ عَلَيَّ أُخَيَّتِي مَدى عُمُري\nأَنْ أَحْفَظَ الوُدَّ في حَلٍّ وَمُغْتَرَبِ',
  },
  {
    type: 'conclusion',
    title: 'ختاماً',
    content: 'تنتهي صفحاتُ هذا الكتاب هنا...\nولكن صفحات احترامي ومودتي الأخوية لكِ لا نهاية لها.\nدُمتِ بخير، ودامت "نسمة شتاء" تهبّ بالنقاء.',
  },
];

export const BookModal: React.FC<BookModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const page = BOOK_PAGES[currentPage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-rose-900/40 bg-gradient-to-br from-[#231526] via-[#1a1120] to-[#0d0912] p-6 shadow-2xl shadow-purple-950/60 sm:p-8">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Watermark */}
        <div className="text-center font-serif text-sm tracking-widest text-rose-300/30 mb-6">
          ❄️ نسمة شتاء
        </div>

        {/* Page Content */}
        <div className="min-h-[280px] flex flex-col justify-center items-center text-center px-4">
          {page.type === 'cover' && (
            <>
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-rose-700/60 bg-rose-950/30 text-rose-200">
                <Book className="h-9 w-9 text-rose-300" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-rose-200 mb-3 leading-snug">
                {page.title}
              </h2>
              <p className="font-serif text-base sm:text-lg text-rose-100/80 leading-relaxed max-w-sm">
                {page.content}
              </p>
            </>
          )}

          {page.type === 'prose' && (
            <p className="font-serif text-lg sm:text-xl text-rose-100/90 leading-loose max-w-sm">
              {page.content}
            </p>
          )}

          {page.type === 'poetry' && (
            <div className="font-serif text-xl sm:text-2xl font-bold text-amber-200/90 leading-loose whitespace-pre-line tracking-wide">
              {page.poetry}
            </div>
          )}

          {page.type === 'conclusion' && (
            <>
              <h2 className="font-serif text-2xl font-bold text-rose-200 mb-3">
                {page.title}
              </h2>
              <p className="font-serif text-lg text-rose-100/90 leading-loose whitespace-pre-line max-w-sm">
                {page.content}
              </p>
            </>
          )}
        </div>

        {/* Page Indicator */}
        <div className="text-center text-xs text-rose-300/40 my-4 font-mono">
          {currentPage + 1} / {BOOK_PAGES.length}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 border-t border-rose-900/30 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1 rounded-xl border border-rose-800/40 bg-rose-950/30 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
            <span>السابق</span>
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.min(BOOK_PAGES.length - 1, p + 1))}
            disabled={currentPage === BOOK_PAGES.length - 1}
            className="flex items-center gap-1 rounded-xl border border-rose-800/40 bg-rose-950/30 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>التالي</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

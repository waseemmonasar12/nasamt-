import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Wind, CloudRain, Flame } from 'lucide-react';
import { ambientSound, AmbientSoundType } from '../../utils/audio.js';

export const AudioControlWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundType, setSoundType] = useState<AmbientSoundType>('wind');
  const [volume, setVolume] = useState(0.35);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsPlaying(ambientSound.getIsPlaying());
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      ambientSound.stop();
      setIsPlaying(false);
    } else {
      ambientSound.setVolume(volume);
      ambientSound.play(soundType);
      setIsPlaying(true);
    }
  };

  const changeType = (type: AmbientSoundType) => {
    setSoundType(type);
    if (isPlaying) {
      ambientSound.play(type);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ambientSound.setVolume(val);
  };

  return (
    <div className="relative inline-block text-right">
      <button
        id="btn-toggle-ambient-audio"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm backdrop-blur-md transition-all border border-white/20 bg-white/5 hover:bg-white/10 ${
          isPlaying
            ? 'text-cyan-300 border-cyan-400/40 bg-cyan-950/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
            : 'text-white/80'
        }`}
        title="أجواء الشتاء الصوتية"
      >
        {isPlaying ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs opacity-90">الأجواء نشطة</span>
          </>
        ) : (
          <>
            <span>🔊</span>
            <span className="text-xs opacity-70">تشغيل الأجواء</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-3 w-64 rounded-2xl border border-white/15 bg-[#020617]/95 p-4 shadow-2xl backdrop-blur-2xl z-50 text-slate-200">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-cyan-300 tracking-wide">أصوات شتوية مهدئة</span>
            <button
              onClick={togglePlay}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                isPlaying ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-white text-slate-900 hover:bg-white/90 shadow-sm'
              }`}
            >
              {isPlaying ? 'إيقاف 🔇' : 'تشغيل 🔊'}
            </button>
          </div>

          <div className="space-y-2 mb-3">
            <button
              onClick={() => changeType('wind')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors ${
                soundType === 'wind'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Wind className="h-3.5 w-3.5 text-cyan-400" />
              <span>رياح كانونية هادئة</span>
            </button>

            <button
              onClick={() => changeType('rain')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors ${
                soundType === 'rain'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
              <span>مطر شتوي ناعم</span>
            </button>

            <button
              onClick={() => changeType('fireplace')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors ${
                soundType === 'fireplace'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>طقطقة الحطب والمدفأة</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>مستوى الصوت</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

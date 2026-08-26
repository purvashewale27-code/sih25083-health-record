import React, { useState } from 'react';

interface AudioPrescriptionPlayerProps {
  textToSpeak: string;
  language: string; // 'Bengali' | 'Hindi' | 'Assamese' | 'Odia' | 'Malayalam' | 'English'
  label?: string;
}

export const AudioPrescriptionPlayer: React.FC<AudioPrescriptionPlayerProps> = ({
  textToSpeak,
  language,
  label = 'Listen in Native Language',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);

  const getLanguageBcp47 = (lang: string): string => {
    const l = lang.toLowerCase();
    if (l.includes('bengali') || l.includes('bn')) return 'bn-IN';
    if (l.includes('hindi') || l.includes('hi')) return 'hi-IN';
    if (l.includes('malayalam') || l.includes('ml')) return 'ml-IN';
    if (l.includes('odia') || l.includes('oriya') || l.includes('or')) return 'or-IN';
    if (l.includes('assamese') || l.includes('as')) return 'as-IN';
    return 'en-IN';
  };

  const handleTogglePlay = () => {
    if (!isSupported) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel(); // Clear queue
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = getLanguageBcp47(language);
    utterance.rate = 0.9; // Slightly slower for clear comprehension

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!isSupported || !textToSpeak.trim()) return null;

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-xs ${
        isPlaying
          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
          : 'bg-[#E8F8F6] text-[#00A99D] hover:bg-[#d5f3ee] border-[#00A99D]/30'
      }`}
    >
      <span>{isPlaying ? '⏹️ Stop Audio' : '🔊 ' + label}</span>
      <span className="text-[10px] font-mono font-bold uppercase opacity-80">({language})</span>
    </button>
  );
};

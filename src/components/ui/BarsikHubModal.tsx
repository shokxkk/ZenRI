'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Crown, Laugh, Mic, Share2, Download, CheckCircle2, Sparkles, Wifi, Cpu, Bot, Volume2, VolumeX, Send, MicOff } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { speakBarsikVoice } from '@/lib/barsikVoice';

interface BarsikHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  currentStreak: number;
  initialTab?: 'CARD' | 'MEME' | 'VOICE';
}

export const BarsikHubModal: React.FC<BarsikHubModalProps> = ({
  isOpen,
  onClose,
  userName,
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  currentStreak,
  initialTab = 'CARD',
}) => {
  const [activeTab, setActiveTab] = useState<'CARD' | 'MEME' | 'VOICE'>(initialTab);

  // VIP Card State
  const [copied, setCopied] = useState(false);

  // Meme State
  const [currentMeme, setCurrentMeme] = useState<BarsikMeme | null>(null);

  // Voice State
  const [inputText, setInputText] = useState('');
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ answerText: string; chartType: string; chartData: any } | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCurrentMeme(getRandomMemeForCategory());
    }
  }, [isOpen, initialTab]);

  // Voice Recognition Init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'ru-RU';
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
          handleVoiceQuery(transcript);
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  const handleVoiceQuery = async (queryStr?: string) => {
    const textToSend = queryStr || inputText;
    if (!textToSend.trim()) return;

    soundFx.playClick();
    setLoadingVoice(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai/barsik-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend, totalBalance, monthlyIncome, monthlyExpense }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResponse(data);
        speakBarsikVoice(data.answerText, isMuted);
      }
    } catch {} finally {
      setLoadingVoice(false);
    }
  };

  if (!isOpen) return null;

  const isNegative = totalBalance <= 0;
  const isHigh = totalBalance >= 10_000_000;
  const cardStatus = isNegative
    ? { title: 'Зона Риска 🔴', badge: 'ZenRI Black Alert', color: '#EF4444', gradient: 'from-[#2A0D15] via-[#1F0A0F] to-[#0A0305]', mascot: '/images/mascot_angry_hoodie.png' }
    : isHigh
    ? { title: 'Абсолютный Чемпион 👑', badge: 'ZenRI Gold VIP', color: '#F59E0B', gradient: 'from-[#382607] via-[#241804] to-[#0D0801]', mascot: '/images/mascot_rich_hoodie.png' }
    : { title: 'Финансовый Мастер 🎯', badge: 'ZenRI Platinum Member', color: '#00C2FF', gradient: 'from-[#0F1E36] via-[#0B1628] to-[#050A14]', mascot: '/images/mascot_happy_hoodie.png' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#060C1B] border border-white/15 p-6 shadow-2xl text-white space-y-5 overflow-hidden">

        {/* Modal Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] flex items-center justify-center text-white font-black shadow-lg">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Центр Барсика</h3>
              <p className="text-[11px] text-slate-400">VIP Карта, ИИ-Голос и Мемы</p>
            </div>
          </div>

          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Sleek iOS Style Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10 relative z-10">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('CARD'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'CARD'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown size={14} />
            <span>VIP Карта</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('MEME'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'MEME'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laugh size={14} />
            <span>Мем Дня</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('VOICE'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'VOICE'
                ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic size={14} />
            <span>ИИ Голос</span>
          </button>
        </div>

        {/* ═══ TAB 1: VIP CARD ═══ */}
        {activeTab === 'CARD' && (
          <div className="space-y-4 animate-in fade-in duration-200 relative z-10">
            <div
              className={`w-full aspect-[1.586/1] rounded-3xl bg-gradient-to-br ${cardStatus.gradient} p-5 border shadow-2xl relative overflow-hidden flex flex-col justify-between`}
              style={{ borderColor: `${cardStatus.color}60` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-xs">7.</div>
                  <div>
                    <span className="font-black text-sm text-white">ZenRI</span>
                    <span className="block text-[8px] font-mono text-slate-400 uppercase">{cardStatus.badge}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400"><Wifi size={16} /><Cpu size={20} className="text-amber-400" /></div>
              </div>

              <div className="flex items-center justify-between my-1">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Владелец</span>
                  <h2 className="text-xl font-black text-white font-mono">{userName.toUpperCase()}</h2>
                  <span className="text-[10px] font-bold text-amber-300">{cardStatus.title}</span>
                </div>
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/30 bg-black/60 shadow-xl flex-shrink-0">
                  <img src={cardStatus.mascot} alt="Барсик" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex justify-between items-end pt-2 border-t border-white/10">
                <p className="text-[9px] font-mono text-slate-400">ID: #8797-2026-VIP</p>
                <p className="text-xs font-black text-amber-300">🔥 {currentStreak} дн. подряд</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const text = encodeURIComponent(`🔥 Моя VIP-карта в ZenRI Life OS!\nПользователь: ${userName}\nСтатус: ${cardStatus.title}\nwww.zenri.uz 🚀`);
                  window.open(`https://t.me/share/url?url=https://www.zenri.uz&text=${text}`, '_blank');
                }}
                className="py-3 px-4 rounded-2xl bg-[#0088CC] text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110"
              >
                <Share2 size={14} />
                <span>Поделиться</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://www.zenri.uz — Моя VIP-карта ZenRI: ${cardStatus.title}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="py-3 px-4 rounded-2xl bg-white/10 text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-white/20"
              >
                {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Download size={14} />}
                <span>{copied ? 'Скопировано!' : 'Скопировать'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══ TAB 2: MEME LAB ═══ */}
        {activeTab === 'MEME' && currentMeme && (
          <div className="space-y-4 animate-in fade-in duration-200 relative z-10">
            <div className={`p-4 rounded-3xl bg-gradient-to-b ${currentMeme.bgGradient} border border-white/20 text-center space-y-3`}>
              <h2 className="text-base font-black text-amber-300 uppercase tracking-wide">{currentMeme.topText}</h2>
              <div className="w-24 h-24 mx-auto">
                <img src={currentMeme.mascotImage} alt="Мем" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs font-bold text-white">{currentMeme.bottomText}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentMeme(getRandomMemeForCategory())}
                className="py-3 px-4 rounded-2xl bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-purple-500"
              >
                <Laugh size={14} />
                <span>Другой мем</span>
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(`🎭 Мем от Барсика:\n«${currentMeme.topText}»\n«${currentMeme.bottomText}»\nwww.zenri.uz`);
                  window.open(`https://t.me/share/url?url=https://www.zenri.uz&text=${text}`, '_blank');
                }}
                className="py-3 px-4 rounded-2xl bg-[#0088CC] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110"
              >
                <Share2 size={14} />
                <span>В Telegram</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══ TAB 3: VOICE AI ═══ */}
        {activeTab === 'VOICE' && (
          <div className="space-y-4 animate-in fade-in duration-200 relative z-10">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-3">
              <button
                onClick={() => {
                  if (isListening) {
                    recognitionRef.current?.stop();
                    setIsListening(false);
                  } else {
                    setInputText('');
                    try { recognitionRef.current?.start(); setIsListening(true); } catch {}
                  }
                }}
                className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'bg-rose-600 scale-110 shadow-[0_0_20px_#ef4444]' : 'bg-[#0066FF] shadow-glow'
                }`}
              >
                {isListening ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
              </button>

              <p className="text-xs font-bold text-slate-300">
                {isListening ? 'Слушаю ваш вопрос...' : 'Нажмите микрофон или напишите вопрос'}
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVoiceQuery()}
                placeholder="Сколько потратил на такси?"
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
              />
              <button onClick={() => handleVoiceQuery()} disabled={loadingVoice || !inputText.trim()} className="py-2.5 px-4 rounded-xl bg-[#0066FF] text-white font-bold text-xs">
                <Send size={14} />
              </button>
            </div>

            {aiResponse && (
              <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-400/30 text-xs text-slate-200 space-y-1">
                <p className="font-medium">{aiResponse.answerText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Send, Bot, TrendingDown, Wallet, PieChart as PieIcon } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface BarsikVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export const BarsikVoiceModal: React.FC<BarsikVoiceModalProps> = ({
  isOpen,
  onClose,
  totalBalance,
  monthlyIncome,
  monthlyExpense,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    answerText: string;
    chartType: string;
    chartData: any;
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
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
          handleSendQuery(transcript);
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Speak AI answer out loud using SpeechSynthesis
  const speakText = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      soundFx.playClick();
      setInputText('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendQuery = async (queryStr?: string) => {
    const textToSend = queryStr || inputText;
    if (!textToSend.trim()) return;

    soundFx.playClick();
    setLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai/barsik-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          totalBalance,
          monthlyIncome,
          monthlyExpense,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiResponse(data);
        speakText(data.answerText);
      }
    } catch {
      // Error fallback
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0F1E36] via-[#0D182E] to-[#070D1A] border border-blue-500/30 p-6 shadow-2xl text-white overflow-hidden space-y-5">

        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-blue-400/40 bg-black/60 shadow-lg flex-shrink-0">
              <img src="/images/mascot_happy_hoodie.png" alt="Барсик" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-white">Голосовой Барсик</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-[#00C2FF] text-[10px] font-black border border-blue-500/30">
                  AI 2.0
                </span>
              </div>
              <p className="text-[11px] text-zen-400">Спроси голосом про такси, еду или советы</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted) window.speechSynthesis?.cancel();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zen-300 transition-colors"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className={isSpeaking ? 'text-[#00C2FF] animate-pulse' : ''} />}
            </button>
            <button
              onClick={() => {
                window.speechSynthesis?.cancel();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zen-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Voice Recording Wave Status */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center space-y-3 relative z-10">
          <button
            onClick={toggleListening}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isListening
                ? 'bg-rose-600 scale-110 shadow-[0_0_30px_#ef4444]'
                : 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] hover:scale-105 shadow-glow'
            }`}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
            )}
            {isListening ? <MicOff size={26} className="text-white relative z-10" /> : <Mic size={26} className="text-white relative z-10" />}
          </button>

          <p className="text-xs font-bold text-center">
            {isListening ? (
              <span className="text-rose-400 animate-pulse">Слушаю вас... Говорите запрос</span>
            ) : (
              <span className="text-zen-300">Нажмите микрофон и задайте вопрос</span>
            )}
          </p>

          {/* Preset quick voice prompts */}
          <div className="flex flex-wrap gap-1.5 justify-center pt-1">
            {[
              '🚖 Сколько потратил на такси?',
              '🍔 Сколько ушло на еду?',
              '💡 Дай совет как сэкономить',
            ].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setInputText(p.replace(/^[^\s]+\s/, ''));
                  handleSendQuery(p.replace(/^[^\s]+\s/, ''));
                }}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-medium text-zen-200 transition-all active:scale-95"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Row */}
        <div className="flex items-center gap-2 relative z-10">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder="Или введите вопрос текстом..."
            className="flex-1 py-3 px-4 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder:text-zen-500 focus:outline-none focus:border-[#00C2FF]"
          />
          <button
            onClick={() => handleSendQuery()}
            disabled={loading || !inputText.trim()}
            className="py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Send size={14} />
          </button>
        </div>

        {/* AI Answer Card & Dynamic Mini Charts */}
        {aiResponse && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-blue-950/90 border border-blue-400/30 space-y-3 relative z-10 animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5">
              <Bot size={18} className="text-[#00C2FF] flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-zen-100 font-medium">
                {aiResponse.answerText}
              </p>
            </div>

            {/* Render Mini Charts */}
            {aiResponse.chartType === 'BAR' && Array.isArray(aiResponse.chartData) && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                <p className="text-[10px] font-bold text-zen-400 uppercase tracking-widest">Разбивка расходов на транспорт</p>
                {aiResponse.chartData.map((item: any) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zen-200">{item.label}</span>
                      <span className="font-bold text-white">{item.amount.toLocaleString('ru-RU')} сум</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-[#00C2FF] rounded-full"
                        style={{ width: `${Math.min(100, (item.amount / 300000) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aiResponse.chartType === 'DONUT' && Array.isArray(aiResponse.chartData) && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                <p className="text-[10px] font-bold text-zen-400 uppercase tracking-widest">Категория: Еда и Рестораны</p>
                <div className="grid grid-cols-2 gap-2">
                  {aiResponse.chartData.map((item: any) => (
                    <div key={item.label} className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                      <p className="text-[10px] text-zen-400">{item.label}</p>
                      <p className="text-xs font-black text-white mt-0.5">{item.value.toLocaleString('ru-RU')} сум</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

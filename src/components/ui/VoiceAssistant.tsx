'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic, MicOff, Loader2, CheckCircle2, AlertCircle, X,
  TrendingUp, TrendingDown, Zap, Edit3, Wallet, RotateCcw
} from 'lucide-react';
import { parseVoiceCommand, type ParsedVoiceCommand } from '@/lib/voiceParser';
import { addTransaction, getAccounts } from '@/app/actions/financeActions';
import { soundFx } from '@/lib/soundEffects';
import { convertToWav } from '@/lib/wavConverter';

type VoiceState = 'idle' | 'recording' | 'processing' | 'result' | 'error' | 'success';

interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: number | string;
}

interface VoiceAssistantProps {
  size?: 'sm' | 'lg';
}

const QUICK_CATEGORIES = ['Авто', 'Кафе / Еда', 'Продукты', 'Такси', 'Зарплата', 'Перевод', 'Дом'];

export function VoiceAssistant({ size = 'sm' }: VoiceAssistantProps) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedVoiceCommand | null>(null);

  // Editable confirmation card fields
  const [confirmType, setConfirmType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [confirmAmount, setConfirmAmount] = useState<string>('');
  const [confirmComment, setConfirmComment] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mount check for React Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load accounts once
  useEffect(() => {
    getAccounts().then((accs) => {
      const mapped = accs.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currentBalance: Number(a.currentBalance),
      }));
      setAccounts(mapped);
      if (mapped.length > 0) setSelectedAccountId(mapped[0].id);
    });
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setParsed(null);
    setErrorMsg('');
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setState('processing');
        const rawBlob = new Blob(chunksRef.current, { type: mimeType });

        try {
          // Convert to WAV for Aisha STT API
          const wavBlob = await convertToWav(rawBlob);

          const formData = new FormData();
          formData.append('audio', wavBlob, 'voice.wav');
          formData.append('language', 'ru');

          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();

          if (!res.ok || data.error) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }

          const text = (data.transcript || '').trim();
          setTranscript(text);

          if (!text) {
            setState('error');
            setErrorMsg('Речь не распознана. Говорите громче и ближе к микрофону.');
            return;
          }

          const result = parseVoiceCommand(text);
          setParsed(result);
          setConfirmType(result.type);
          setConfirmAmount(result.amount > 0 ? String(result.amount) : '');
          setConfirmComment(result.comment);

          // ALWAYS show confirmation card!
          setState('result');
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
          setState('error');
          setErrorMsg(message);
        }
      };

      recorder.start();
      setState('recording');

      // Timer
      let sec = 0;
      timerRef.current = setInterval(() => {
        sec += 1;
        setRecordingTime(sec);
        if (sec >= 15) stopRecording();
      }, 1000);
    } catch {
      setState('error');
      setErrorMsg('Нет доступа к микрофону. Разрешите использование микрофона в браузере.');
    }
  }, [stopRecording]);

  const handleConfirm = async () => {
    const amountNum = parseFloat(confirmAmount.replace(/\s+/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Укажите корректную сумму');
      return;
    }
    if (!selectedAccountId) {
      alert('Выберите счёт');
      return;
    }

    try {
      setState('processing');
      if (confirmType === 'INCOME') {
        soundFx.playIncomeSound();
      } else {
        soundFx.playExpenseSound();
      }
      await addTransaction({
        type: confirmType,
        amount: amountNum,
        accountId: selectedAccountId,
        comment: confirmComment || (confirmType === 'INCOME' ? 'Доход' : 'Расход'),
      });
      setState('success');
      setTimeout(reset, 2000);
    } catch {
      setState('error');
      setErrorMsg('Ошибка при сохранении транзакции');
    }
  };

  const handleAddThousands = () => {
    if (!confirmAmount) setConfirmAmount('1000');
    else setConfirmAmount((prev) => prev + '000');
  };

  const getLabel = () => {
    if (state === 'recording') return `${recordingTime}с • Слушаю...`;
    if (state === 'processing') return 'Распознаю...';
    if (state === 'success') return 'Добавлено!';
    if (state === 'error') return 'Ошибка';
    return 'Голосовой ввод';
  };

  const formattedAmountPreview = () => {
    const num = parseFloat(confirmAmount.replace(/\s+/g, ''));
    if (isNaN(num) || num <= 0) return null;
    return new Intl.NumberFormat('ru-RU').format(num) + ' сум';
  };

  // ── Confirmation / Result Overlay Card Portal
  const renderCard = () => {
    if (!mounted || state === 'idle' || state === 'recording' || state === 'processing') return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        style={{ backdropFilter: 'blur(16px)', background: 'rgba(3, 6, 15, 0.82)' }}
        onClick={reset}
      >
        <div
          className="w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border relative my-auto animate-in zoom-in-95 duration-200"
          style={{
            background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.7), 0 0 50px rgba(0, 102, 255, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={reset}
            className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            title="Закрыть"
          >
            <X size={20} />
          </button>

          {/* Success view */}
          {state === 'success' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-bounce">
                <CheckCircle2 size={44} className="text-emerald-400" />
              </div>
              <p className="text-white font-bold text-2xl">Добавлено!</p>
              <p className="text-zinc-300 text-base text-center">
                {confirmComment || (confirmType === 'INCOME' ? 'Доход' : 'Расход')} —{' '}
                <span className={confirmType === 'INCOME' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {confirmType === 'INCOME' ? '+' : '−'} {formattedAmountPreview()}
                </span>
              </p>
            </div>
          )}

          {/* Error view */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <p className="text-white font-bold text-xl text-center">Не удалось обработать</p>
              <p className="text-zinc-300 text-sm text-center whitespace-pre-line leading-relaxed">{errorMsg}</p>
              <button
                onClick={reset}
                className="mt-2 w-full py-3.5 rounded-2xl bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Попробовать снова
              </button>
            </div>
          )}

          {/* Confirmation Form (Result) */}
          {state === 'result' && (
            <div className="flex flex-col gap-5">
              {/* Header Title */}
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-snug">Голосовая операция</h3>
                  <p className="text-xs text-zinc-400">Проверьте данные и подтвердите запись</p>
                </div>
              </div>

              {/* Transcribed Speech Quote Box */}
              <div className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3">
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">
                  Распознанный голос
                </p>
                <p className="text-zinc-200 text-sm italic font-medium">«{transcript}»</p>
              </div>

              {/* 1. TYPE SELECTOR (Расход vs Доход) */}
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block uppercase tracking-wider">
                  Тип операции
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmType('EXPENSE')}
                    className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all border ${
                      confirmType === 'EXPENSE'
                        ? 'bg-red-500/90 text-white border-red-400 shadow-lg shadow-red-500/30 scale-[1.02]'
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <TrendingDown size={20} />
                    − Расход
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmType('INCOME')}
                    className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all border ${
                      confirmType === 'INCOME'
                        ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-lg shadow-emerald-500/30 scale-[1.02]'
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <TrendingUp size={20} />
                    + Доход
                  </button>
                </div>
              </div>

              {/* 2. AMOUNT INPUT + QUICK MULTIPLIERS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Сумма
                  </label>
                  {formattedAmountPreview() && (
                    <span className="text-xs font-bold text-blue-400">
                      = {formattedAmountPreview()}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={confirmAmount}
                    onChange={(e) => setConfirmAmount(e.target.value)}
                    placeholder="0"
                    className={`w-full rounded-2xl bg-black/40 border text-white font-black text-2xl px-4 py-3 focus:outline-none transition-all ${
                      confirmType === 'INCOME'
                        ? 'focus:border-emerald-400 text-emerald-400 border-white/10'
                        : 'focus:border-red-400 text-red-400 border-white/10'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-zinc-500">
                    UZS
                  </span>
                </div>

                {/* Quick Multipliers */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-zinc-500 font-medium">Быстрые:</span>
                  <button
                    type="button"
                    onClick={handleAddThousands}
                    className="px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-500/30 transition-colors"
                  >
                    +000 (тыс)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(confirmAmount) || 0;
                      setConfirmAmount(String(cur + 100000));
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs border border-white/10 transition-colors"
                  >
                    +100 000
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(confirmAmount) || 0;
                      setConfirmAmount(String(cur + 10000));
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs border border-white/10 transition-colors"
                  >
                    +10 000
                  </button>
                </div>
              </div>

              {/* 3. CATEGORY / DESCRIPTION + SUGGESTIONS */}
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase tracking-wider">
                  Описание / Категория
                </label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={confirmComment}
                    onChange={(e) => setConfirmComment(e.target.value)}
                    placeholder="Например: Авто, Кафе, Зарплата..."
                    className="w-full rounded-2xl bg-black/40 border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-blue-400 font-medium"
                  />
                  <Edit3 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                </div>

                {/* Quick Category Suggestion Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setConfirmComment(cat)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                        confirmComment === cat
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. ACCOUNT SELECTOR */}
              {accounts.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 mb-1.5 block uppercase tracking-wider">
                    Счёт
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full rounded-2xl bg-black/40 border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-blue-400 font-medium appearance-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id} style={{ background: '#1E293B' }}>
                          {acc.name} — {new Intl.NumberFormat('ru-RU').format(Number(acc.currentBalance))} сум
                        </option>
                      ))}
                    </select>
                    <Wallet size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* ACTIONS FOOTER */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`flex-2 py-3.5 px-6 rounded-2xl text-white text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
                    confirmType === 'INCOME'
                      ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'
                      : 'bg-red-500 hover:bg-red-400 shadow-red-500/30'
                  }`}
                >
                  {confirmType === 'INCOME' ? 'Добавить доход ✓' : 'Добавить расход ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  // ─────────────────────────────────────────────
  // LARGE pill button (center of header)
  // ─────────────────────────────────────────────
  if (size === 'lg') {
    return (
      <>
        <button
          onMouseDown={state === 'idle' ? startRecording : undefined}
          onMouseUp={state === 'recording' ? stopRecording : undefined}
          onTouchStart={state === 'idle' ? startRecording : undefined}
          onTouchEnd={state === 'recording' ? stopRecording : undefined}
          onClick={state === 'error' || state === 'result' ? reset : undefined}
          disabled={state === 'processing' || state === 'success'}
          title="Удерживайте для записи"
          className={`
            relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl
            font-semibold text-sm transition-all duration-200 select-none
            ${state === 'idle'
              ? 'bg-gradient-to-r from-violet-600/90 to-blue-600/90 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.03]'
              : ''}
            ${state === 'recording'
              ? 'bg-red-500 text-white shadow-xl shadow-red-500/50 scale-105'
              : ''}
            ${state === 'processing'
              ? 'bg-blue-600/60 text-blue-100 cursor-wait'
              : ''}
            ${state === 'success'
              ? 'bg-emerald-500/80 text-white'
              : ''}
            ${state === 'error'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : ''}
            ${state === 'result'
              ? 'bg-violet-600/80 text-white'
              : ''}
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
        >
          {/* Animated pulse rings while recording */}
          {state === 'recording' && (
            <>
              <span className="absolute inset-0 rounded-2xl bg-red-500 animate-ping opacity-30 pointer-events-none" />
              <span className="absolute inset-[-3px] rounded-[18px] border-2 border-red-400/60 animate-pulse pointer-events-none" />
            </>
          )}

          {/* Icon */}
          <span className="flex-shrink-0 relative z-10">
            {state === 'processing' ? (
              <Loader2 size={20} className="animate-spin" />
            ) : state === 'recording' ? (
              <MicOff size={20} />
            ) : state === 'success' ? (
              <CheckCircle2 size={20} />
            ) : state === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <Mic size={20} />
            )}
          </span>

          {/* Label */}
          <span className="relative z-10 whitespace-nowrap">{getLabel()}</span>

          {/* Waveform animation while recording */}
          {state === 'recording' && (
            <span className="flex items-center gap-[3px] ml-1 relative z-10">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-0.5 bg-white/80 rounded-full animate-bounce"
                  style={{
                    height: `${8 + i * 3}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s',
                  }}
                />
              ))}
            </span>
          )}
        </button>

        {/* Overlay card portal */}
        {renderCard()}
      </>
    );
  }

  // Small icon fallback
  return (
    <>
      <button
        onMouseDown={state === 'idle' ? startRecording : undefined}
        onMouseUp={state === 'recording' ? stopRecording : undefined}
        onTouchStart={state === 'idle' ? startRecording : undefined}
        onTouchEnd={state === 'recording' ? stopRecording : undefined}
        onClick={state === 'error' || state === 'result' ? reset : undefined}
        disabled={state === 'processing' || state === 'success'}
        title={state === 'idle' ? 'Удерживайте для записи' : getLabel()}
        className={`
          relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center
          ${state === 'idle' ? 'text-zinc-400 hover:text-violet-400 bg-zinc-100 dark:bg-[#131C2E]' : ''}
          ${state === 'recording' ? 'text-white bg-red-500 shadow-lg shadow-red-500/40 scale-105' : ''}
          ${state === 'processing' ? 'text-blue-400 bg-blue-50 dark:bg-blue-900/20 cursor-wait' : ''}
          ${state === 'success' ? 'text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : ''}
          ${state === 'error' ? 'text-red-400 bg-red-50 dark:bg-red-900/20' : ''}
          ${state === 'result' ? 'text-violet-400 bg-violet-50 dark:bg-violet-900/20' : ''}
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
      >
        {state === 'recording' && (
          <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-40" />
        )}
        {state === 'processing' ? (
          <Loader2 size={18} className="animate-spin" />
        ) : state === 'recording' ? (
          <MicOff size={18} />
        ) : state === 'success' ? (
          <CheckCircle2 size={18} />
        ) : (
          <Mic size={18} />
        )}
        {state === 'recording' && recordingTime > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center leading-none">
            {recordingTime}s
          </span>
        )}
      </button>
      {renderCard()}
    </>
  );
}

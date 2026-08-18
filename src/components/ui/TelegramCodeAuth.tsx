'use client';

import React, { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { verifyTelegramSixDigitCode } from '@/app/actions/authActions';
import { Send, KeyRound, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface TelegramCodeAuthProps {
  botUsername?: string;
  onSuccess?: () => void;
}

export function TelegramCodeAuth({ botUsername = 'zenriauthefication_bot', onSuccess }: TelegramCodeAuthProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (codeToVerify: string) => {
    const clean = codeToVerify.replace(/\D/g, '').trim();
    if (clean.length !== 6) {
      setError('Введите полный 6-значный код');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyTelegramSixDigitCode(clean);
      if (!res.success || !res.user) {
        setError(res.error || 'Неверный код. Запросите новый в Telegram-боте.');
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Sign in with verified user id
      const signInRes = await signIn('telegram', {
        userId: res.user.id,
        redirect: false,
      });

      if (signInRes?.error) {
        setError('Ошибка создания сессии');
        setLoading(false);
      } else {
        onSuccess?.();
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    setError('');

    if (val.length === 6) {
      handleVerify(val);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Step 1: Open Bot Button */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          Шаг 1: Получите код в Telegram
        </label>
        <a
          href={`https://t.me/${botUsername}?start=getcode`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#229ED9] to-[#0066FF] hover:opacity-95 text-white font-extrabold text-xs shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Send size={15} className="fill-white" />
          <span>Открыть @{botUsername} → код придёт автоматически</span>
          <ExternalLink size={13} className="opacity-80 ml-auto" />
        </a>
      </div>

      {/* Step 2: Enter 6-digit Code */}
      <div className="space-y-2">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          Шаг 2: Введите 6 цифр из сообщения
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={handleCodeChange}
            disabled={loading || success}
            placeholder="• • • • • •"
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-950/90 border border-white/20 text-center text-2xl font-mono font-black tracking-[0.4em] text-white focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 transition-all placeholder:text-slate-600"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <KeyRound size={18} />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
            <CheckCircle2 size={15} />
            <span>Код принят! Переходим в личный кабинет...</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={() => handleVerify(code)}
          disabled={loading || success || code.length !== 6}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-200 text-slate-950 font-black text-xs transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin text-slate-950" />
              <span>Проверка кода...</span>
            </>
          ) : (
            <span>Подтвердить и войти в ZenRI</span>
          )}
        </button>
      </div>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        💡 Номер телефона вводить <b>не нужно</b>. Бот выдаст код сразу при нажатии Start.
      </p>
    </div>
  );
}

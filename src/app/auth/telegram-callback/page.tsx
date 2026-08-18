'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { verifyTelegramMagicToken } from '@/app/actions/authActions';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import Link from 'next/link';

function TelegramCallbackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Отсутствует токен авторизации');
      return;
    }

    async function processLogin() {
      try {
        const verifyRes = await verifyTelegramMagicToken(token as string);
        if (!verifyRes.success || !verifyRes.user) {
          setStatus('error');
          setErrorMessage(verifyRes.error || 'Недействительный токен');
          return;
        }

        setUserName(verifyRes.user.name);

        // Sign in via NextAuth telegram credentials provider
        const signInRes = await signIn('telegram', {
          userId: verifyRes.user.id,
          redirect: false,
        });

        if (signInRes?.error) {
          setStatus('error');
          setErrorMessage('Не удалось создать пользовательскую сессию');
        } else {
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1200);
        }
      } catch (e) {
        console.error('Login error:', e);
        setStatus('error');
        setErrorMessage('Произошла непредвиденная ошибка при входе');
      }
    }

    processLogin();
  }, [token]);

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6 text-center relative z-10">
      <div className="flex justify-center mb-2">
        <ZenLogo size="md" />
      </div>

      {status === 'loading' && (
        <div className="py-6 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center mx-auto shadow-glow">
            <Loader2 size={32} className="text-[#229ED9] animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Авторизация через Telegram</h2>
            <p className="text-xs text-slate-400 font-medium">Проверяем ваш профиль и подготавливаем личный кабинет...</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="py-6 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-glow">
            <CheckCircle2 size={32} className="text-emerald-400 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Добро пожаловать, {userName}!</h2>
            <p className="text-xs text-emerald-400 font-bold">Вход выполнен успешно! Перенаправляем на главную...</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="py-6 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-rose-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Ошибка авторизации</h2>
            <p className="text-xs text-rose-300 leading-relaxed font-medium">{errorMessage}</p>
          </div>
          <div className="pt-2 space-y-2">
            <a
              href="https://t.me/zenriauthefication_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#229ED9] hover:bg-[#1E8EC4] text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2"
            >
              <Send size={15} />
              <span>Открыть бота и получить новую ссылку</span>
            </a>
            <Link
              href="/login"
              className="block text-xs text-slate-400 hover:text-white pt-2 font-bold"
            >
              Вернуться на страницу входа
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TelegramCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col items-center justify-center p-6 selection:bg-[#0066FF] selection:text-white">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0066FF]/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#229ED9]/20 blur-[150px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6 text-center">
            <div className="flex justify-center mb-2">
              <ZenLogo size="md" />
            </div>
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center mx-auto">
                <Loader2 size={32} className="text-[#229ED9] animate-spin" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Загрузка...</p>
            </div>
          </div>
        }
      >
        <TelegramCallbackContent />
      </Suspense>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { TelegramCodeAuth } from '@/components/ui/TelegramCodeAuth';
import { Send, ShieldCheck } from 'lucide-react';


const TG_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'zenriauthefication_bot';

export default function RegisterPage() {

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col justify-between selection:bg-[#0066FF] selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#0066FF]/20 blur-[130px] animate-ambient-1 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/20 blur-[130px] animate-ambient-2 pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 px-6 lg:px-12 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-slate-950/60">
        <ZenLogo size="md" />
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="relative z-20 flex-1 max-w-4xl w-full mx-auto px-6 py-8 lg:py-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6">
            
            {/* Header Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#229ED9]/15 border border-[#229ED9]/30 text-xs font-bold text-[#54C8F0]">
                <Send size={13} />
                <span>Регистрация только через Telegram</span>
              </div>
            </div>

            <div className="space-y-1.5 text-center">
              <h1 className="text-2xl font-black text-white">Регистрация в ZenRI</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Регистрация происходит <b>через Telegram-бота</b>. Получите 6-значный код в боте и введите его ниже — номер телефона вводить не нужно.
              </p>
            </div>

            {/* 6-Digit Code Auth Box */}
            <TelegramCodeAuth
              botUsername={TG_BOT_USERNAME}
              onSuccess={() => {}}
            />

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Ваши финансовые данные конфиденциальны и зашифрованы</span>
            </div>

            <div className="pt-2 border-t border-white/10 text-center">
              <p className="text-xs text-slate-400">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-[#00C2FF] font-extrabold hover:underline">
                  Войти в аккаунт
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 px-6 lg:px-12 py-4 border-t border-white/5 bg-slate-950/80 text-center text-xs text-slate-500">
        © 2026 ZenRI Life OS. Все права защищены.
      </footer>
    </div>
  );
}

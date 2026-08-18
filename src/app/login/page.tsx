'use client';

import React from 'react';
import Link from 'next/link';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { TelegramCodeAuth } from '@/components/ui/TelegramCodeAuth';
import { Send, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

const TG_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'zenriauthefication_bot';

const FEATURES = [
  { icon: '🧠', text: 'Умный учёт финансов' },
  { icon: '📚', text: 'Трекер книг и привычек' },
  { icon: '🎯', text: 'Цели и задачи' },
  { icon: '🤖', text: 'AI-ассистент' },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col justify-between selection:bg-[#0066FF] selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#0066FF]/20 blur-[130px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/15 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 px-6 lg:px-12 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-slate-950/60">
        <ZenLogo size="md" />
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="relative z-20 flex-1 w-full mx-auto px-4 py-8 lg:py-12 flex items-center justify-center">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">

          {/* Left - Hero Text */}
          <div className="space-y-6 hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066FF]/15 border border-[#0066FF]/30 text-xs font-bold text-[#60A5FA]">
              <Sparkles size={13} />
              <span>ZenRI Life OS — Ваша система управления жизнью</span>
            </div>
            <h1 className="text-4xl font-black leading-tight text-white">
              Управляйте жизнью<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00C2FF]">и финансами в один клик</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Голосовой ввод расходов, учёт стоимости времени, ИИ прогноз накоплений и привычки в одном интерфейсе.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
                  <span>{f.icon}</span>
                  <span className="font-medium">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Login Card */}
          <div className="w-full max-w-md mx-auto">
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6 relative overflow-hidden">
              {/* Glow inside card */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#229ED9]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative space-y-1.5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#229ED9]/15 border border-[#229ED9]/30 text-xs font-bold text-[#54C8F0]">
                    <Send size={12} />
                    <span>Вход через Telegram</span>
                  </div>
                </div>
                <h2 className="text-xl font-black text-white">Войти в ZenRI</h2>
                <p className="text-[11px] text-slate-400 font-medium">Без пароля. Без номера телефона. Просто Telegram.</p>
              </div>

              <TelegramCodeAuth botUsername={TG_BOT_USERNAME} onSuccess={() => {}} />

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>Данные зашифрованы и защищены</span>
              </div>

              <div className="pt-2 border-t border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  Нет аккаунта?{' '}
                  <Link href="/register" className="text-[#00C2FF] font-extrabold hover:underline">
                    Зарегистрироваться
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: '⚡', label: 'Мгновенный вход' },
                { icon: '🔒', label: 'Нет паролей' },
                { icon: '📱', label: 'Через Telegram' },
              ].map((item) => (
                <div key={item.label} className="text-center p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-lg">{item.icon}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 px-6 lg:px-12 py-4 border-t border-white/5 bg-slate-950/80 text-center text-xs text-slate-500">
        © 2026 ZenRI Life OS. Все права защищены.
      </footer>
    </div>
  );
}

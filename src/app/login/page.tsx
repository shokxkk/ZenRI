'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Mic,
  Hourglass,
  Sparkles,
  Wallet,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    id: 'voice',
    icon: Mic,
    badge: 'Голосовой ввод ИИ',
    color: '#0066FF',
    title: 'Мгновенный ввод расходов голосом',
    desc: 'Скажите «50 000 сум такси» или «500 000 доход фриланс». Нейросеть распознает сумму, категорию и моментально внесёт в учёт.',
    image: '/images/feature_voice.png',
  },
  {
    id: 'lifetime',
    icon: Hourglass,
    badge: 'Стоимость Времени',
    color: '#8B5CF6',
    title: 'Учёт часов вашей жизни (4000 Weeks)',
    desc: 'Узнайте стоимость 1 часа работы и переводите любые покупки из сум в часы вашей единственной жизни.',
    image: '/images/feature_time.png',
  },
  {
    id: 'predict',
    icon: Sparkles,
    badge: 'Умный прогноз ИИ',
    color: '#EC4899',
    title: 'AI Прогноз тренда & Скоринг целей',
    desc: 'Нейросеть рассчитывает накопительный потенциал на 3, 6, 12 месяцев и скоринг достижения любой вашей мечты.',
    image: '/images/feature_predict.png',
  },
  {
    id: 'brands',
    icon: Wallet,
    badge: 'Мульти-счета',
    color: '#10B981',
    title: 'Карты Uzcard, Humo, Visa & Коммуналка',
    desc: 'Единый центр учёта балансов банковских карт, наличных денег, кредитов и коммунальных лицевых счетов.',
    image: '/images/feature_cards.png',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@zenri.app');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Неверный email или пароль');
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      email: 'demo@zenri.app',
      password: 'password123',
      redirect: false,
    });

    if (res?.error) {
      setError('Не удалось войти в демо-режим');
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  const currentFeature = FEATURES[activeTab];
  const ActiveIcon = currentFeature.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col justify-between selection:bg-[#0066FF] selection:text-white">
      {/* Background Radial Glow Mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#0066FF]/20 blur-[150px] animate-ambient-1 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#8B5CF6]/20 blur-[150px] animate-ambient-2 pointer-events-none" />
      <div className="absolute top-[35%] left-[35%] w-[450px] h-[450px] rounded-full bg-[#EC4899]/15 blur-[150px] animate-ambient-3 pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-20 px-6 lg:px-12 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-slate-950/70">
        <ZenLogo size="md" />

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Система активна и готова к работе</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Showcase & Login Grid */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Startup Showcase with Custom Feature Product Visuals (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0066FF]/20 via-[#8B5CF6]/20 to-[#EC4899]/20 border border-[#0066FF]/40 text-xs font-bold text-slate-200 shadow-glow">
            <Sparkles size={14} className="text-[#00C2FF]" />
            <span>Ежедневный центр управления жизнью и финансами</span>
          </div>

          {/* Minimal Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Управляйте жизнью и финансами в один клик.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed max-w-xl">
              Голосовой ввод расходов, учет стоимости времени жизни, ИИ прогноз накоплений и привычки в одном интерфейсе.
            </p>
          </div>

          {/* Feature Selector Tabs */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((feat, idx) => {
                const Icon = feat.icon;
                const isActive = activeTab === idx;
                return (
                  <button
                    key={feat.id}
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#0066FF] text-white shadow-glow scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{feat.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* Feature Showcase Card with Product Visual */}
            <div className="p-6 rounded-3xl bg-slate-900/85 border border-white/15 backdrop-blur-2xl relative overflow-hidden transition-all duration-300 grid sm:grid-cols-12 gap-6 items-center shadow-2xl group">
              <div className="sm:col-span-6 space-y-3 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00C2FF] flex items-center gap-1">
                  <Star size={11} className="text-amber-400 fill-amber-400" /> Ключевая функция
                </span>
                <h3 className="text-xl font-extrabold text-white leading-snug">{currentFeature.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{currentFeature.desc}</p>
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 size={15} />
                  <span>Работает моментально</span>
                </div>
              </div>

              {/* Product Feature Graphic Image */}
              <div className="sm:col-span-6 relative flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-40 pointer-events-none"
                  style={{ backgroundColor: currentFeature.color }}
                />
                <img
                  src={currentFeature.image}
                  alt={currentFeature.title}
                  className="w-full h-48 object-cover rounded-2xl border border-white/10 relative z-10 transform group-hover:scale-105 transition-transform duration-500 shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Minimal Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-black text-white">Быстро</p>
              <p className="text-[10px] text-slate-400 font-bold">Голосовой ввод операций</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-black text-[#00C2FF]">100%</p>
              <p className="text-[10px] text-slate-400 font-bold">Приватность данных</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-xl font-black text-emerald-400">Умно</p>
              <p className="text-[10px] text-slate-400 font-bold">ИИ Аналитика целей</p>
            </div>
          </div>
        </div>

        {/* Right Column: Glass Login Card (5 cols) */}
        <div className="lg:col-span-5 w-full">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6 relative overflow-hidden">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-black text-white">Вход в аккаунт</h2>
              <p className="text-xs text-slate-400 font-medium">Введите данные для доступа к вашему пространству ZenRI</p>
            </div>

            {/* Quick Demo Login Action Button */}
            <button
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#0066FF] via-[#7C3AED] to-[#EC4899] hover:opacity-95 text-white font-extrabold text-xs shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              <Zap size={16} className="fill-white" />
              <span>Войти в 1 клик (Демо-режим)</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 relative z-10">или по электронной почте</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Электронная почта *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#0066FF] transition-all"
                  placeholder="demo@zenri.app"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Пароль *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-10 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#0066FF] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 rounded-2xl bg-white hover:bg-slate-200 text-slate-950 font-black text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Вход в аккаунт...' : 'Войти в аккаунт'}
              </button>
            </form>

            <div className="pt-2 border-t border-white/10 text-center">
              <p className="text-xs text-slate-400">
                Ещё нет аккаунта?{' '}
                <Link href="/register" className="text-[#00C2FF] font-extrabold hover:underline">
                  Зарегистрироваться
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

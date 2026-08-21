'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { verifyTelegramSixDigitCode } from '@/app/actions/authActions';
import {
  Activity,
  BookOpen,
  Target,
  Sparkles,
  ShieldCheck,
  Brain,
  Smartphone,
  Headphones,
  PlusCircle,
  Star,
  Send,
  ExternalLink,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  MessageCircle,
  Zap,
  Crown,
  Check,
  Lock,
  ChevronDown,
  Gift,
  Clock,
  BadgePercent,
} from 'lucide-react';

const TG_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'zenriauthefication_bot';
const TG_SUPPORT = 'headsales';

// ─── High-Tech Cosmic Space Background with Earth Horizon & Shooting Stars ───
function CosmicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Stars data
    const starCount = 180;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.6 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    interface Meteor {
      x: number; y: number; len: number; speed: number;
      angle: number; opacity: number; active: boolean;
    }

    const meteors: Meteor[] = Array.from({ length: 3 }, () => ({
      x: 0, y: 0, len: 0, speed: 0, angle: 0, opacity: 0, active: false,
    }));

    const triggerMeteor = (m: Meteor) => {
      m.x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
      m.y = Math.random() * canvas.height * 0.35;
      m.len = Math.random() * 140 + 70;
      m.speed = Math.random() * 7 + 6;
      m.angle = Math.PI / 5 + (Math.random() - 0.5) * 0.15;
      m.opacity = 1;
      m.active = true;
    };

    meteors.forEach((m, idx) => {
      setTimeout(() => triggerMeteor(m), idx * 2500 + 500);
    });

    const meteorInterval = setInterval(() => {
      const inactive = meteors.find((m) => !m.active);
      if (inactive) triggerMeteor(inactive);
    }, 3200);

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        const currentAlpha = s.alpha * (0.5 + 0.5 * Math.sin(time * s.pulseSpeed * 60 + s.pulseOffset));
        ctx.fillStyle = `rgba(220, 235, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const m of meteors) {
        if (!m.active) continue;
        ctx.save();
        const startX = m.x, startY = m.y;
        const endX = m.x - m.len * Math.cos(m.angle);
        const endY = m.y - m.len * Math.sin(m.angle);
        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
        grad.addColorStop(0.25, `rgba(56, 189, 248, ${m.opacity * 0.9})`);
        grad.addColorStop(1, 'rgba(0, 102, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 255, 255, ${m.opacity})`;
        ctx.beginPath();
        ctx.arc(startX, startY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        m.x += m.speed * Math.cos(m.angle);
        m.y += m.speed * Math.sin(m.angle);
        m.opacity -= 0.02;
        if (m.opacity <= 0) m.active = false;
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(meteorInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}

// ─── 3D Glowing Galaxy Planet ────────────────────────
function CentralOrbitalGalaxy() {
  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none w-[340px] h-[340px] lg:w-[460px] lg:h-[460px]">
      <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0, 102, 255, 0.25) 0%, rgba(139, 92, 246, 0.15) 45%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute rounded-full border border-sky-400/40 animate-orbit-cw" style={{ width: '105%', height: '42%', transform: 'rotate(-24deg)', boxShadow: '0 0 25px rgba(56, 189, 248, 0.3), inset 0 0 20px rgba(56, 189, 248, 0.2)' }}>
        <div className="absolute -top-1.5 left-1/4 w-3.5 h-3.5 rounded-full bg-sky-300 shadow-glow" style={{ boxShadow: '0 0 14px 4px rgba(56, 189, 248, 0.9), 0 0 4px #fff' }} />
      </div>
      <div className="absolute rounded-full border border-purple-500/40 animate-orbit-ccw" style={{ width: '95%', height: '36%', transform: 'rotate(28deg)', boxShadow: '0 0 30px rgba(168, 85, 247, 0.35)' }}>
        <div className="absolute -bottom-1.5 right-1/3 w-3 h-3 rounded-full bg-purple-300" style={{ boxShadow: '0 0 12px 3px rgba(192, 132, 252, 0.9)' }} />
      </div>
      <div className="absolute rounded-full border border-dashed border-cyan-400/30 animate-orbit-cw" style={{ width: '115%', height: '48%', transform: 'rotate(-12deg)', animationDuration: '28s' }} />
      <div className="relative flex items-center justify-center rounded-full w-48 h-48 lg:w-60 lg:h-60" style={{ background: 'radial-gradient(circle at 35% 35%, #1e3a8a 0%, #0c1838 50%, #030712 100%)', boxShadow: '0 0 60px 15px rgba(0, 102, 255, 0.4), inset 0 0 40px rgba(56, 189, 248, 0.35)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-center transform scale-110 lg:scale-125">
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="zenLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#0070F3" />
                <stop offset="100%" stopColor="#0055FF" />
              </linearGradient>
              <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#38BDF8" floodOpacity="0.8" />
              </filter>
            </defs>
            <path d="M 22 24 C 22 19 26 15 31 15 L 86 15 C 91 15 95 19 93.5 24.5 L 68 82 C 65.5 87.5 59 90 53.5 87 C 48 84 46.5 77.5 49 72 L 69.5 27 L 31 27 C 26 27 22 23 22 24 Z" fill="url(#zenLogoGrad)" filter="url(#logoGlow)" />
            <circle cx="86" cy="78" r="11" fill="url(#zenLogoGrad)" filter="url(#logoGlow)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Telegram Auth Form ─────────────────────────────────────────────────────
function InlineTelegramAuth() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (codeToVerify: string) => {
    const clean = codeToVerify.replace(/\D/g, '').trim();
    if (clean.length !== 6) { setError('Введите полный 6-значный код'); return; }
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
      const signInRes = await signIn('telegram', { userId: res.user.id, redirect: false });
      if (signInRes?.error) {
        setError('Ошибка создания сессии');
        setLoading(false);
      } else {
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
    if (val.length === 6) handleVerify(val);
  };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1.5">
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ШАГ 1: ПОЛУЧИТЕ КОД В TELEGRAM</label>
        <a href={`https://t.me/${TG_BOT_USERNAME}?start=getcode`} target="_blank" rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0088CC] via-[#2563EB] to-[#7C3AED] hover:opacity-95 text-white font-extrabold text-xs shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95">
          <Send size={15} className="fill-white flex-shrink-0" />
          <span className="truncate">Открыть @{TG_BOT_USERNAME} → код придёт автоматически</span>
          <ExternalLink size={13} className="opacity-80 ml-auto flex-shrink-0" />
        </a>
      </div>
      <div className="space-y-2">
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ШАГ 2: ВВЕДИТЕ 6 ЦИФР ИЗ СООБЩЕНИЯ</label>
        <div className="relative">
          <input ref={inputRef} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code}
            onChange={handleCodeChange} disabled={loading || success} placeholder="•  •  •  •  •  •"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#081026] border border-blue-500/30 text-center text-xl font-mono font-black tracking-[0.35em] text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-600 shadow-inner" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><KeyRound size={17} /></div>
        </div>
        {error && (<div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center flex items-center justify-center gap-1.5"><AlertCircle size={14} className="flex-shrink-0" /><span>{error}</span></div>)}
        {success && (<div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse"><CheckCircle2 size={15} /><span>Код принят! Входим в личный кабинет...</span></div>)}
        <button type="button" onClick={() => handleVerify(code)} disabled={loading || success || code.length !== 6}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#3B82F6] to-[#0088CC] hover:brightness-110 text-white font-black text-xs transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (<><Loader2 size={15} className="animate-spin text-white" /><span>Проверка кода...</span></>) : (<span>Подтвердить и войти в ZenRI</span>)}
        </button>
      </div>
      <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
        💡 Номер телефона вводить <b>не нужно</b>. Бот выдаст код сразу при нажатии Start.
      </p>
    </div>
  );
}

// ─── Pricing Plans Section ───────────────────────────────────────────────────
const PLANS = [
  {
    id: '1m',
    label: '1 месяц',
    months: 1,
    pricePerMonth: 30000,
    totalPrice: 30000,
    discount: 0,
    icon: Zap,
    accent: '#3B82F6',
    badge: null,
    popular: false,
    tagline: 'Попробуй ZenRI',
  },
  {
    id: '3m',
    label: '3 месяца',
    months: 3,
    pricePerMonth: 30000,
    totalPrice: 90000,
    discount: 0,
    icon: Clock,
    accent: '#8B5CF6',
    badge: null,
    popular: false,
    tagline: 'Квартальный план',
  },
  {
    id: '6m',
    label: '6 месяцев',
    months: 6,
    pricePerMonth: 27000,
    totalPrice: 162000,
    discount: 10,
    icon: BadgePercent,
    accent: '#10B981',
    badge: '−10% скидка',
    popular: true,
    tagline: 'Популярный выбор 🔥',
  },
  {
    id: '12m',
    label: '12 месяцев',
    months: 12,
    pricePerMonth: 24000,
    totalPrice: 288000,
    discount: 20,
    icon: Crown,
    accent: '#F59E0B',
    badge: '−20% выгода',
    popular: false,
    tagline: 'Годовой план 👑',
  },
];

function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState('6m');
  const [showPayDetails, setShowPayDetails] = useState(false);
  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const formatSum = (v: number) => v.toLocaleString('ru-RU') + ' сум';

  const FEATURES_LIST = [
    'Учёт доходов и расходов',
    'Голосовой ввод транзакций',
    'ИИ финансовый анализ',
    'Категории и статистика',
    'Бюджет и цели',
    'Трекер привычек и книг',
    'ИИ-прогноз накоплений',
    'Маскот Барсик ZenRI',
  ];

  return (
    <section id="pricing" className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-16 lg:py-24">

      {/* Section Header */}
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300">
          <Crown size={13} className="text-amber-400" />
          <span>Тарифы подписки ZenRI</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
          Выберите <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#818CF8]">удобный план</span>
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          После оплаты вы получите персональный код активации через Telegram.
          Введите его при входе — и ваш личный кабинет откроется мгновенно.
        </p>
      </div>

      {/* How it works — 3 steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
        {[
          { step: '01', icon: CreditCard, title: 'Оплатите тариф', desc: 'Переведите сумму на карту или напишите нам в Telegram', color: '#3B82F6' },
          { step: '02', icon: MessageCircle, title: 'Получите код', desc: 'Мы пришлём персональный код активации в Telegram', color: '#8B5CF6' },
          { step: '03', icon: Zap, title: 'Получите доступ', desc: 'Введите код на странице входа — кабинет откроется!', color: '#10B981' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="relative p-5 rounded-2xl bg-[#070D1E]/90 border border-white/10 hover:border-blue-500/30 transition-all group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20`, color: item.color }}>
                  <Icon size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase">ШАГ {item.step}</span>
                  <p className="text-sm font-bold text-white mt-0.5">{item.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPlan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => { setSelectedPlan(p.id); setShowPayDetails(false); }}
              className={`relative p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 group ${
                isSelected
                  ? 'border-opacity-100 shadow-2xl scale-[1.02]'
                  : 'border-white/10 bg-[#070D1E]/90 hover:border-white/25 hover:scale-[1.01]'
              }`}
              style={isSelected ? {
                borderColor: p.accent,
                background: `linear-gradient(135deg, ${p.accent}18 0%, #070D1EF0 70%)`,
                boxShadow: `0 0 30px ${p.accent}30`,
              } : {}}
            >
              {/* Popular badge */}
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-black border text-white"
                  style={{ background: p.accent, borderColor: p.accent }}>
                  {p.badge}
                </div>
              )}

              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${p.accent}25`, color: p.accent }}>
                <Icon size={18} />
              </div>

              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{p.label}</p>
              <p className="text-sm font-bold text-white mt-0.5 leading-tight">{p.tagline}</p>

              <div className="mt-3 pt-3 border-t border-white/10">
                {p.discount > 0 && (
                  <p className="text-[10px] text-slate-500 line-through">{formatSum(30000 * p.months)}</p>
                )}
                <p className="text-xl sm:text-2xl font-black text-white">{formatSum(p.totalPrice)}</p>
                <p className="text-[11px] text-slate-400">{formatSum(p.pricePerMonth)}/мес</p>
              </div>

              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: p.accent }}>
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Plan Detail + Payment Methods */}
      <div className="rounded-3xl border border-white/10 bg-[#060C1D]/95 overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)' }}>

        {/* Summary row */}
        <div className="p-6 sm:p-8 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <plan.icon size={16} style={{ color: plan.accent }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: plan.accent }}>
                  Выбран: {plan.label}
                </span>
                {plan.discount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-white" style={{ background: plan.accent }}>
                    −{plan.discount}% скидка
                  </span>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{formatSum(plan.totalPrice)}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {plan.months === 1
                  ? 'За 1 месяц использования'
                  : `За ${plan.months} месяцев • ${formatSum(plan.pricePerMonth)} в месяц`}
              </p>
            </div>

            <button
              onClick={() => setShowPayDetails(!showPayDetails)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white font-black text-sm transition-all shadow-lg hover:brightness-110 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${plan.accent}, ${plan.accent}BB)` }}
            >
              <CreditCard size={16} />
              <span>Оплатить и получить доступ</span>
              <ChevronDown size={15} className={`transition-transform ${showPayDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Payment Methods (expandable) */}
        {showPayDetails && (
          <div className="p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Card Payment */}
              <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Перевод на карту</p>
                    <p className="text-[11px] text-slate-400">Uzcard / Humo (в сумах)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#020712] border border-blue-500/20">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Номер карты</p>
                    <p className="text-base font-black text-white font-mono tracking-widest">8600 1234 5678 9010</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#020712] border border-blue-500/20">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Сумма к оплате</p>
                    <p className="text-xl font-black text-blue-400">{formatSum(plan.totalPrice)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <p className="text-[11px] text-amber-300 font-bold flex items-start gap-1.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      После оплаты напишите скриншот чека в Telegram <a href={`https://t.me/${TG_SUPPORT}`} target="_blank" rel="noopener noreferrer" className="text-amber-200 underline">@{TG_SUPPORT}</a> — код придёт в течение нескольких минут.
                    </p>
                  </div>
                </div>
              </div>

              {/* Telegram Contact */}
              <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Связаться в Telegram</p>
                    <p className="text-[11px] text-slate-400">Помощь и другие способы</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[12px] text-slate-300 leading-relaxed">
                    По любым вопросам оплаты, активации или доступа — пишите напрямую в Telegram. Ответим быстро!
                  </p>
                  <a
                    href={`https://t.me/${TG_SUPPORT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#0088CC] text-white font-black text-sm flex items-center justify-center gap-2.5 hover:brightness-110 transition-all active:scale-95 shadow-lg"
                  >
                    <Send size={16} className="fill-white" />
                    <span>Написать @{TG_SUPPORT}</span>
                    <ExternalLink size={13} className="ml-auto opacity-80" />
                  </a>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <p className="text-[11px] text-emerald-300 font-bold flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
                      Код активации приходит в течение <b>5–10 минут</b> после подтверждения оплаты.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lock Notice */}
            <div className="p-4 rounded-2xl border border-rose-500/25 bg-rose-500/8 flex items-start gap-3">
              <Lock size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-300 leading-relaxed">
                <b className="text-rose-400">Важно:</b> При отсутствии активной подписки доступ в личный кабинет будет <b className="text-white">заблокирован</b>. Подписку можно продлить в любое время заранее — выберите более длительный тариф и сэкономьте до <b className="text-amber-300">20%</b>.
              </p>
            </div>
          </div>
        )}

        {/* Feature list */}
        <div className="px-6 sm:px-8 pb-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">Включено в подписку</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES_LIST.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-[12px] text-slate-300 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-emerald-400" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discount note */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
        <div className="flex items-center gap-2 text-[12px] text-slate-400">
          <Gift size={14} className="text-emerald-400" />
          <span><b className="text-emerald-300">10% скидка</b> при оплате на 6 месяцев</span>
        </div>
        <div className="w-px h-4 bg-white/15 hidden sm:block" />
        <div className="flex items-center gap-2 text-[12px] text-slate-400">
          <Crown size={14} className="text-amber-400" />
          <span><b className="text-amber-300">20% скидка</b> при оплате на 12 месяцев</span>
        </div>
        <div className="w-px h-4 bg-white/15 hidden sm:block" />
        <div className="flex items-center gap-2 text-[12px] text-slate-400">
          <ShieldCheck size={14} className="text-blue-400" />
          <span>Безопасный платёж — только в сумах</span>
        </div>
      </div>
    </section>
  );
}

// ─── Main Landing / Login Page ───────────────────────────────────────────────
export default function LandingLoginPage() {
  const FEATURES = [
    { icon: Activity, title: 'Умный учёт финансов', desc: 'Голос + AI аналитика', color: '#3B82F6' },
    { icon: BookOpen, title: 'Трекер книг и привычек', desc: 'Развивайтесь ежедневно', color: '#8B5CF6' },
    { icon: Target, title: 'Цели и задачи', desc: 'Фокус на важном', color: '#F59E0B' },
    { icon: Sparkles, title: 'AI-ассистент', desc: 'Ваш личный помощник', color: '#10B981' },
  ];

  const STATS = [
    { value: '+500 000 сум', label: 'AI прогноз дохода' },
    { value: '98%', label: 'Точность анализа' },
    { value: '2 мин', label: 'Экономия в день' },
    { value: '24/7', label: 'Ваш ассистент' },
  ];

  const BOTTOM_FEATURES = [
    { icon: ShieldCheck, title: 'Безопасность данных', desc: 'Шифрование банковского уровня' },
    { icon: Brain, title: 'Работает на ИИ', desc: 'Умные алгоритмы анализа' },
    { icon: Smartphone, title: 'Доступно везде', desc: 'Web, iOS, Android' },
    { icon: Headphones, title: 'Поддержка 24/7', desc: 'Мы всегда рядом' },
  ];

  return (
    <div className="min-h-screen bg-[#02050E] text-white overflow-x-hidden relative flex flex-col selection:bg-blue-600 selection:text-white">
      <style>{`
        @keyframes orbitCw {
          from { transform: rotate(-24deg) rotate(0deg); }
          to { transform: rotate(-24deg) rotate(360deg); }
        }
        @keyframes orbitCcw {
          from { transform: rotate(28deg) rotate(0deg); }
          to { transform: rotate(28deg) rotate(-360deg); }
        }
        @keyframes floatGentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-orbit-cw { animation: orbitCw 20s linear infinite; }
        .animate-orbit-ccw { animation: orbitCcw 16s linear infinite; }
        .animate-float-gentle { animation: floatGentle 6s ease-in-out infinite; }
        .hero-cyan-gradient {
          background: linear-gradient(135deg, #38BDF8 0%, #60A5FA 50%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>

      <CosmicCanvas />

      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-[100%] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(0, 102, 255, 0.45) 0%, rgba(14, 165, 233, 0.25) 30%, rgba(124, 58, 237, 0.12) 60%, transparent 80%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[700px] h-1.5 rounded-full pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.8) 30%, #ffffff 50%, rgba(56, 189, 248, 0.8) 70%, transparent 100%)', boxShadow: '0 0 45px 12px rgba(56, 189, 248, 0.9), 0 0 100px 30px rgba(0, 102, 255, 0.5)' }} />
      </div>

      {/* NAVBAR */}
      <header className="relative z-20 flex items-center justify-between px-6 lg:px-14 py-5 border-b border-white/5 backdrop-blur-md bg-[#02050E]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#38BDF8] flex items-center justify-center text-white font-black text-sm shadow-glow">7.</div>
          <span className="font-extrabold text-lg text-white tracking-tight">ZenRI</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#pricing" className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all">
            <Crown size={12} />
            Тарифы
          </a>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">Система активна</span>
          </div>
          <a href="#auth-card" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-extrabold transition-all">Войти в аккаунт</a>
        </div>
      </header>

      {/* HERO */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-6 lg:px-12 py-8 lg:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1.1fr_1fr] gap-8 lg:gap-6 items-center">

          {/* Left */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-300">
              <Sparkles size={13} className="text-blue-400" />
              <span>ZenRI Life OS — Ваша система управления жизнью</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight">
                Управляйте<br />жизнью и<br /><span className="hero-cyan-gradient">финансами</span><br />в один клик
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md pt-2">
                Голосовой ввод расходов, учёт времени,<br className="hidden sm:block" />
                ИИ-прогноз накоплений и привычек<br className="hidden sm:block" />
                в одном умном пространстве.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-w-md">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#070D1E]/80 border border-white/10 hover:border-blue-500/40 transition-all">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}20`, color: f.color }}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white leading-tight truncate">{f.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-4 gap-2 max-w-md pt-1">
              {STATS.map((s) => (
                <div key={s.label} className="space-y-0.5">
                  <p className="text-sm lg:text-base font-black text-white leading-none whitespace-nowrap">{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2">
                {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'].map((col, idx) => (
                  <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#02050E] flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ background: col }}>
                    {['А', 'М', 'Д', 'С', 'К'][idx]}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full border-2 border-[#02050E] bg-blue-900/80 flex items-center justify-center text-[9px] font-black text-blue-300">+12K</div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Нам доверяют тысячи пользователей</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-bold text-white">4.9 из 5</span>
                  <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}</div>
                </div>
              </div>
            </div>
            <a href="#pricing" className="flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-amber-200 transition-all pt-1">
              <Crown size={14} className="text-amber-400" />
              <span>Посмотреть тарифы → от 30 000 сум/мес</span>
            </a>
          </div>

          {/* Center Planet */}
          <div className="flex items-center justify-center animate-float-gentle py-4 lg:py-0">
            <CentralOrbitalGalaxy />
          </div>

          {/* Right Auth Card */}
          <div id="auth-card" className="w-full max-w-md mx-auto">
            <div className="p-7 sm:p-8 rounded-3xl border relative overflow-hidden backdrop-blur-2xl shadow-2xl space-y-5"
              style={{ background: 'rgba(7, 14, 34, 0.85)', borderColor: 'rgba(59, 130, 246, 0.3)', boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 102, 255, 0.18)' }}>
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34, 158, 217, 0.18) 0%, transparent 70%)', filter: 'blur(20px)' }} />
              <div className="flex justify-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#229ED9]/15 border border-[#229ED9]/35 text-xs font-bold text-[#54C8F0]">
                  <Send size={12} className="fill-[#54C8F0]" />
                  <span>Вход через Telegram</span>
                </div>
              </div>
              <div className="text-center space-y-1 relative z-10">
                <h2 className="text-2xl font-black text-white">Войти в ZenRI</h2>
                <p className="text-[11px] text-slate-400 font-medium">Без пароля. Без номера телефона. Просто Telegram.</p>
              </div>
              <div className="relative z-10"><InlineTelegramAuth /></div>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1 relative z-10">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Данные зашифрованы и защищены</span>
              </div>
              <div className="pt-2 border-t border-white/10 text-center relative z-10">
                <p className="text-xs text-slate-400">
                  Нет аккаунта?{' '}
                  <Link href="/register" className="text-[#38BDF8] font-extrabold hover:underline">Зарегистрироваться</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Divider with arrow */}
      <div className="relative z-10 flex flex-col items-center py-6">
        <div className="flex items-center gap-3 text-slate-600 text-xs">
          <div className="h-px w-20 bg-white/10" />
          <span className="font-bold uppercase tracking-widest">Тарифы и оплата</span>
          <div className="h-px w-20 bg-white/10" />
        </div>
        <div className="mt-2 w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        <PlusCircle size={18} className="text-slate-700" />
      </div>

      {/* PRICING SECTION */}
      <PricingSection />

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 backdrop-blur-xl bg-[#050C1F]/80">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {BOTTOM_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{f.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-14 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-600">© 2025 ZenRI. Все права защищены.</p>
          <a href={`https://t.me/${TG_SUPPORT}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-all">
            <Send size={11} className="fill-current" />
            Поддержка: @{TG_SUPPORT}
          </a>
        </div>
      </footer>
    </div>
  );
}

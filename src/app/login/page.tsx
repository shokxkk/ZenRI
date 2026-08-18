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
} from 'lucide-react';

const TG_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'zenriauthefication_bot';

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

    // Shooting stars
    interface Meteor {
      x: number;
      y: number;
      len: number;
      speed: number;
      angle: number;
      opacity: number;
      active: boolean;
    }

    const meteors: Meteor[] = Array.from({ length: 3 }, () => ({
      x: 0,
      y: 0,
      len: 0,
      speed: 0,
      angle: 0,
      opacity: 0,
      active: false,
    }));

    const triggerMeteor = (m: Meteor) => {
      m.x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
      m.y = Math.random() * canvas.height * 0.35;
      m.len = Math.random() * 140 + 70;
      m.speed = Math.random() * 7 + 6;
      m.angle = Math.PI / 5 + (Math.random() - 0.5) * 0.15; // ~36 deg
      m.opacity = 1;
      m.active = true;
    };

    // Initial triggers
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

      // 1. Twinkling Stars
      for (const s of stars) {
        const currentAlpha = s.alpha * (0.5 + 0.5 * Math.sin(time * s.pulseSpeed * 60 + s.pulseOffset));
        ctx.fillStyle = `rgba(220, 235, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Shooting Stars (Meteors)
      for (const m of meteors) {
        if (!m.active) continue;

        ctx.save();
        const startX = m.x;
        const startY = m.y;
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

        // Head flare dot
        ctx.fillStyle = `rgba(255, 255, 255, ${m.opacity})`;
        ctx.beginPath();
        ctx.arc(startX, startY, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        m.x += m.speed * Math.cos(m.angle);
        m.y += m.speed * Math.sin(m.angle);
        m.opacity -= 0.02;
        if (m.opacity <= 0) {
          m.active = false;
        }
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

// ─── 3D Glowing Galaxy Planet with Stylized "7." Logo ────────────────────────
function CentralOrbitalGalaxy() {
  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none w-[340px] h-[340px] lg:w-[460px] lg:h-[460px]">
      {/* Outer ambient radiant galaxy haze */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.25) 0%, rgba(139, 92, 246, 0.15) 45%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Orbit 1: Tilted Blue Particle Ring */}
      <div
        className="absolute rounded-full border border-sky-400/40 animate-orbit-cw"
        style={{
          width: '105%',
          height: '42%',
          transform: 'rotate(-24deg)',
          boxShadow: '0 0 25px rgba(56, 189, 248, 0.3), inset 0 0 20px rgba(56, 189, 248, 0.2)',
        }}
      >
        {/* Orbiting celestial node */}
        <div
          className="absolute -top-1.5 left-1/4 w-3.5 h-3.5 rounded-full bg-sky-300 shadow-glow"
          style={{
            boxShadow: '0 0 14px 4px rgba(56, 189, 248, 0.9), 0 0 4px #fff',
          }}
        />
      </div>

      {/* Orbit 2: Tilted Violet/Purple Nebula Ring */}
      <div
        className="absolute rounded-full border border-purple-500/40 animate-orbit-ccw"
        style={{
          width: '95%',
          height: '36%',
          transform: 'rotate(28deg)',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.35)',
        }}
      >
        {/* Orbiting purple node */}
        <div
          className="absolute -bottom-1.5 right-1/3 w-3 h-3 rounded-full bg-purple-300"
          style={{
            boxShadow: '0 0 12px 3px rgba(192, 132, 252, 0.9)',
          }}
        />
      </div>

      {/* Orbit 3: Thin cyan particle trajectory */}
      <div
        className="absolute rounded-full border border-dashed border-cyan-400/30 animate-orbit-cw"
        style={{
          width: '115%',
          height: '48%',
          transform: 'rotate(-12deg)',
          animationDuration: '28s',
        }}
      />

      {/* Center Planet Core with rich radial sphere lighting */}
      <div
        className="relative flex items-center justify-center rounded-full w-48 h-48 lg:w-60 lg:h-60"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #1e3a8a 0%, #0c1838 50%, #030712 100%)',
          boxShadow: '0 0 60px 15px rgba(0, 102, 255, 0.4), inset 0 0 40px rgba(56, 189, 248, 0.35)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}
      >
        {/* Soft core glow */}
        <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-xl" />

        {/* Precise Stylized "7." Logo Icon */}
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
            {/* The 7 shape */}
            <path
              d="M 22 24 C 22 19 26 15 31 15 L 86 15 C 91 15 95 19 93.5 24.5 L 68 82 C 65.5 87.5 59 90 53.5 87 C 48 84 46.5 77.5 49 72 L 69.5 27 L 31 27 C 26 27 22 23 22 24 Z"
              fill="url(#zenLogoGrad)"
              filter="url(#logoGlow)"
            />
            {/* The Dot */}
            <circle cx="86" cy="78" r="11" fill="url(#zenLogoGrad)" filter="url(#logoGlow)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Pure Telegram Authentication Form Component ─────────────────────────────
function InlineTelegramAuth() {
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

      const signInRes = await signIn('telegram', {
        userId: res.user.id,
        redirect: false,
      });

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

    if (val.length === 6) {
      handleVerify(val);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Step 1: Open Bot Button */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          ШАГ 1: ПОЛУЧИТЕ КОД В TELEGRAM
        </label>
        <a
          href={`https://t.me/${TG_BOT_USERNAME}?start=getcode`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0088CC] via-[#2563EB] to-[#7C3AED] hover:opacity-95 text-white font-extrabold text-xs shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95 group"
        >
          <Send size={15} className="fill-white flex-shrink-0" />
          <span className="truncate">Открыть @{TG_BOT_USERNAME} → код придёт автоматически</span>
          <ExternalLink size={13} className="opacity-80 ml-auto flex-shrink-0" />
        </a>
      </div>

      {/* Step 2: Enter 6-digit Code */}
      <div className="space-y-2">
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          ШАГ 2: ВВЕДИТЕ 6 ЦИФР ИЗ СООБЩЕНИЯ
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
            placeholder="•  •  •  •  •  •"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#081026] border border-blue-500/30 text-center text-xl font-mono font-black tracking-[0.35em] text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-600 shadow-inner"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <KeyRound size={17} />
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
            <span>Код принят! Входим в личный кабинет...</span>
          </div>
        )}

        {/* Gradient Action Button */}
        <button
          type="button"
          onClick={() => handleVerify(code)}
          disabled={loading || success || code.length !== 6}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#3B82F6] to-[#0088CC] hover:brightness-110 text-white font-black text-xs transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin text-white" />
              <span>Проверка кода...</span>
            </>
          ) : (
            <span>Подтвердить и войти в ZenRI</span>
          )}
        </button>
      </div>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
        💡 Номер телефона вводить <b>не нужно</b>. Бот выдаст код сразу при нажатии Start.
      </p>
    </div>
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
    <div className="min-h-screen bg-[#02050E] text-white overflow-x-hidden relative flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Global Dynamic Styles */}
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
        .animate-orbit-cw {
          animation: orbitCw 20s linear infinite;
        }
        .animate-orbit-ccw {
          animation: orbitCcw 16s linear infinite;
        }
        .animate-float-gentle {
          animation: floatGentle 6s ease-in-out infinite;
        }
        .hero-cyan-gradient {
          background: linear-gradient(135deg, #38BDF8 0%, #60A5FA 50%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* ─── Layer 0: Canvas with Stars & Meteors ─── */}
      <CosmicCanvas />

      {/* ─── Layer 1: Ambient Glowing Planet Horizon Arc at Bottom ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep blue atmospheric dome */}
        <div
          className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-[100%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 60%, rgba(0, 102, 255, 0.45) 0%, rgba(14, 165, 233, 0.25) 30%, rgba(124, 58, 237, 0.12) 60%, transparent 80%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Bright blue horizon line flare */}
        <div
          className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[700px] h-1.5 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.8) 30%, #ffffff 50%, rgba(56, 189, 248, 0.8) 70%, transparent 100%)',
            boxShadow: '0 0 45px 12px rgba(56, 189, 248, 0.9), 0 0 100px 30px rgba(0, 102, 255, 0.5)',
          }}
        />
      </div>

      {/* ─── NAVBAR (Clean: No extra text links, only Logo & Status) ─── */}
      <header className="relative z-20 flex items-center justify-between px-6 lg:px-14 py-5 border-b border-white/5 backdrop-blur-md bg-[#02050E]/60">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#38BDF8] flex items-center justify-center text-white font-black text-sm shadow-glow">
            7.
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight">ZenRI</span>
        </div>

        {/* Right Status Badge & Login Anchor */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">Система активна</span>
          </div>

          <a
            href="#auth-card"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-extrabold transition-all"
          >
            Войти в аккаунт
          </a>
        </div>
      </header>

      {/* ─── MAIN HERO SECTION (3 Columns: Left Info | Center Planet Logo | Right Auth Card) ─── */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-6 lg:px-12 py-8 lg:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1.1fr_1fr] gap-8 lg:gap-6 items-center">

          {/* ═══ COLUMN 1: LEFT HERO CONTENT ═══ */}
          <div className="space-y-6">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-300">
              <Sparkles size={13} className="text-blue-400" />
              <span>ZenRI Life OS — Ваша система управления жизнью</span>
            </div>

            {/* Big Headline */}
            <div className="space-y-1">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight">
                Управляйте<br />
                жизнью и<br />
                <span className="hero-cyan-gradient">финансами</span><br />
                в один клик
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md pt-2">
                Голосовой ввод расходов, учёт времени,<br className="hidden sm:block" />
                ИИ-прогноз накоплений и привычек<br className="hidden sm:block" />
                в одном умном пространстве.
              </p>
            </div>

            {/* 4 Feature Cards (2x2) */}
            <div className="grid grid-cols-2 gap-2.5 max-w-md">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#070D1E]/80 border border-white/10 hover:border-blue-500/40 transition-all"
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${f.color}20`, color: f.color }}
                    >
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

            {/* Stats Row (4 stats in sum) */}
            <div className="grid grid-cols-4 gap-2 max-w-md pt-1">
              {STATS.map((s) => (
                <div key={s.label} className="space-y-0.5">
                  <p className="text-sm lg:text-base font-black text-white leading-none whitespace-nowrap">{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Social Trust & Rating */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2">
                {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'].map((col, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full border-2 border-[#02050E] flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style={{ background: col }}
                  >
                    {['А', 'М', 'Д', 'С', 'К'][idx]}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full border-2 border-[#02050E] bg-blue-900/80 flex items-center justify-center text-[9px] font-black text-blue-300">
                  +12K
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">Нам доверяют тысячи пользователей</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-bold text-white">4.9 из 5</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom scroll hint */}
            <div className="flex items-center gap-2 text-slate-500 text-xs pt-1">
              <PlusCircle size={14} className="text-slate-600" />
              <span>Прокрутите вниз</span>
            </div>
          </div>

          {/* ═══ COLUMN 2: CENTER GALAXY LOGO ═══ */}
          <div className="flex items-center justify-center animate-float-gentle py-4 lg:py-0">
            <CentralOrbitalGalaxy />
          </div>

          {/* ═══ COLUMN 3: RIGHT AUTH CARD ═══ */}
          <div id="auth-card" className="w-full max-w-md mx-auto">
            <div
              className="p-7 sm:p-8 rounded-3xl border relative overflow-hidden backdrop-blur-2xl shadow-2xl space-y-5"
              style={{
                background: 'rgba(7, 14, 34, 0.85)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 102, 255, 0.18)',
              }}
            >
              {/* Card top radial accent */}
              <div
                className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 158, 217, 0.18) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />

              {/* Telegram Badge */}
              <div className="flex justify-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#229ED9]/15 border border-[#229ED9]/35 text-xs font-bold text-[#54C8F0]">
                  <Send size={12} className="fill-[#54C8F0]" />
                  <span>Вход через Telegram</span>
                </div>
              </div>

              {/* Card Title */}
              <div className="text-center space-y-1 relative z-10">
                <h2 className="text-2xl font-black text-white">Войти в ZenRI</h2>
                <p className="text-[11px] text-slate-400 font-medium">Без пароля. Без номера телефона. Просто Telegram.</p>
              </div>

              {/* Form Content */}
              <div className="relative z-10">
                <InlineTelegramAuth />
              </div>

              {/* Security Shield */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1 relative z-10">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Данные зашифрованы и защищены</span>
              </div>

              {/* Register link */}
              <div className="pt-2 border-t border-white/10 text-center relative z-10">
                <p className="text-xs text-slate-400">
                  Нет аккаунта?{' '}
                  <Link href="/register" className="text-[#38BDF8] font-extrabold hover:underline">
                    Зарегистрироваться
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── BOTTOM 4-FEATURE FROSTED BAR ─── */}
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
      </footer>
    </div>
  );
}

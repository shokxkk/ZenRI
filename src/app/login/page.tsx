'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TelegramCodeAuth } from '@/components/ui/TelegramCodeAuth';
import {
  Mic, BookOpen, Target, Sparkles, ShieldCheck, Brain, Smartphone, Headphones,
  ChevronDown, Star, Menu, X
} from 'lucide-react';

const TG_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'zenriauthefication_bot';

// ─── Star field canvas ────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars
    const stars: { x: number; y: number; r: number; o: number; speed: number }[] = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        o: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.3 + 0.05,
      });
    }

    // Shooting stars
    const shoots: { x: number; y: number; len: number; speed: number; opacity: number; angle: number; active: boolean }[] = [];
    for (let i = 0; i < 4; i++) {
      shoots.push({ x: 0, y: 0, len: 0, speed: 0, opacity: 0, angle: 0, active: false });
    }
    const launchShoot = (s: typeof shoots[0]) => {
      s.x = Math.random() * canvas.width * 0.7 + 100;
      s.y = Math.random() * canvas.height * 0.4;
      s.len = Math.random() * 120 + 60;
      s.speed = Math.random() * 8 + 6;
      s.opacity = 1;
      s.angle = Math.PI / 5 + (Math.random() - 0.5) * 0.3;
      s.active = true;
    };
    shoots.forEach((s) => { setTimeout(() => launchShoot(s), Math.random() * 4000); });
    setInterval(() => {
      shoots.forEach((s) => { if (!s.active && Math.random() < 0.15) launchShoot(s); });
    }, 800);

    let animFrame: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars with twinkle
      stars.forEach((s) => {
        s.o = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(Date.now() * s.speed * 0.002 + s.x));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${s.o})`;
        ctx.fill();
      });

      // Draw shooting stars
      shoots.forEach((s) => {
        if (!s.active) return;
        ctx.save();
        ctx.globalAlpha = s.opacity;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len * Math.cos(s.angle), s.y - s.len * Math.sin(s.angle));
        grad.addColorStop(0, 'rgba(150,200,255,1)');
        grad.addColorStop(1, 'rgba(150,200,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.len * Math.cos(s.angle), s.y - s.len * Math.sin(s.angle));
        ctx.stroke();
        ctx.restore();
        s.x += s.speed * Math.cos(s.angle);
        s.y += s.speed * Math.sin(s.angle);
        s.opacity -= 0.025;
        if (s.opacity <= 0) s.active = false;
      });

      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Orbital Logo ─────────────────────────────────────────────────────────────
function OrbitalLogo() {
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: 480, height: 480 }}>
      {/* Outer glow planet haze */}
      <div className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(0,102,255,0.35) 0%, transparent 70%)' }} />

      {/* Orbit rings */}
      {[{ w: 380, h: 110, top: '52%', rot: -25, dur: '18s', opacity: 0.25 },
        { w: 440, h: 130, top: '54%', rot: -20, dur: '26s', opacity: 0.15 },
        { w: 320, h: 90, top: '50%', rot: -28, dur: '12s', opacity: 0.18 },
      ].map((ring, i) => (
        <div key={i} className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400 pointer-events-none animate-spin-slow"
          style={{
            width: ring.w, height: ring.h,
            top: ring.top,
            transform: `translateX(-50%) translateY(-50%) rotateX(${ring.rot}deg)`,
            borderColor: `rgba(96,165,250,${ring.opacity})`,
            animationDuration: ring.dur,
            perspective: '800px',
          }}
        />
      ))}

      {/* Planet surface glow at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 h-16 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,80,255,0.55) 0%, transparent 80%)', filter: 'blur(18px)' }} />

      {/* Core glow sphere */}
      <div className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 38% 38%, rgba(80,160,255,0.18) 0%, rgba(0,40,120,0.35) 60%, rgba(0,0,30,0.5) 100%)',
          boxShadow: '0 0 80px 20px rgba(0,80,255,0.25), 0 0 160px 40px rgba(0,40,200,0.12)',
        }}
      />

      {/* Logo Text */}
      <div className="relative z-10 flex flex-col items-center" style={{ filter: 'drop-shadow(0 0 32px rgba(60,140,255,0.9))' }}>
        <span className="text-[90px] font-black leading-none tracking-tight text-white" style={{
          background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 40%, #1D4ED8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textShadow: 'none',
        }}>
          7.
        </span>
      </div>

      {/* Orbiting dot 1 */}
      <div className="absolute pointer-events-none animate-orbit-1"
        style={{ width: 380, height: 110, top: '52%', left: '50%', transform: 'translate(-50%, -50%) rotateX(-25deg)', transformStyle: 'preserve-3d' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-400 shadow-lg" style={{ boxShadow: '0 0 12px 4px rgba(96,165,250,0.8)' }} />
      </div>
      {/* Orbiting dot 2 */}
      <div className="absolute pointer-events-none animate-orbit-2"
        style={{ width: 320, height: 90, top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotateX(-28deg)', transformStyle: 'preserve-3d' }}>
        <div className="absolute bottom-0 right-1/4 w-2 h-2 rounded-full bg-cyan-300" style={{ boxShadow: '0 0 8px 3px rgba(103,232,249,0.8)' }} />
      </div>
    </div>
  );
}

// ─── Main Login / Landing Page ───────────────────────────────────────────────
export default function LoginPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = ['Возможности', 'Тарифы', 'О нас', 'Блог', 'Контакты'];

  const FEATURES = [
    { icon: Mic, title: 'Умный учёт финансов', desc: 'Голос + AI аналитика', color: '#3B82F6' },
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

  const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
  ];

  return (
    <div className="min-h-screen bg-[#030812] text-white overflow-x-hidden">
      {/* ─── Animated global styles ─── */}
      <style>{`
        @keyframes spin-slow { to { transform: translateX(-50%) translateY(-50%) rotateX(-25deg) rotate(360deg); } }
        @keyframes orbit-1 { to { transform: translate(-50%, -50%) rotateX(-25deg) rotate(360deg); } }
        @keyframes orbit-2 { to { transform: translate(-50%, -50%) rotateX(-28deg) rotate(-360deg); } }
        @keyframes float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-18px); } }
        @keyframes glow-pulse { 0%,100%{ opacity:0.6; } 50%{ opacity:1; } }
        @keyframes gradient-shift { 0%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } 100%{ background-position:0% 50%; } }
        @keyframes fadeInUp { from{ opacity:0; transform:translateY(30px); } to{ opacity:1; transform:translateY(0); } }
        .animate-spin-slow { animation: spin-slow 18s linear infinite; }
        .animate-orbit-1 { animation: orbit-1 14s linear infinite; }
        .animate-orbit-2 { animation: orbit-2 10s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow { animation: glow-pulse 3s ease-in-out infinite; }
        .animate-fadein-up { animation: fadeInUp 0.7s ease-out forwards; }
        .hero-text-gradient {
          background: linear-gradient(135deg, #60A5FA, #3B82F6, #8B5CF6);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 4s ease infinite;
        }
        .glass-card {
          background: rgba(10,20,50,0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .btn-glow:hover { box-shadow: 0 0 30px rgba(59,130,246,0.5); }
      `}</style>

      {/* ─── BACKGROUND GLOWS ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[10%] w-[600px] h-[600px] rounded-full animate-glow"
          style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.22) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full animate-glow"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(70px)', animationDelay: '1.5s' }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(0,60,200,0.3) 0%, transparent 80%)', filter: 'blur(80px)' }} />
        <StarField />
      </div>

      {/* ─── NAVBAR ─── */}
      <nav className="relative z-30 flex items-center justify-between px-6 lg:px-12 py-4 border-b border-white/8 glass-card sticky top-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-lg text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
            7.
          </div>
          <span className="font-black text-lg text-white tracking-tight">ZenRI</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
              {link}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">Система активна</span>
          </div>
          <a href="#login-form"
            className="px-5 py-2 rounded-xl bg-white text-slate-900 font-extrabold text-sm hover:bg-slate-100 transition-colors btn-glow">
            Войти в аккаунт
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="relative z-20 md:hidden glass-card border-b border-white/10 px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="block text-sm text-slate-300 hover:text-white py-1.5 font-medium">{link}</a>
          ))}
          <a href="#login-form" className="block w-full text-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm mt-2">
            Войти в аккаунт
          </a>
        </div>
      )}

      {/* ─── HERO SECTION ─── */}
      <section className="relative z-10 min-h-[calc(100vh-68px)] flex items-center">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-12 grid lg:grid-cols-[1fr_520px_380px] gap-8 xl:gap-12 items-center">

          {/* LEFT — Hero Text + Features */}
          <div className="space-y-8 animate-fadein-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold"
              style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.35)', color: '#93C5FD' }}>
              <Sparkles size={13} />
              ZenRI Life OS — Ваша система управления жизнью
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
                Управляйте<br />жизнью и<br />
                <span className="hero-text-gradient">финансами</span><br />
                в один клик
              </h1>
              <p className="text-slate-400 text-base leading-relaxed max-w-sm pt-2">
                Голосовой ввод расходов, учёт времени,<br />
                ИИ-прогноз накоплений и привычек<br />
                в одном умном пространстве.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-white/8 hover:border-blue-500/30 transition-all group cursor-default"
                    style={{ background: 'rgba(10,20,50,0.6)' }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${f.color}22`, color: f.color }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{f.title}</p>
                      <p className="text-[10px] text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 max-w-sm pt-2">
              {STATS.map((s) => (
                <div key={s.value} className="space-y-0.5">
                  <p className="text-lg font-black text-white leading-none">{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2.5">
                {AVATARS.map((src, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#030812] overflow-hidden bg-blue-900 flex items-center justify-center text-xs font-bold">
                    <span>{['А','М','Д','С','К'][i]}</span>
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-[#030812] bg-blue-900/60 flex items-center justify-center text-[9px] font-black text-blue-300">
                  +12K
                </div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Нам доверяют тысячи пользователей</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-xs font-bold text-white">4.9 из 5</p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll hint */}
            <div className="flex items-center gap-2 text-slate-500 text-xs pt-2">
              <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center animate-bounce">
                <ChevronDown size={12} />
              </div>
              <span>Прокрутите вниз</span>
            </div>
          </div>

          {/* CENTER — Orbital Logo */}
          <div className="hidden lg:flex items-center justify-center animate-float" style={{ animationDuration: '7s' }}>
            <OrbitalLogo />
          </div>

          {/* RIGHT — Login Card */}
          <div id="login-form" className="animate-fadein-up" style={{ animationDelay: '0.2s' }}>
            <div className="p-7 rounded-3xl border relative overflow-hidden"
              style={{
                background: 'rgba(8,16,42,0.88)',
                backdropFilter: 'blur(24px)',
                borderColor: 'rgba(255,255,255,0.12)',
                boxShadow: '0 30px 80px -10px rgba(0,0,0,0.7), 0 0 60px rgba(59,130,246,0.12)',
              }}>
              {/* Card inner glow */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(34,158,217,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }} />

              {/* Telegram badge */}
              <div className="flex justify-center mb-5 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(34,158,217,0.15)', border: '1px solid rgba(34,158,217,0.35)', color: '#54C8F0' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Вход через Telegram
                </div>
              </div>

              <div className="text-center mb-6 relative z-10">
                <h2 className="text-xl font-black text-white">Войти в ZenRI</h2>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Без пароля. Без номера телефона. Просто Telegram.</p>
              </div>

              <div className="relative z-10">
                <TelegramCodeAuth botUsername={TG_BOT_USERNAME} onSuccess={() => {}} />
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-500 relative z-10">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Данные зашифрованы и защищены</span>
              </div>

              <div className="border-t border-white/8 mt-5 pt-4 text-center relative z-10">
                <p className="text-xs text-slate-400">
                  Нет аккаунта?{' '}
                  <Link href="/register" className="font-extrabold text-[#54C8F0] hover:underline">
                    Зарегистрироваться
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM FEATURE BAR ─── */}
      <div className="relative z-10 border-t border-white/8 glass-card">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {BOTTOM_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{f.title}</p>
                  <p className="text-[10px] text-slate-400">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

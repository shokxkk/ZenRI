'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { registerUser } from '@/app/actions/authActions';
import { signIn } from 'next-auth/react';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    const res = await registerUser({ name, email, password, confirmPassword });
    if (!res.success) {
      setError(res.error || 'Ошибка при регистрации');
      setLoading(false);
    } else {
      const signRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signRes?.error) {
        window.location.href = '/login';
      } else {
        window.location.href = '/dashboard';
      }
    }
  };

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

      {/* Main Grid */}
      <main className="relative z-20 flex-1 max-w-4xl w-full mx-auto px-6 py-8 lg:py-12 flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-black text-white">Регистрация в ZenRI</h1>
            <p className="text-xs text-slate-400">Создайте личное пространство управления жизнью и финансами</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Ваше имя *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#0066FF] transition-all"
                placeholder="Шохжахон"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#0066FF] transition-all"
                placeholder="name@example.com"
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
                  className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#0066FF] transition-all"
                  placeholder="Мин. 6 символов"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Подтверждение пароля *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#0066FF] transition-all"
                placeholder="Повторите пароль"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-xs transition-all shadow-glow active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="pt-2 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-[#00C2FF] font-extrabold hover:underline">
                Войти
              </Link>
            </p>
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

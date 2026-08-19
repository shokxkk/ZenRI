'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Send,
  Mail,
  Search,
  RefreshCw,
  ArrowLeft,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Layers,
  Copy,
  Check,
  KeyRound,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  getAdminStatsAction,
  getAdminUsersListAction,
  blockUserAction,
  unblockUserAction,
  deleteUserAction,
  toggleUserRoleAction,
  verifyAdminPasscodeAction,
} from '@/app/actions/adminActions';
import { soundFx } from '@/lib/soundEffects';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  telegramUsers: number;
  emailUsers: number;
  todayUsers: number;
  weekUsers: number;
  totalTransactions: number;
  totalTasks: number;
  totalAccounts: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  authProvider: string;
  role: string;
  isBlocked: boolean;
  blockReason: string | null;
  blockedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: {
    accounts: number;
    transactions: number;
    tasks: number;
    habits: number;
    debts: number;
  };
}

interface AdminClientProps {
  initialStats: AdminStats | null;
  initialUsers: AdminUser[];
  currentUserId: string;
  currentUserRole: string;
  isAuthorized: boolean;
}

export function AdminClient({
  initialStats,
  initialUsers,
  currentUserId,
  currentUserRole,
  isAuthorized: initialIsAuthorized,
}: AdminClientProps) {
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<AdminStats | null>(initialStats);
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isAuthorized, setIsAuthorized] = useState(initialIsAuthorized || currentUserRole === 'ADMIN');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TELEGRAM' | 'EMAIL' | 'ACTIVE' | 'BLOCKED' | 'ADMIN'>('ALL');

  // Modals & Action States
  const [blockModalUser, setBlockModalUser] = useState<AdminUser | null>(null);
  const [blockReason, setBlockReason] = useState('Подозрение на бота / Неавторизованная активность');
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUser | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Passcode gate state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);

  // Toast / Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Refresh data
  const handleRefresh = () => {
    soundFx.playSync();
    startTransition(async () => {
      const [statsRes, usersRes] = await Promise.all([
        getAdminStatsAction(),
        getAdminUsersListAction(searchQuery, activeFilter),
      ]);
      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (usersRes.success && usersRes.users) setUsers(usersRes.users as unknown as AdminUser[]);
      showToast('Данные успешно обновлены ✓');
    });
  };

  // Trigger search / filter changes
  useEffect(() => {
    if (!isAuthorized) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await getAdminUsersListAction(searchQuery, activeFilter);
        if (res.success && res.users) {
          setUsers(res.users as unknown as AdminUser[]);
        }
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, isAuthorized]);

  // Handle Passcode Unlock
  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    setIsVerifyingPasscode(true);
    setPasscodeError('');

    try {
      const res = await verifyAdminPasscodeAction(passcodeInput.trim());
      if (res.success) {
        soundFx.playIncomeSound();
        setIsAuthorized(true);
        // Load initial data
        const [statsRes, usersRes] = await Promise.all([
          getAdminStatsAction(),
          getAdminUsersListAction(),
        ]);
        if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
        if (usersRes.success && usersRes.users) setUsers(usersRes.users as unknown as AdminUser[]);
      } else {
        soundFx.playError();
        setPasscodeError(res.error || 'Неверный код доступа');
      }
    } catch {
      setPasscodeError('Ошибка проверки кода');
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  // Handle Block User
  const handleConfirmBlock = () => {
    if (!blockModalUser) return;
    startTransition(async () => {
      soundFx.playClick();
      const res = await blockUserAction({ userId: blockModalUser.id, reason: blockReason });
      if (res.success) {
        soundFx.playToggleOff();
        showToast(`Доступ для ${blockModalUser.name} приостановлен`);
        setBlockModalUser(null);
        setBlockReason('Подозрение на бота / Неавторизованная активность');
        // Update local list
        setUsers((prev) =>
          prev.map((u) =>
            u.id === blockModalUser.id
              ? { ...u, isBlocked: true, blockReason: blockReason, blockedAt: new Date().toISOString() }
              : u
          )
        );
        if (stats) {
          setStats({
            ...stats,
            activeUsers: Math.max(0, stats.activeUsers - 1),
            blockedUsers: stats.blockedUsers + 1,
          });
        }
      } else {
        soundFx.playError();
        showToast(res.error || 'Ошибка при блокировке');
      }
    });
  };

  // Handle Unblock User
  const handleUnblock = (user: AdminUser) => {
    startTransition(async () => {
      soundFx.playClick();
      const res = await unblockUserAction(user.id);
      if (res.success) {
        soundFx.playIncomeSound();
        showToast(`Доступ для ${user.name} восстановлен ✓`);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isBlocked: false, blockReason: null, blockedAt: null } : u))
        );
        if (stats) {
          setStats({
            ...stats,
            activeUsers: stats.activeUsers + 1,
            blockedUsers: Math.max(0, stats.blockedUsers - 1),
          });
        }
      } else {
        soundFx.playError();
        showToast(res.error || 'Ошибка при разблокировке');
      }
    });
  };

  // Handle Delete User
  const handleConfirmDelete = () => {
    if (!deleteModalUser) return;
    startTransition(async () => {
      soundFx.playClick();
      const res = await deleteUserAction(deleteModalUser.id);
      if (res.success) {
        soundFx.playToggleOff();
        showToast(`Пользователь ${deleteModalUser.name} удалён`);
        setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
        setDeleteModalUser(null);
        if (stats) {
          setStats({
            ...stats,
            totalUsers: Math.max(0, stats.totalUsers - 1),
            activeUsers: deleteModalUser.isBlocked ? stats.activeUsers : Math.max(0, stats.activeUsers - 1),
            blockedUsers: deleteModalUser.isBlocked ? Math.max(0, stats.blockedUsers - 1) : stats.blockedUsers,
          });
        }
      } else {
        soundFx.playError();
        showToast(res.error || 'Ошибка при удалении');
      }
    });
  };

  // Handle Toggle Role
  const handleToggleRole = (user: AdminUser) => {
    startTransition(async () => {
      soundFx.playClick();
      const res = await toggleUserRoleAction(user.id);
      if (res.success && res.newRole) {
        soundFx.playIncomeSound();
        showToast(`Роль ${user.name} изменена на ${res.newRole}`);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: res.newRole } : u)));
      } else {
        soundFx.playError();
        showToast(res.error || 'Ошибка изменения роли');
      }
    });
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    soundFx.playCopy();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered counts
  const filterCounts = useMemo(() => {
    return {
      ALL: users.length,
      TELEGRAM: users.filter((u) => u.authProvider === 'telegram').length,
      EMAIL: users.filter((u) => u.authProvider === 'email').length,
      ACTIVE: users.filter((u) => !u.isBlocked).length,
      BLOCKED: users.filter((u) => u.isBlocked).length,
      ADMIN: users.filter((u) => u.role === 'ADMIN').length,
    };
  }, [users]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSCODE GATE SCREEN (IF NOT AUTHORIZED)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isAuthorized) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#8B5CF6] text-white flex items-center justify-center mx-auto shadow-glow">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-zen-900 dark:text-zen-100 tracking-tight">
              Панель управления ZenRI
            </h1>
            <p className="text-xs text-zen-400">
              Этот раздел доступен только для владельца и администратора приложения.
            </p>
          </div>

          <form onSubmit={handleUnlockAdmin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#0066FF]" />
                Мастер-код администратора
              </label>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setPasscodeError('');
                }}
                placeholder="Введите мастер-пароль..."
                className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF] min-h-[48px]"
                autoFocus
              />
              {passcodeError && (
                <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={13} /> {passcodeError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifyingPasscode || !passcodeInput.trim()}
              className="w-full py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-black shadow-glow transition-all active:scale-95 disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
            >
              {isVerifyingPasscode ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              <span>Войти в панель администратора</span>
            </button>
          </form>

          <div className="pt-2 border-t border-zen-100 dark:border-zen-800/60 flex items-center justify-between text-xs text-zen-400">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 hover:text-[#0066FF] transition-colors"
            >
              <ArrowLeft size={14} /> На главную
            </Link>
            <span>ZenRI Admin v1.0</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN ADMIN DASHBOARD UI
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 px-2 sm:px-4 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl bg-zen-900 text-white text-xs font-bold shadow-2xl border border-zen-700 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Top Header Navigation Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-2xl bg-white dark:bg-[#131C2E] hover:bg-zen-100 dark:hover:bg-zen-800 text-zen-800 dark:text-zen-100 border border-zen-200 dark:border-zen-800 shadow-sm active:scale-95 transition-all group"
            title="Вернуться в приложение"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform text-[#0066FF]" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-zen-900 dark:text-zen-100 tracking-tight">
                Центр управления пользователями
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30 text-[10px] font-black uppercase flex items-center gap-1">
                <Crown size={11} /> Admin Root
              </span>
            </div>
            <p className="text-xs text-zen-400">
              Мониторинг регистраций, защита от ботов и управление доступом
            </p>
          </div>
        </div>

        {/* Live Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#131C2E] hover:bg-zen-100 dark:hover:bg-zen-800 border border-zen-200 dark:border-zen-800 text-zen-800 dark:text-zen-100 text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isPending ? 'animate-spin text-[#0066FF]' : 'text-[#0066FF]'} />
            <span>{isPending ? 'Обновление...' : 'Обновить'}</span>
          </button>
        </div>
      </div>

      {/* ─── Metric Cards Grid ─── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Всего пользователей */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zen-400 uppercase tracking-wider">Всего в базе</span>
              <div className="w-8 h-8 rounded-xl bg-[#0066FF]/15 text-[#0066FF] flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-zen-900 dark:text-zen-100 font-mono">
              {stats.totalUsers.toLocaleString('ru-RU')}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold">
              <span>+{stats.todayUsers} сегодня</span>
              <span className="text-zen-300">•</span>
              <span className="text-zen-400">+{stats.weekUsers} за 7 дней</span>
            </div>
          </div>

          {/* Card 2: Активные пользователи */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zen-400 uppercase tracking-wider">Активные</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <UserCheck size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">
              {stats.activeUsers.toLocaleString('ru-RU')}
            </p>
            <p className="text-[11px] text-zen-400">Имеют полный доступ</p>
          </div>

          {/* Card 3: Заблокированные / Боты */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zen-400 uppercase tracking-wider">Заблокированы</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <UserX size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-rose-500 font-mono">
              {stats.blockedUsers.toLocaleString('ru-RU')}
            </p>
            <p className="text-[11px] text-zen-400">Вход перекрыт</p>
          </div>

          {/* Card 4: Telegram vs Email */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zen-400 uppercase tracking-wider">Каналы входа</span>
              <div className="w-8 h-8 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
                <Send size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-xl sm:text-2xl font-black text-[#229ED9]">{stats.telegramUsers} TG</span>
              <span className="text-xs text-zen-300">/</span>
              <span className="text-base sm:text-lg font-bold text-zen-600 dark:text-zen-400">{stats.emailUsers} Email</span>
            </div>
            <p className="text-[11px] text-zen-400">
              {stats.totalUsers > 0
                ? `${Math.round((stats.telegramUsers / stats.totalUsers) * 100)}% через Telegram`
                : '—'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-3xl p-4 sm:p-5 shadow-apple space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zen-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, email, @username или Telegram ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-xs sm:text-sm font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF] min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zen-400 hover:text-zen-700 dark:hover:text-zen-200"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {(
              [
                { key: 'ALL', label: 'Все', count: filterCounts.ALL },
                { key: 'TELEGRAM', label: '📱 Telegram', count: filterCounts.TELEGRAM },
                { key: 'EMAIL', label: '✉️ Email', count: filterCounts.EMAIL },
                { key: 'ACTIVE', label: '🟢 Активные', count: filterCounts.ACTIVE },
                { key: 'BLOCKED', label: '🚫 Заблокированные', count: filterCounts.BLOCKED },
                { key: 'ADMIN', label: '👑 Админы', count: filterCounts.ADMIN },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  soundFx.playClick();
                  setActiveFilter(f.key);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                  activeFilter === f.key
                    ? 'bg-[#0066FF] text-white shadow-glow'
                    : 'bg-zen-100 dark:bg-zen-800 text-zen-600 dark:text-zen-300 hover:bg-zen-200 dark:hover:bg-zen-700'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-zen-200 dark:bg-zen-700 text-zen-600 dark:text-zen-400'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Users List / Table ─── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-zen-400 px-1">
            <span>
              Найдено пользователей: <strong className="text-zen-900 dark:text-zen-100 font-mono">{users.length}</strong>
            </span>
            <span className="text-[11px] hidden sm:inline">Сортировка: по дате регистрации (сначала новые)</span>
          </div>

          {users.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zen-100 dark:bg-zen-800 flex items-center justify-center mx-auto text-zen-400">
                <Users size={24} />
              </div>
              <p className="text-sm font-bold text-zen-900 dark:text-zen-100">Пользователи не найдены</p>
              <p className="text-xs text-zen-400">Попробуйте изменить запрос поиска или выбранный фильтр</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const formattedDate = new Date(user.createdAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={user.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      user.isBlocked
                        ? 'bg-rose-500/5 dark:bg-rose-950/15 border-rose-300 dark:border-rose-900/60'
                        : 'bg-zen-50/60 dark:bg-[#0c1424] border-zen-200 dark:border-zen-800/80 hover:border-[#0066FF]/40'
                    }`}
                  >
                    {/* Left: User Identity & Avatar */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-zen-200 dark:ring-zen-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#8B5CF6] text-white flex items-center justify-center font-black text-base shadow-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {user.isBlocked && (
                          <div
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shadow"
                            title="Пользователь заблокирован"
                          >
                            ✕
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold text-zen-900 dark:text-zen-100 truncate">
                            {user.name}
                          </p>

                          {/* Role Badge */}
                          {user.role === 'ADMIN' && (
                            <span className="px-2 py-0.2 rounded-full bg-[#0066FF]/15 text-[#0066FF] text-[10px] font-black uppercase flex items-center gap-0.5">
                              <Crown size={10} /> Admin
                            </span>
                          )}

                          {/* Status Badge */}
                          {user.isBlocked ? (
                            <span className="px-2 py-0.2 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[10px] font-black uppercase">
                              🚫 Доступ закрыт
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-black uppercase">
                              🟢 Активен
                            </span>
                          )}

                          {isSelf && (
                            <span className="text-[10px] font-bold text-zen-400 bg-zen-200 dark:bg-zen-800 px-1.5 py-0.2 rounded-md">
                              (Вы)
                            </span>
                          )}
                        </div>

                        {/* Email + Telegram Details */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-zen-500 dark:text-zen-400">
                          {/* Real/Synthetic Email */}
                          <span className="truncate max-w-[220px]" title={user.email}>
                            {user.email}
                          </span>

                          {/* Telegram Username direct contact button */}
                          {user.telegramUsername ? (
                            <a
                              href={`https://t.me/${user.telegramUsername.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] font-black text-xs transition-all active:scale-95 shadow-sm"
                              title="Открыть чат в Telegram"
                            >
                              <Send size={11} />
                              <span>@{user.telegramUsername.replace('@', '')}</span>
                              <ExternalLink size={10} />
                            </a>
                          ) : user.telegramId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zen-200/60 dark:bg-zen-800 text-[11px] font-mono">
                              TG ID: {user.telegramId}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zen-400">
                              <Mail size={11} /> Вход по паролю
                            </span>
                          )}
                        </div>

                        {/* Block Reason Note if blocked */}
                        {user.isBlocked && user.blockReason && (
                          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-medium flex items-center gap-1.5">
                            <AlertTriangle size={12} className="flex-shrink-0" />
                            <span>Причина: {user.blockReason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: User Activity Stats & Registration Time */}
                    <div className="flex items-center gap-4 text-xs text-zen-400 sm:self-center">
                      {/* Activity metrics */}
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span title="Счетов" className="px-2 py-1 rounded-lg bg-zen-100 dark:bg-zen-800 text-zen-700 dark:text-zen-300">
                          💳 {user._count.accounts}
                        </span>
                        <span title="Транзакций" className="px-2 py-1 rounded-lg bg-zen-100 dark:bg-zen-800 text-zen-700 dark:text-zen-300">
                          📊 {user._count.transactions}
                        </span>
                        <span title="Задач" className="px-2 py-1 rounded-lg bg-zen-100 dark:bg-zen-800 text-zen-700 dark:text-zen-300">
                          ✓ {user._count.tasks}
                        </span>
                      </div>

                      {/* Reg Date */}
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-zen-400 uppercase font-bold">Регистрация</p>
                        <p className="text-xs font-bold text-zen-700 dark:text-zen-300 font-mono">{formattedDate}</p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zen-100 dark:border-zen-800/60">
                      {/* 1. Direct Telegram Contact Button */}
                      {user.telegramUsername && (
                        <a
                          href={`https://t.me/${user.telegramUsername.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                          title="Написать в Telegram"
                        >
                          <Send size={14} />
                          <span className="hidden md:inline">Написать</span>
                        </a>
                      )}

                      {/* 2. Block / Unblock Button */}
                      {user.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(user)}
                          disabled={isPending}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5 min-h-[38px]"
                          title="Восстановить доступ"
                        >
                          <Unlock size={14} />
                          <span>Восстановить доступ</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setBlockModalUser(user)}
                          disabled={isPending || isSelf}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 min-h-[38px] ${
                            isSelf
                              ? 'opacity-30 cursor-not-allowed bg-zen-200 dark:bg-zen-800 text-zen-400'
                              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30'
                          }`}
                          title={isSelf ? 'Нельзя заблокировать себя' : 'Перекрыть доступ пользователю'}
                        >
                          <Lock size={14} />
                          <span>Заблокировать</span>
                        </button>
                      )}

                      {/* 3. Toggle Role Button */}
                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={isPending || isSelf}
                        className={`p-2 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[38px] ${
                          user.role === 'ADMIN'
                            ? 'bg-[#0066FF]/15 text-[#0066FF] hover:bg-[#0066FF]/25'
                            : 'bg-zen-100 dark:bg-zen-800 text-zen-400 hover:text-zen-700 dark:hover:text-zen-200'
                        }`}
                        title={user.role === 'ADMIN' ? 'Снять права администратора' : 'Сделать администратором'}
                      >
                        <Crown size={15} />
                      </button>

                      {/* 4. Delete User Button */}
                      <button
                        onClick={() => setDeleteModalUser(user)}
                        disabled={isPending || isSelf}
                        className={`p-2 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[38px] ${
                          isSelf
                            ? 'opacity-30 cursor-not-allowed text-zen-400'
                            : 'text-zen-400 hover:text-rose-500 hover:bg-rose-500/10'
                        }`}
                        title={isSelf ? 'Нельзя удалить свой аккаунт' : 'Удалить аккаунт навсегда'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: BLOCK USER CONFIRMATION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {blockModalUser && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setBlockModalUser(null)}
        >
          <div
            className="bg-white dark:bg-[#131C2E] rounded-3xl p-6 w-full max-w-md border border-zen-200 dark:border-zen-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-zen-900 dark:text-zen-100">
                  Приостановить доступ пользователю
                </h3>
                <p className="text-xs text-zen-400">Пользователь больше не сможет войти в систему</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zen-50 dark:bg-zen-800/60 border border-zen-200/60 dark:border-zen-700 text-xs space-y-1">
              <p className="font-bold text-zen-900 dark:text-zen-100">{blockModalUser.name}</p>
              <p className="text-zen-400 truncate">{blockModalUser.email}</p>
              {blockModalUser.telegramUsername && (
                <p className="text-[#229ED9] font-bold">@{blockModalUser.telegramUsername}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300">
                Причина блокировки:
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Укажите причину..."
                className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-rose-500"
              />

              {/* Quick Reason Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[
                  'Подозрение на бота / Спам',
                  'Подозрительная активность',
                  'Нарушение правил сервиса',
                  'По просьбе пользователя',
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setBlockReason(preset)}
                    className="px-2.5 py-1 rounded-lg bg-zen-100 dark:bg-zen-800 hover:bg-zen-200 dark:hover:bg-zen-700 text-[11px] font-medium text-zen-600 dark:text-zen-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBlockModalUser(null)}
                className="flex-1 py-3 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-zen-200 text-xs font-bold text-zen-700 dark:text-zen-300 transition-colors min-h-[44px]"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmBlock}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {isPending ? 'Блокировка...' : 'Да, заблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: DELETE USER CONFIRMATION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {deleteModalUser && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setDeleteModalUser(null)}
        >
          <div
            className="bg-white dark:bg-[#131C2E] rounded-3xl p-6 w-full max-w-md border border-zen-200 dark:border-zen-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-zen-900 dark:text-zen-100">
                  Удалить аккаунт навсегда?
                </h3>
                <p className="text-xs text-zen-400">Это действие удалит все данные без возможности восстановления</p>
              </div>
            </div>

            <p className="text-xs text-zen-500 dark:text-zen-400">
              Вы собираетесь полностью удалить пользователя <strong className="text-zen-900 dark:text-zen-100">{deleteModalUser.name}</strong> ({deleteModalUser.email}).
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalUser(null)}
                className="flex-1 py-3 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-zen-200 text-xs font-bold text-zen-700 dark:text-zen-300 transition-colors min-h-[44px]"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {isPending ? 'Удаление...' : 'Да, удалить навсегда'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

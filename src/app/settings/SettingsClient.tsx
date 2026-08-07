'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  User, Mail, Globe, Plus, LogOut, ChevronRight, Palette, Key,
  ShieldCheck, Eye, EyeOff, AlertTriangle, RotateCcw, CheckCircle2, Sparkles, Database
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { updateUserProfile, createCategory, resetAllUserData, seedDemoDataAction } from '@/app/actions/analyticsActions';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type Category = { id: string; name: string; type: string; color: string | null; icon: string };

interface SettingsClientProps {
  user: { id: string; name: string; email: string; defaultCurrency: string };
  categories: Category[];
}

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];
const COLORS = ['#0066FF', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#00C2FF', '#EC4899', '#06B6D4', '#84CC16', '#71717A'];

export function SettingsClient({ user, categories }: SettingsClientProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();

  const [showProfile, setShowProfile] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);

  // Reset Data Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmResetInput, setConfirmResetInput] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Profile form
  const [name, setName] = useState(user.name);
  const [currency, setCurrency] = useState(user.defaultCurrency);

  // Custom ChatGPT API Key State
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('zenri_custom_openai_key');
    if (storedKey) setCustomApiKey(storedKey);
  }, []);

  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('zenri_custom_openai_key', customApiKey.trim());
    } else {
      localStorage.removeItem('zenri_custom_openai_key');
    }
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 2500);
  };

  // Category form
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [catColor, setCatColor] = useState('#EF4444');

  const handleSaveProfile = () => {
    startTransition(async () => {
      await updateUserProfile({ name, defaultCurrency: currency });
      await updateSession({ name });
      setShowProfile(false);
      router.refresh();
    });
  };

  const handleCreateCategory = () => {
    if (!catName.trim()) return;
    startTransition(async () => {
      await createCategory({ name: catName, type: catType, color: catColor });
      setCatName(''); setCatType('EXPENSE'); setCatColor('#EF4444');
      setShowNewCat(false);
      router.refresh();
    });
  };

  const handleResetAllData = () => {
    if (confirmResetInput.trim().toUpperCase() !== 'СБРОС') return;
    startTransition(async () => {
      localStorage.setItem('zenri_utility_bills', '[]');
      localStorage.setItem('zenri_wishlist_items', '[]');
      await resetAllUserData();
      setResetSuccess(true);
      setConfirmResetInput('');
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess(false);
        window.location.href = '/dashboard';
      }, 1500);
    });
  };

  const handleSeedDemoData = () => {
    startTransition(async () => {
      const demoUtilities = [
        { id: '1', name: 'Электричество (РЭС)', type: 'ELECTRICITY', accountNumber: 'Л/С 20491823', balance: -140000, dueDate: 'до 10-го числа', iconName: 'Zap' },
        { id: '2', name: 'Природный газ (Райгаз)', type: 'GAS', accountNumber: 'Л/С 84920482', balance: 45000, dueDate: 'до 15-го числа', iconName: 'Flame' },
        { id: '3', name: 'Водоканал (Сувсоз)', type: 'WATER', accountNumber: 'Л/С 1029485', balance: -65000, dueDate: 'до 10-го числа', iconName: 'Droplets' },
        { id: '4', name: 'Вывоз мусора (Махсустранс)', type: 'GARBAGE', accountNumber: 'Л/С 4920194', balance: -18000, dueDate: 'до 25-го числа', iconName: 'Trash2' },
        { id: '5', name: 'Налоговая служба (ИНН)', type: 'TAX', accountNumber: 'ИНН 302948194', balance: 0, dueDate: 'до 1 октября', iconName: 'Landmark' },
        { id: '6', name: 'Коммуналка / ТЧСЖ', type: 'COMMUNAL', accountNumber: 'Договор 1204928', balance: -120000, dueDate: 'до 5-го числа', iconName: 'Building2' },
      ];
      const demoWishlist = [
        { id: '1', name: 'iPhone 17 Pro Max', targetAmount: 18000000, currentAmount: 11450000, iconName: 'Smartphone', category: 'Техника' },
        { id: '2', name: 'Путешествие на Бали', targetAmount: 12000000, currentAmount: 8500000, iconName: 'Plane', category: 'Отдых' },
        { id: '3', name: 'MacBook Pro M4', targetAmount: 25000000, currentAmount: 6000000, iconName: 'Laptop', category: 'Работа' },
        { id: '4', name: 'Первоначальный взнос на Авто', targetAmount: 50000000, currentAmount: 15000000, iconName: 'Car', category: 'Цели' },
      ];

      localStorage.setItem('zenri_utility_bills', JSON.stringify(demoUtilities));
      localStorage.setItem('zenri_wishlist_items', JSON.stringify(demoWishlist));

      await seedDemoDataAction();
      window.location.href = '/dashboard';
    });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-3xl shadow-apple overflow-hidden">
      <div className="px-5 py-3 border-b border-zen-100 dark:border-zen-800/60">
        <h2 className="text-xs font-semibold text-zen-500 uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Row = ({ icon: Icon, label, value, onClick }: { icon: React.ElementType; label: string; value?: string; onClick?: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zen-50 dark:hover:bg-zen-800/50 transition-colors text-left">
      <div className="w-9 h-9 rounded-xl bg-zen-100 dark:bg-zen-800 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-[#0066FF]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-zen-900 dark:text-zen-100">{label}</p>
        {value && <p className="text-xs text-zen-400 mt-0.5">{value}</p>}
      </div>
      <ChevronRight size={16} className="text-zen-300 flex-shrink-0" />
    </button>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">Настройки</h1>

      {/* Profile Section */}
      <Section title="Профиль">
        <Row icon={User} label={user.name} value={user.email} onClick={() => setShowProfile(true)} />
        <Row icon={Globe} label="Валюта по умолчанию" value={user.defaultCurrency} onClick={() => setShowProfile(true)} />
      </Section>

      {/* Demo Seed Generator */}
      <div className="bg-gradient-to-r from-[#0066FF]/10 to-[#10B981]/10 border border-[#0066FF]/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-glow">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100">Заполнить всё примерами (Тестовый режим)</p>
            <p className="text-xs text-zen-400 mt-0.5 max-w-md">
              Автоматически создаёт готовые счета (Uzcard, Humo, Visa), транзакции, коммунальные услуги, хотелки и задачи для проверки приложения.
            </p>
          </div>
        </div>

        <button
          onClick={handleSeedDemoData}
          disabled={isPending}
          className="px-5 py-3 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all flex items-center gap-2 flex-shrink-0 active:scale-95 disabled:opacity-50"
        >
          <Database size={16} /> {isPending ? 'Заполнение...' : 'Заполнить все примеры'}
        </button>
      </div>

      {/* ChatGPT API Key Section */}
      <Section title="Интеграция с ChatGPT API (Персональный Токен)">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0066FF]/15 text-[#0066FF] flex items-center justify-center flex-shrink-0">
                <Key size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-zen-900 dark:text-zen-100">Персональный OpenAI API Key</p>
                <p className="text-xs text-zen-400">Введите свой токен ChatGPT API для личного доступа</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${customApiKey ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[#0066FF]/15 text-[#0066FF]'}`}>
              {customApiKey ? '🟢 Личный токен' : '🔵 Системный ключ ZenRI'}
            </span>
          </div>

          <div className="relative">
            <input
              type={showKeyText ? 'text' : 'password'}
              placeholder="sk-proj-..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="w-full px-4 py-3 pr-24 rounded-2xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-xs font-mono text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
            />
            <button
              onClick={() => setShowKeyText(!showKeyText)}
              className="absolute right-3 top-3 text-zen-400 hover:text-white transition-colors"
            >
              {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zen-400 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" /> Ключ хранится локально в вашем браузере
            </span>

            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all active:scale-95"
            >
              {savedKeySuccess ? 'Сохранено! ✓' : 'Сохранить ключ'}
            </button>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Оформление">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-xl bg-zen-100 dark:bg-zen-800 flex items-center justify-center flex-shrink-0">
            <Palette size={18} className="text-[#0066FF]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100">Тема оформления</p>
            <p className="text-xs text-zen-400 mt-0.5">Светлая / Тёмная</p>
          </div>
          <ThemeToggle />
        </div>
      </Section>

      {/* Categories */}
      <Section title="Категории расходов">
        <div className="px-5 py-3 space-y-2 max-h-60 overflow-y-auto">
          {categories.length === 0 && <p className="text-xs text-zen-400 py-4 text-center">Нет категорий</p>}
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#71717A' }} />
              <span className="text-sm text-zen-700 dark:text-zen-300 font-medium">{cat.name}</span>
              <Badge variant="neutral" size="sm">{cat.type === 'EXPENSE' ? 'Расход' : 'Доход'}</Badge>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <button onClick={() => setShowNewCat(true)} className="flex items-center gap-2 text-xs font-bold text-[#0066FF] hover:underline">
            <Plus size={14} /> Добавить категорию
          </button>
        </div>
      </Section>

      {/* Danger Zone: Reset All Data */}
      <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl overflow-hidden">
        <div className="px-5 py-3 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between">
          <h2 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={14} /> Опасная зона
          </h2>
          <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Сброс данных</span>
        </div>
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100">Сбросить все показатели (С чистого листа)</p>
            <p className="text-xs text-zen-400 mt-0.5 max-w-md">
              Обнуляет все финансовые операции, балансы счетов, задачи, привычки, долги и хотелки. Вы сможете начать вести учёт с чистого листа в любое время.
            </p>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 flex-shrink-0 active:scale-95"
          >
            <RotateCcw size={15} /> Сбросить всё
          </button>
        </div>
      </div>

      {/* Account Management */}
      <Section title="Аккаунт">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-xl bg-zen-100 dark:bg-zen-800 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-zen-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100">{user.email}</p>
            <p className="text-xs text-zen-400 mt-0.5">Email аккаунта</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-expense-light dark:hover:bg-expense-dark/20 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-expense-light dark:bg-expense-dark/40 flex items-center justify-center flex-shrink-0">
            <LogOut size={18} className="text-expense" />
          </div>
          <p className="text-sm font-bold text-expense">Выйти из аккаунта</p>
        </button>
      </Section>

      {/* Profile Edit Modal */}
      <Modal open={showProfile} onClose={() => setShowProfile(false)} title="Редактировать профиль">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Имя профиля</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Валюта по умолчанию</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={handleSaveProfile} disabled={isPending || !name.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50">
            {isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </Modal>

      {/* New Category Modal */}
      <Modal open={showNewCat} onClose={() => setShowNewCat(false)} title="Новая категория">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Название *</label>
            <input type="text" placeholder="Название категории" value={catName} onChange={(e) => setCatName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-2">Тип</label>
            <div className="grid grid-cols-2 gap-2">
              {(['EXPENSE', 'INCOME'] as const).map((t) => (
                <button key={t} onClick={() => setCatType(t)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${catType === t ? (t === 'EXPENSE' ? 'bg-expense text-white' : 'bg-income text-white') : 'bg-zen-100 dark:bg-zen-800 text-zen-600 dark:text-zen-400'}`}>
                  {t === 'EXPENSE' ? 'Расход' : 'Доход'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-2">Цвет</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setCatColor(c)} style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition-all ${catColor === c ? 'ring-2 ring-offset-2 ring-[#0066FF] scale-110' : 'hover:scale-105'}`} />
              ))}
            </div>
          </div>
          <button onClick={handleCreateCategory} disabled={isPending || !catName.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50">
            {isPending ? 'Создание...' : 'Создать категорию'}
          </button>
        </div>
      </Modal>

      {/* Data Reset Modal */}
      <Modal open={showResetModal} onClose={() => { setShowResetModal(false); setConfirmResetInput(''); }} title="Сбросить все показатели">
        <div className="space-y-4">
          {resetSuccess ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
              <p className="font-bold text-lg text-zen-900 dark:text-zen-100">Все данные успешны обнулены!</p>
              <p className="text-xs text-zen-400">Перенаправление на главную страницу...</p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs leading-relaxed flex gap-3">
                <AlertTriangle size={22} className="flex-shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold text-red-500 text-sm mb-1">Вы уверены?</p>
                  <p>Это действие полностью удалит ваши транзакции, задачи, привычки, долги, бюджеты и обнулит балансы всех счетов. <strong className="underline">Это действие нельзя отменить.</strong></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">
                  Для подтверждения введите <span className="text-red-500 font-extrabold">СБРОС</span>:
                </label>
                <input
                  type="text"
                  placeholder="СБРОС"
                  value={confirmResetInput}
                  onChange={(e) => setConfirmResetInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-red-500 text-zen-900 dark:text-zen-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowResetModal(false); setConfirmResetInput(''); }}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-zen-100 dark:bg-zen-800 text-zen-700 dark:text-zen-300 hover:bg-zen-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleResetAllData}
                  disabled={isPending || confirmResetInput.trim().toUpperCase() !== 'СБРОС'}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? 'Сброс...' : 'Да, сбросить всё'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

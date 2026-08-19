'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  User, Mail, Globe, Plus, LogOut, ChevronRight, Palette, Key,
  ShieldCheck, Eye, EyeOff, AlertTriangle, RotateCcw, CheckCircle2, Sparkles, Database, Camera, Send, Languages
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { updateUserProfile, createCategory, resetAllUserData, seedDemoDataAction, updateAvatar } from '@/app/actions/analyticsActions';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/components/ui/LanguageProvider';
import { FlagRussia, FlagUzbekistan, FlagUSA } from '@/components/ui/CountryFlags';

type Category = { id: string; name: string; type: string; color: string | null; icon: string };

interface SettingsClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    defaultCurrency: string;
    avatarUrl: string | null;
    authProvider: string;
    telegramUsername: string | null;
  };
  categories: Category[];
}

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];
const COLORS = ['#0066FF', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#00C2FF', '#EC4899', '#06B6D4', '#84CC16', '#71717A'];

export function SettingsClient({ user, categories }: SettingsClientProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();
  const { t, lang, setLang, languages } = useLanguage();

  const [showProfile, setShowProfile] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);

  // Reset Data Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmResetInput, setConfirmResetInput] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Profile form
  const [name, setName] = useState(user.name);
  const [currency, setCurrency] = useState(user.defaultCurrency);
  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarSaved, setAvatarSaved] = useState(false);

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
      if (avatarUrl !== (user.avatarUrl || '')) {
        await updateAvatar(avatarUrl);
        await updateSession({ name, picture: avatarUrl || undefined });
      } else {
        await updateSession({ name });
      }
      setShowProfile(false);
      router.refresh();
    });
  };

  const handleSaveAvatarOnly = () => {
    startTransition(async () => {
      await updateAvatar(avatarUrl);
      await updateSession({ picture: avatarUrl || undefined });
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2500);
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
    const confirmWord = t('settings_reset_confirm_word');
    if (confirmResetInput.trim().toUpperCase() !== confirmWord) return;
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
    <button onClick={onClick} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zen-50 dark:hover:bg-zen-800/50 transition-colors text-left min-h-[56px]">
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
      <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">{t('settings_title')}</h1>

      {/* Profile Section */}
      <Section title={t('settings_profile')}>
        {/* Avatar + Identity Block */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-zen-100 dark:border-zen-800/40">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-[#0066FF]/40"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0066FF] to-[#8B5CF6] flex items-center justify-center text-white font-black text-xl shadow-glow">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setShowProfile(true)}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#0066FF] rounded-full flex items-center justify-center shadow-md"
            >
              <Camera size={10} className="text-white" />
            </button>
          </div>

          {/* Name + Email + Auth badge */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100 truncate">{user.name}</p>
            <p className="text-xs text-zen-400 mt-0.5 truncate">{user.email}</p>
            {user.authProvider === 'telegram' ? (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#229ED9]/15 text-[#229ED9] text-[10px] font-bold">
                <Send size={9} /> Telegram
                {user.telegramUsername && ` @${user.telegramUsername}`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-zen-100 dark:bg-zen-800 text-zen-400 text-[10px] font-bold">
                Email
              </span>
            )}
          </div>

          <button onClick={() => setShowProfile(true)} className="text-zen-300">
            <ChevronRight size={16} />
          </button>
        </div>
        <Row icon={Globe} label={t('settings_currency_label')} value={user.defaultCurrency} onClick={() => setShowProfile(true)} />
      </Section>

      {/* Language Section */}
      <Section title={t('settings_language')}>
        <div className="p-5">
          <p className="text-xs text-zen-400 mb-4">{t('settings_language_subtitle')}</p>
          <div className="grid grid-cols-3 gap-3">
            {languages.map((l) => {
              const isActive = lang === l.code;
              const FlagComponent = l.code === 'ru' ? FlagRussia : l.code === 'uz' ? FlagUzbekistan : FlagUSA;
              return (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 overflow-hidden ${
                    isActive
                      ? 'border-[#0066FF] bg-gradient-to-b from-[#0066FF]/15 to-[#0066FF]/5 shadow-glow scale-[1.03]'
                      : 'border-zen-200 dark:border-zen-700 bg-zen-50 dark:bg-zen-800/50 hover:border-[#0066FF]/50 hover:scale-[1.01]'
                  }`}
                >
                  {/* Active indicator ring */}
                  {isActive && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#0066FF] flex items-center justify-center">
                      <span className="text-white text-[8px] font-black">✓</span>
                    </div>
                  )}

                  {/* Flag Image with drop shadow */}
                  <div className={`rounded-lg overflow-hidden shadow-md transition-all ${
                    isActive ? 'ring-2 ring-[#0066FF]/60 shadow-lg' : 'ring-1 ring-black/10'
                  }`}>
                    <FlagComponent size={64} />
                  </div>

                  {/* Language Name */}
                  <div className="text-center">
                    <p className={`text-xs font-black ${
                      isActive ? 'text-[#0066FF]' : 'text-zen-900 dark:text-zen-100'
                    }`}>{l.nativeName}</p>
                    <p className="text-[10px] text-zen-400 font-medium">{l.country}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Demo Seed Generator */}
      <div className="bg-gradient-to-r from-[#0066FF]/10 to-[#10B981]/10 border border-[#0066FF]/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-glow">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100">{t('settings_demo')}</p>
            <p className="text-xs text-zen-400 mt-0.5 max-w-md">
              {t('settings_demo_desc')}
            </p>
          </div>
        </div>

        <button
          onClick={handleSeedDemoData}
          disabled={isPending}
          className="px-5 py-3 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all flex items-center gap-2 flex-shrink-0 active:scale-95 disabled:opacity-50 min-h-[44px]"
        >
          <Database size={16} /> {isPending ? t('settings_filling') : t('settings_demo_btn')}
        </button>
      </div>

      {/* ChatGPT API Key Section */}
      <Section title={t('settings_chatgpt_title')}>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0066FF]/15 text-[#0066FF] flex items-center justify-center flex-shrink-0">
                <Key size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-zen-900 dark:text-zen-100">{t('settings_chatgpt_key_label')}</p>
                <p className="text-xs text-zen-400">{t('settings_chatgpt_key_desc')}</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex-shrink-0 ${customApiKey ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[#0066FF]/15 text-[#0066FF]'}`}>
              {customApiKey ? t('settings_chatgpt_personal_key') : t('settings_chatgpt_system_key')}
            </span>
          </div>

          <div className="relative">
            <input
              type={showKeyText ? 'text' : 'password'}
              placeholder="sk-proj-..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="w-full px-4 py-3 pr-24 rounded-2xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-xs font-mono text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF] min-h-[44px]"
            />
            <button
              onClick={() => setShowKeyText(!showKeyText)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zen-400 hover:text-zen-700 dark:hover:text-zen-200 transition-colors p-1"
            >
              {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zen-400 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" /> {t('settings_key_local')}
            </span>

            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all active:scale-95 min-h-[36px]"
            >
              {savedKeySuccess ? t('settings_saved') : t('settings_save_key')}
            </button>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title={t('settings_appearance')}>
        <div className="flex items-center gap-4 px-5 py-4 min-h-[64px]">
          <div className="w-9 h-9 rounded-xl bg-zen-100 dark:bg-zen-800 flex items-center justify-center flex-shrink-0">
            <Palette size={18} className="text-[#0066FF]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100">{t('settings_theme')}</p>
            <p className="text-xs text-zen-400 mt-0.5">{t('settings_theme_subtitle')}</p>
          </div>
          <ThemeToggle />
        </div>
      </Section>

      {/* Categories */}
      <Section title={t('settings_categories')}>
        <div className="px-5 py-3 space-y-2 max-h-60 overflow-y-auto">
          {categories.length === 0 && <p className="text-xs text-zen-400 py-4 text-center">{t('settings_no_categories')}</p>}
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 py-1">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#71717A' }} />
              <span className="text-sm text-zen-700 dark:text-zen-300 font-medium">{cat.name}</span>
              <Badge variant="neutral" size="sm">{cat.type === 'EXPENSE' ? t('settings_expense_type') : t('settings_income_type')}</Badge>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <button onClick={() => setShowNewCat(true)} className="flex items-center gap-2 text-xs font-bold text-[#0066FF] hover:underline min-h-[36px]">
            <Plus size={14} /> {t('settings_add_category')}
          </button>
        </div>
      </Section>

      {/* Danger Zone: Reset All Data */}
      <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl overflow-hidden">
        <div className="px-5 py-3 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between">
          <h2 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={14} /> {t('settings_danger_zone')}
          </h2>
          <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">{t('settings_reset_data')}</span>
        </div>
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100">{t('settings_reset_title')}</p>
            <p className="text-xs text-zen-400 mt-0.5 max-w-md">
              {t('settings_reset_desc')}
            </p>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 flex-shrink-0 active:scale-95 min-h-[44px]"
          >
            <RotateCcw size={15} /> {t('settings_reset_btn')}
          </button>
        </div>
      </div>

      {/* Account Management */}
      <Section title={t('settings_account')}>
        <div className="flex items-center gap-4 px-5 py-4 min-h-[64px]">
          <div className="w-9 h-9 rounded-xl bg-zen-100 dark:bg-zen-800 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-zen-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100">{user.email}</p>
            <p className="text-xs text-zen-400 mt-0.5">{t('settings_email_label')}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-expense-light dark:hover:bg-expense-dark/20 transition-colors text-left min-h-[56px]"
        >
          <div className="w-9 h-9 rounded-xl bg-expense-light dark:bg-expense-dark/40 flex items-center justify-center flex-shrink-0">
            <LogOut size={18} className="text-expense" />
          </div>
          <p className="text-sm font-bold text-expense">{t('settings_logout')}</p>
        </button>
      </Section>

      {/* Profile Edit Modal */}
      <Modal open={showProfile} onClose={() => setShowProfile(false)} title={t('settings_edit_profile')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-2">{t('settings_avatar_label')}</label>
            <div className="flex items-center gap-4 mb-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt="preview" className="w-14 h-14 rounded-full object-cover ring-2 ring-[#0066FF]/40 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0066FF] to-[#8B5CF6] flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-xs font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100 min-h-[44px]"
                  placeholder={t('settings_avatar_placeholder')}
                />
                <p className="text-[10px] text-zen-400 mt-1">{t('settings_avatar_placeholder')}</p>
              </div>
            </div>
            {avatarSaved && (
              <p className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> {t('settings_avatar_saved')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">{t('settings_name_label')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">{t('settings_currency_label')}</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100 min-h-[44px]">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={handleSaveProfile} disabled={isPending || !name.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50 min-h-[48px]">
            {isPending ? t('settings_saving') : t('settings_save_changes')}
          </button>
        </div>
      </Modal>

      {/* New Category Modal */}
      <Modal open={showNewCat} onClose={() => setShowNewCat(false)} title={t('settings_new_category')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">{t('settings_cat_name')}</label>
            <input type="text" placeholder={t('settings_cat_name_placeholder')} value={catName} onChange={(e) => setCatName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-2">{t('settings_cat_type')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['EXPENSE', 'INCOME'] as const).map((tp) => (
                <button key={tp} onClick={() => setCatType(tp)}
                  className={`py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] ${catType === tp ? (tp === 'EXPENSE' ? 'bg-expense text-white' : 'bg-income text-white') : 'bg-zen-100 dark:bg-zen-800 text-zen-600 dark:text-zen-400'}`}>
                  {tp === 'EXPENSE' ? t('settings_expense_type') : t('settings_income_type')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-2">{t('settings_cat_color')}</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setCatColor(c)} style={{ backgroundColor: c }}
                  className={`w-9 h-9 rounded-full transition-all ${catColor === c ? 'ring-2 ring-offset-2 ring-[#0066FF] scale-110' : 'hover:scale-105'}`} />
              ))}
            </div>
          </div>
          <button onClick={handleCreateCategory} disabled={isPending || !catName.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50 min-h-[48px]">
            {isPending ? t('settings_creating') : t('settings_create_category')}
          </button>
        </div>
      </Modal>

      {/* Data Reset Modal */}
      <Modal open={showResetModal} onClose={() => { setShowResetModal(false); setConfirmResetInput(''); }} title={t('settings_reset_modal_title')}>
        <div className="space-y-4">
          {resetSuccess ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
              <p className="font-bold text-lg text-zen-900 dark:text-zen-100">{t('settings_reset_success')}</p>
              <p className="text-xs text-zen-400">{t('settings_redirect')}</p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs leading-relaxed flex gap-3">
                <AlertTriangle size={22} className="flex-shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold text-red-500 text-sm mb-1">{t('settings_reset_sure')}</p>
                  <p>{t('settings_reset_warning')} <strong className="underline">{t('settings_reset_irreversible')}</strong></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">
                  {t('settings_reset_confirm_label')} <span className="text-red-500 font-extrabold">{t('settings_reset_confirm_word')}</span>:
                </label>
                <input
                  type="text"
                  placeholder={t('settings_reset_confirm_word')}
                  value={confirmResetInput}
                  onChange={(e) => setConfirmResetInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-red-500 text-zen-900 dark:text-zen-100 min-h-[44px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowResetModal(false); setConfirmResetInput(''); }}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-zen-100 dark:bg-zen-800 text-zen-700 dark:text-zen-300 hover:bg-zen-200 transition-colors min-h-[48px]"
                >
                  {t('settings_cancel')}
                </button>
                <button
                  onClick={handleResetAllData}
                  disabled={isPending || confirmResetInput.trim().toUpperCase() !== t('settings_reset_confirm_word')}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {isPending ? t('settings_resetting') : t('settings_confirm_reset')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

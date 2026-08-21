'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import {
  Sparkles, Send, Bot, User as UserIcon, RefreshCw, Zap, TrendingUp, Target,
  Star, Plus, Trash2, Check, Loader2, ShieldCheck, AlertCircle, PiggyBank,
  ChevronRight, Brain,
} from 'lucide-react';
import { askChatGPT, Message } from '@/app/actions/aiActions';
import { AIPredictWidget } from '@/components/ui/AIPredictWidget';

function cleanText(t: string) {
  return t
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[\{\}]/g, '');
}

function fmt(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));
}

interface AIClientProps {
  userName: string;
  totalBalance?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  topCategoryName?: string;
  topCategoryAmount?: number;
  savingsRate?: number;
  topExpenseCategories?: { name: string; amount: number; percent: number; color: string }[];
}

const TABS = ['🤖 Ассистент', '📊 ИИ Прогноз', '🎯 Хотелки', '⭐ AI Скоринг'] as const;
type Tab = (typeof TABS)[number];

// ─── WISH LIST ITEM ───
interface WishItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
}

// ─── AI SCORING ───
function calcScore(income: number, expense: number, balance: number, savingsRate: number) {
  let score = 50;
  if (income > 0) score += 10;
  if (expense < income * 0.7) score += 15;
  if (balance > income * 2) score += 10;
  if (savingsRate >= 20) score += 15;
  else if (savingsRate >= 10) score += 8;
  if (expense > income) score -= 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-500';
  if (s >= 50) return 'text-[#0066FF]';
  if (s >= 30) return 'text-amber-500';
  return 'text-rose-500';
}

function scoreLabel(s: number) {
  if (s >= 75) return 'Отличное';
  if (s >= 50) return 'Хорошее';
  if (s >= 30) return 'Среднее';
  return 'Требует улучшения';
}

export function AIClient({
  userName,
  totalBalance = 0,
  monthlyIncome = 0,
  monthlyExpense = 0,
  topCategoryName = 'Расходы',
  topCategoryAmount = 0,
  savingsRate = 0,
  topExpenseCategories = [],
}: AIClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('🤖 Ассистент');
  const [isPending, startTransition] = useTransition();

  // ─── CHAT ───
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Привет, ${userName}! 👋\n\nЯ ваш персональный AI-финансовый ассистент ZenRI на базе ChatGPT. Я знаю ваши счета, доходы и расходы.\n\nЧем могу помочь?`,
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isPending]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isPending) return;
    const userMsg: Message = { role: 'user', content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    startTransition(async () => {
      const apiHistory = updatedMessages.filter((m) => m.role !== 'system');
      const customKey = typeof window !== 'undefined' ? localStorage.getItem('zenri_custom_openai_key') || undefined : undefined;
      const reply = await askChatGPT(apiHistory, customKey);
      setMessages((prev) => [...prev, { role: 'assistant', content: cleanText(reply) }]);
    });
  };

  // ─── WISH LIST ───
  const [wishItems, setWishItems] = useState<WishItem[]>(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('zenri_wishlist_items') || '[]'); }
      catch { return []; }
    }
    return [];
  });
  const [wishName, setWishName] = useState('');
  const [wishTarget, setWishTarget] = useState('');
  const [wishCurrent, setWishCurrent] = useState('');
  const [wishCategory, setWishCategory] = useState('Техника');
  const [showWishForm, setShowWishForm] = useState(false);

  const saveWish = (items: WishItem[]) => {
    setWishItems(items);
    if (typeof window !== 'undefined') localStorage.setItem('zenri_wishlist_items', JSON.stringify(items));
  };

  const handleAddWish = () => {
    if (!wishName.trim() || !wishTarget.trim()) return;
    const item: WishItem = {
      id: Date.now().toString(),
      name: wishName.trim(),
      targetAmount: parseFloat(wishTarget.replace(/\s/g, '')) || 0,
      currentAmount: parseFloat(wishCurrent.replace(/\s/g, '')) || 0,
      category: wishCategory,
    };
    saveWish([...wishItems, item]);
    setWishName(''); setWishTarget(''); setWishCurrent(''); setShowWishForm(false);
  };

  const handleDeleteWish = (id: string) => saveWish(wishItems.filter((w) => w.id !== id));

  const monthsToGoal = (item: WishItem) => {
    const need = item.targetAmount - item.currentAmount;
    if (need <= 0) return 0;
    const saveable = monthlyIncome - monthlyExpense;
    if (saveable <= 0) return null;
    return Math.ceil(need / saveable);
  };

  // ─── AI SCORING ───
  const score = calcScore(monthlyIncome, monthlyExpense, totalBalance, savingsRate);

  const QUICK_PROMPTS = [
    '📊 Проанализируй мои расходы за этот месяц',
    '💡 Как накопить быстрее на крупную покупку?',
    '☕ Сколько я трачу на кафе и еду?',
    '🎯 Дай 3 совета по улучшению финансового здоровья',
  ];

  const WISH_CATEGORIES = ['Техника', 'Отдых', 'Авто', 'Недвижимость', 'Образование', 'Здоровье', 'Прочее'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100 flex items-center gap-2">
          <Brain className="text-[#0066FF]" size={26} />
          AI Hub ZenRI
        </h1>
        <p className="text-xs text-zen-400 mt-0.5">Все ИИ-инструменты для вашего финансового здоровья</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-zen-100 dark:bg-zen-900 p-1 rounded-2xl border border-zen-200 dark:border-zen-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#0066FF] to-violet-600 text-white shadow-sm'
                : 'text-zen-500 hover:text-zen-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── TAB: АССИСТЕНТ ─── */}
      {activeTab === '🤖 Ассистент' && (
        <div className="space-y-4">
          {/* Quick Prompts */}
          <div>
            <p className="text-xs font-bold text-zen-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Zap size={12} className="text-[#0066FF]" /> Быстрые вопросы
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  disabled={isPending}
                  className="text-left p-3 rounded-2xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 text-xs font-bold text-zen-800 dark:text-zen-200 hover:border-[#0066FF] hover:text-[#0066FF] dark:hover:text-[#00C2FF] transition-all shadow-apple disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Box */}
          <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl shadow-2xl flex flex-col h-[440px] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] text-white flex items-center justify-center flex-shrink-0 shadow-glow">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0066FF] text-white rounded-tr-none shadow-glow'
                      : 'bg-zen-100 dark:bg-zen-900/80 text-zen-900 dark:text-zen-100 border border-zen-200/60 dark:border-zen-800/60 rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    {cleanText(msg.content)}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0055FF] to-[#8B5CF6] text-white flex items-center justify-center flex-shrink-0">
                      <UserIcon size={14} />
                    </div>
                  )}
                </div>
              ))}
              {isPending && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot size={16} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-zen-100 dark:bg-zen-900/80 border border-zen-200/60 dark:border-zen-800 text-xs text-zen-400 flex items-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-[#0066FF]" />
                    ChatGPT анализирует...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-zen-50 dark:bg-zen-950/60 border-t border-zen-200 dark:border-zen-800/60 flex items-center gap-2">
              <input
                type="text"
                placeholder="Спросите что угодно о финансах..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
                disabled={isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 text-xs text-zen-900 dark:text-zen-100 placeholder-zen-400 focus:outline-none focus:border-[#0066FF]"
              />
              <button
                onClick={() => handleSend()}
                disabled={isPending || !input.trim()}
                className="w-10 h-10 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white flex items-center justify-center shadow-glow transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: ИИ ПРОГНОЗ ─── */}
      {activeTab === '📊 ИИ Прогноз' && (
        <AIPredictWidget
          totalBalance={totalBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
          topCategoryName={topCategoryName}
          topCategoryAmount={topCategoryAmount}
        />
      )}

      {/* ─── TAB: ХОТЕЛКИ ─── */}
      {activeTab === '🎯 Хотелки' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-zen-900 dark:text-zen-100">Список желаний</p>
              <p className="text-xs text-zen-400 mt-0.5">ИИ рассчитает когда сможете позволить</p>
            </div>
            <button
              onClick={() => setShowWishForm(!showWishForm)}
              className="px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold shadow-glow transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus size={14} /> Добавить
            </button>
          </div>

          {/* Add form */}
          {showWishForm && (
            <div className="bg-white dark:bg-[#131C2E] border border-[#0066FF]/30 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-black text-zen-900 dark:text-zen-100 mb-2">Новая хотелка</p>
              <input
                type="text"
                placeholder="Название (например: iPhone 17 Pro)"
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-xs text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Цена (цель)"
                  value={wishTarget}
                  onChange={(e) => setWishTarget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-xs focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Накоплено уже"
                  value={wishCurrent}
                  onChange={(e) => setWishCurrent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-xs focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {WISH_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setWishCategory(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                      wishCategory === c
                        ? 'bg-[#0066FF] text-white border-[#0066FF]'
                        : 'bg-zen-50 dark:bg-zen-900 text-zen-500 border-zen-200 dark:border-zen-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddWish}
                  disabled={!wishName.trim() || !wishTarget.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-black shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check size={15} /> Сохранить
                </button>
                <button
                  onClick={() => setShowWishForm(false)}
                  className="px-5 py-3 rounded-xl bg-zen-100 dark:bg-zen-800 text-zen-600 dark:text-zen-300 text-xs font-bold"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Wish items */}
          {wishItems.length === 0 && !showWishForm ? (
            <div className="text-center py-16">
              <Target size={48} className="mx-auto mb-4 text-zen-300 dark:text-zen-700" />
              <p className="text-sm font-bold text-zen-500">Список желаний пуст</p>
              <p className="text-xs text-zen-400 mt-1">Добавьте первую цель — ИИ рассчитает срок накопления</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wishItems.map((item) => {
                const progress = item.targetAmount > 0 ? Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100)) : 0;
                const months = monthsToGoal(item);
                const isDone = item.currentAmount >= item.targetAmount;
                return (
                  <div key={item.id} className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-zen-900 dark:text-zen-100">{item.name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zen-100 dark:bg-zen-800 text-zen-500">{item.category}</span>
                          {isDone && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">✓ Достигнуто!</span>}
                        </div>
                        <p className="text-xs text-zen-400 mt-1">
                          {item.currentAmount.toLocaleString('ru-RU')} / {item.targetAmount.toLocaleString('ru-RU')} сум
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteWish(item.id)}
                        className="text-zen-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zen-100 dark:bg-zen-800 rounded-full h-2.5 mb-3">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#0066FF] to-violet-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* AI Estimate */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${isDone ? 'bg-emerald-500/10 text-emerald-500' : months === null ? 'bg-amber-500/10 text-amber-500' : 'bg-[#0066FF]/10 text-[#0066FF]'}`}>
                      <Sparkles size={13} className="flex-shrink-0" />
                      <span className="font-bold">
                        {isDone
                          ? 'Поздравляем! Цель достигнута 🎉'
                          : months === null
                          ? 'Для расчёта нужен положительный баланс в месяц'
                          : `ИИ оценка: ~${months} ${months === 1 ? 'месяц' : months <= 4 ? 'месяца' : 'месяцев'} при текущем темпе`}
                      </span>
                      <span className="ml-auto font-bold opacity-70">{progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: AI СКОРИНГ ─── */}
      {activeTab === '⭐ AI Скоринг' && (
        <div className="space-y-4">
          {/* Score card */}
          <div className="bg-gradient-to-br from-[#0066FF]/10 via-violet-600/10 to-transparent border border-[#0066FF]/30 rounded-2xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#0066FF]/10 rounded-full blur-3xl pointer-events-none" />
            <p className="text-xs font-bold text-zen-400 uppercase tracking-wider mb-4">Финансовый рейтинг ZenRI</p>
            <div className={`text-7xl font-black mb-2 ${scoreColor(score)}`}>{score}</div>
            <div className={`text-lg font-black mb-1 ${scoreColor(score)}`}>{scoreLabel(score)}</div>
            <p className="text-xs text-zen-400">из 100 возможных баллов</p>

            {/* Score arc visual */}
            <div className="w-full bg-zen-100 dark:bg-zen-800 rounded-full h-3 mt-5 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-[#0066FF]' : score >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zen-400 mt-1">
              <span>0</span>
              <span>25 — Слабо</span>
              <span>50 — Средне</span>
              <span>75 — Хорошо</span>
              <span>100</span>
            </div>
          </div>

          {/* Scoring breakdown */}
          <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple space-y-4">
            <p className="text-sm font-black text-zen-900 dark:text-zen-100">Анализ составляющих</p>

            {[
              {
                label: 'Доход > 0',
                value: monthlyIncome > 0,
                detail: `Доходы: ${fmt(monthlyIncome)} сум/мес`,
                points: 10,
              },
              {
                label: 'Расходы < 70% дохода',
                value: monthlyIncome > 0 && monthlyExpense < monthlyIncome * 0.7,
                detail: `Расходы: ${fmt(monthlyExpense)} сум (${monthlyIncome > 0 ? Math.round((monthlyExpense / monthlyIncome) * 100) : 0}% дохода)`,
                points: 15,
              },
              {
                label: 'Резерв на 2+ месяца',
                value: totalBalance > monthlyIncome * 2,
                detail: `Баланс: ${fmt(totalBalance)} сум`,
                points: 10,
              },
              {
                label: 'Норма сбережений ≥ 20%',
                value: savingsRate >= 20,
                detail: `Текущая норма: ${savingsRate}%`,
                points: 15,
              },
              {
                label: 'Нет дефицита',
                value: monthlyExpense <= monthlyIncome,
                detail: monthlyExpense <= monthlyIncome ? 'Бюджет сбалансирован' : `Дефицит: ${fmt(monthlyExpense - monthlyIncome)} сум`,
                points: 20,
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${item.value ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zen-100 dark:bg-zen-800 text-zen-400'}`}>
                  {item.value ? <ShieldCheck size={15} /> : <AlertCircle size={15} />}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-bold ${item.value ? 'text-zen-900 dark:text-zen-100' : 'text-zen-400'}`}>{item.label}</p>
                  <p className="text-[10px] text-zen-400">{item.detail}</p>
                </div>
                <div className={`text-xs font-black ${item.value ? 'text-emerald-500' : 'text-zen-300 dark:text-zen-600'}`}>
                  {item.value ? `+${item.points}` : `+0`}
                </div>
              </div>
            ))}
          </div>

          {/* AI Recommendations */}
          {topExpenseCategories.length > 0 && (
            <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple">
              <p className="text-sm font-black text-zen-900 dark:text-zen-100 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#0066FF]" />
                Как повысить скоринг
              </p>
              <div className="space-y-2">
                {monthlyExpense >= monthlyIncome * 0.7 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <span className="text-amber-500 text-lg leading-none">⚡</span>
                    <p className="text-xs text-zen-700 dark:text-zen-300">
                      Сократите расходы на <strong>{topExpenseCategories[0]?.name}</strong> (самая большая статья) хотя бы на 15-20% — это даст +10 баллов к скорингу.
                    </p>
                  </div>
                )}
                {savingsRate < 20 && monthlyIncome > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-[#0066FF]/10 rounded-xl border border-[#0066FF]/20">
                    <PiggyBank size={16} className="text-[#0066FF] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zen-700 dark:text-zen-300">
                      Целевая норма сбережений — 20%. Вам нужно откладывать ещё{' '}
                      <strong>{fmt(monthlyIncome * 0.2 - (monthlyIncome - monthlyExpense))} сум/мес</strong>.
                    </p>
                  </div>
                )}
                {totalBalance < monthlyIncome * 2 && monthlyIncome > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
                    <ShieldCheck size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zen-700 dark:text-zen-300">
                      Создайте финансовую подушку безопасности: минимум{' '}
                      <strong>{fmt(monthlyIncome * 3)} сум</strong> (3 месяца расходов).
                    </p>
                  </div>
                )}
                {score >= 75 && (
                  <div className="flex items-start gap-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Star size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zen-700 dark:text-zen-300">
                      Отличный результат! Рассмотрите возможность инвестирования свободных средств для дальнейшего роста капитала.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

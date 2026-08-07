'use client';

import React, { useState, useEffect } from 'react';
import { Quote, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';

export type FinancialQuote = {
  quote: string;
  author: string;
  title: string;
};

const FINANCIAL_QUOTES: FinancialQuote[] = [
  {
    quote: 'Инвестируйте в себя. Ваше собственное образование и навыки — это лучший актив, который никто не сможет забрать.',
    author: 'Уоррен Баффетт',
    title: 'Легендарный инвестор & Миллиардер',
  },
  {
    quote: 'Не покупайте вещи, чтобы произвести впечатление на людей, которых вы не любите, на деньги, которых у вас нет.',
    author: 'Роберт Кийосаки',
    title: 'Автор бестселлера «Богатый папа, бедный папа»',
  },
  {
    quote: 'Правило №1: Никогда не теряй деньги. Правило №2: Никогда не забывай правило №1.',
    author: 'Уоррен Баффетт',
    title: 'Глава Berkshire Hathaway',
  },
  {
    quote: 'Заботьтесь о мелких расходах; маленькая течь может потопить большой корабль.',
    author: 'Бенджамин Франклин',
    title: 'Государственный деятель и мыслитель',
  },
  {
    quote: 'Богатые люди сначала инвестируют и тратят то, что осталось. Бедные — сначала тратят и пытаются инвестировать остатки.',
    author: 'Джим Рон',
    title: 'Бизнес-философ и писатель',
  },
  {
    quote: 'Тот, кто покупает вещи, которые ему не нужны, вскоре будет вынужден продавать вещи, которые ему необходимы.',
    author: 'Бенджамин Грэм',
    title: 'Отец стоимостного инвестирования',
  },
  {
    quote: 'Формула богатства проста: зарабатывай больше, трать меньше, а разницу регулярно инвестируй с умом.',
    author: 'Навал Равикант',
    title: 'Основатель AngelList и мыслитель',
  },
  {
    quote: 'Сложный процент — это восьмое чудо света. Тот, кто понимает его, зарабатывает его; тот, кто не понимает — платит его.',
    author: 'Альберт Эйнштейн',
    title: 'Физик и лауреат Нобелевской премии',
  },
  {
    quote: 'Финансовая свобода — это не количество денег, а свобода от необходимости работать исключительно ради денег.',
    author: 'Чарли Мангер',
    title: 'Вице-председатель Berkshire Hathaway',
  },
  {
    quote: 'Инвестиции в знания платят самые высокие проценты.',
    author: 'Бенджамин Франклин',
    title: 'Мыслитель и ученый',
  },
];

export const DailyFinancialQuote: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    setQuoteIndex(dayOfYear % FINANCIAL_QUOTES.length);
  }, []);

  const currentQuote = FINANCIAL_QUOTES[quoteIndex];

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % FINANCIAL_QUOTES.length);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`«${currentQuote.quote}» — ${currentQuote.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gradient-to-r dark:from-[#0F1E36] dark:via-[#13233F] dark:to-[#0A1527] border border-slate-200/90 dark:border-[#0066FF]/25 rounded-card p-5 text-slate-800 dark:text-white shadow-apple relative overflow-hidden card-hover">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#0066FF]/10 dark:bg-[#0066FF]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#0066FF]/10 dark:bg-[#0066FF]/20 border border-[#0066FF]/20 dark:border-[#0066FF]/40 text-[#0066FF] dark:text-[#00C2FF] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Quote size={20} />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0066FF] dark:text-[#00C2FF] flex items-center gap-1">
                <Sparkles size={11} /> Цитата дня о финансах
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold italic text-slate-900 dark:text-zen-100 leading-relaxed">
              «{currentQuote.quote}»
            </p>

            <p className="text-[11px] text-slate-500 dark:text-zen-400 font-bold">
              — <span className="text-slate-900 dark:text-white">{currentQuote.author}</span> ({currentQuote.title})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zen-900/60 border border-slate-200 dark:border-zen-800 hover:border-[#0066FF] text-slate-600 dark:text-zen-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs flex items-center gap-1.5"
            title="Копировать цитату"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span className="hidden md:inline text-[11px] font-medium">{copied ? 'Скопировано' : 'Копия'}</span>
          </button>

          <button
            onClick={handleNextQuote}
            className="p-2 rounded-xl bg-[#0066FF]/10 dark:bg-[#0066FF]/20 border border-[#0066FF]/30 dark:border-[#0066FF]/40 hover:bg-[#0066FF] text-[#0066FF] dark:text-[#00C2FF] hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95"
            title="Другая цитата"
          >
            <RefreshCw size={14} />
            <span className="hidden md:inline text-[11px] font-bold">Другая</span>
          </button>
        </div>
      </div>
    </div>
  );
};

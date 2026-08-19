'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Coins,
  Calculator as CalcIcon,
  TrendingUp,
  ArrowRightLeft,
  PiggyBank,
  Landmark,
  Target,
  Percent,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Info,
  ExternalLink,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  type ExchangeRateInfo,
  type SupportedCurrency,
  convertCurrency,
  formatWithCurrency,
} from '@/lib/currencyRates';
import { soundFx } from '@/lib/soundEffects';
import { getLiveRatesAction } from '@/app/actions/currencyActions';

interface AccountSummary {
  id: string;
  name: string;
  currentBalance: number;
  currency: string;
}

interface CalculatorClientProps {
  initialRates: Record<SupportedCurrency, ExchangeRateInfo>;
  userCurrency: string;
  userAccounts: AccountSummary[];
}

type TabType = 'CONVERTER' | 'FINANCE_CALC' | 'DEPOSIT' | 'LOAN' | 'SAVINGS_GOAL';

export function CalculatorClient({
  initialRates,
  userCurrency,
  userAccounts,
}: CalculatorClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('CONVERTER');
  const [rates, setRates] = useState<Record<SupportedCurrency, ExchangeRateInfo>>(initialRates);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(
    new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync with live CBU / bank.uz rate
  const handleSyncRates = async () => {
    setIsSyncing(true);
    soundFx.playClick();
    try {
      const res = await getLiveRatesAction();
      if (res.success) {
        setRates(res.rates);
        setLastSyncedTime(res.syncedAt);
        soundFx.playIncomeSound();
      }
    } catch (err) {
      console.error('Failed to sync live rates:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Auto-sync on client load
    handleSyncRates();
  }, []);

  // ─── 1. Currency Converter State ───
  const [activeSourceCurrency, setActiveSourceCurrency] = useState<SupportedCurrency>('USD');
  const [sourceAmount, setSourceAmount] = useState<string>('100');

  const parsedAmount = parseFloat(sourceAmount.replace(/\s/g, '').replace(',', '.')) || 0;

  const convertedValues = useMemo(() => {
    const simpleRates = {
      UZS: rates.UZS?.rateToUZS || 1,
      USD: rates.USD?.rateToUZS || 11820.40,
      EUR: rates.EUR?.rateToUZS || 13684.48,
      RUB: rates.RUB?.rateToUZS || 139.05,
      GBP: rates.GBP?.rateToUZS || 15990.64,
      AED: rates.AED?.rateToUZS || 3218.54,
      KZT: rates.KZT?.rateToUZS || 25.58,
    };

    return {
      UZS: convertCurrency(parsedAmount, activeSourceCurrency, 'UZS', simpleRates),
      USD: convertCurrency(parsedAmount, activeSourceCurrency, 'USD', simpleRates),
      EUR: convertCurrency(parsedAmount, activeSourceCurrency, 'EUR', simpleRates),
      RUB: convertCurrency(parsedAmount, activeSourceCurrency, 'RUB', simpleRates),
      GBP: convertCurrency(parsedAmount, activeSourceCurrency, 'GBP', simpleRates),
      AED: convertCurrency(parsedAmount, activeSourceCurrency, 'AED', simpleRates),
      KZT: convertCurrency(parsedAmount, activeSourceCurrency, 'KZT', simpleRates),
    };
  }, [parsedAmount, activeSourceCurrency, rates]);

  const handleCopy = (text: string, key: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ─── 2. Quick Financial Calc State ───
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcResetOnNext, setCalcResetOnNext] = useState(false);

  const handleCalcNumber = (digit: string) => {
    soundFx.playClick();
    if (calcDisplay === '0' || calcResetOnNext) {
      setCalcDisplay(digit);
      setCalcResetOnNext(false);
    } else {
      setCalcDisplay(calcDisplay + digit);
    }
  };

  const handleCalcOp = (operator: string) => {
    soundFx.playClick();
    const current = parseFloat(calcDisplay.replace(/\s/g, '')) || 0;
    if (calcPrev !== null && calcOp && !calcResetOnNext) {
      const res = evaluateMath(calcPrev, current, calcOp);
      setCalcPrev(res);
      setCalcDisplay(String(res));
    } else {
      setCalcPrev(current);
    }
    setCalcOp(operator);
    setCalcResetOnNext(true);
  };

  const evaluateMath = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleCalcEqual = () => {
    if (calcPrev === null || !calcOp) return;
    soundFx.playIncomeSound();
    const current = parseFloat(calcDisplay.replace(/\s/g, '')) || 0;
    const res = evaluateMath(calcPrev, current, calcOp);
    setCalcDisplay(String(Math.round(res * 100) / 100));
    setCalcPrev(null);
    setCalcOp(null);
    setCalcResetOnNext(true);
  };

  const handleCalcClear = () => {
    soundFx.playClick();
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
    setCalcResetOnNext(false);
  };

  const handleAddNDS = (percentage = 12) => {
    soundFx.playClick();
    const current = parseFloat(calcDisplay.replace(/\s/g, '')) || 0;
    const withNds = current * (1 + percentage / 100);
    setCalcDisplay(String(Math.round(withNds * 100) / 100));
    setCalcResetOnNext(true);
  };

  const handleExtractNDS = (percentage = 12) => {
    soundFx.playClick();
    const current = parseFloat(calcDisplay.replace(/\s/g, '')) || 0;
    const withoutNds = current / (1 + percentage / 100);
    setCalcDisplay(String(Math.round(withoutNds * 100) / 100));
    setCalcResetOnNext(true);
  };

  // ─── 3. Deposit / Compound Interest State ───
  const [depPrincipal, setDepPrincipal] = useState('10000000');
  const [depMonthlyAdd, setDepMonthlyAdd] = useState('500000');
  const [depRate, setDepRate] = useState('22'); // 22% in UZS
  const [depMonths, setDepMonths] = useState('12');

  const depositResults = useMemo(() => {
    const P = parseFloat(depPrincipal) || 0;
    const PMT = parseFloat(depMonthlyAdd) || 0;
    const r = (parseFloat(depRate) || 0) / 100 / 12;
    const n = parseInt(depMonths) || 12;

    let balance = P;
    let totalInvested = P;

    for (let i = 1; i <= n; i++) {
      balance = balance * (1 + r) + PMT;
      totalInvested += PMT;
    }

    const totalInterest = Math.max(0, balance - totalInvested);

    return {
      finalBalance: Math.round(balance),
      totalInvested: Math.round(totalInvested),
      totalInterest: Math.round(totalInterest),
      monthlyProfitAvg: Math.round(totalInterest / Math.max(1, n)),
    };
  }, [depPrincipal, depMonthlyAdd, depRate, depMonths]);

  // ─── 4. Loan / Credit Calculator State ───
  const [loanAmount, setLoanAmount] = useState('50000000');
  const [loanRate, setLoanRate] = useState('24'); // 24% annual
  const [loanMonths, setLoanMonths] = useState('24');

  const loanResults = useMemo(() => {
    const P = parseFloat(loanAmount) || 0;
    const r = (parseFloat(loanRate) || 0) / 100 / 12;
    const n = parseInt(loanMonths) || 24;

    if (P <= 0 || n <= 0) return { monthlyPayment: 0, totalPayment: 0, overpayment: 0 };

    let monthlyPayment = 0;
    if (r > 0) {
      monthlyPayment = (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    } else {
      monthlyPayment = P / n;
    }

    const totalPayment = monthlyPayment * n;
    const overpayment = Math.max(0, totalPayment - P);

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(totalPayment),
      overpayment: Math.round(overpayment),
    };
  }, [loanAmount, loanRate, loanMonths]);

  // ─── 5. Savings Goal Planner State ───
  const [goalAmount, setGoalAmount] = useState('120000000');
  const [goalMonths, setGoalMonths] = useState('12');

  const goalResults = useMemo(() => {
    const target = parseFloat(goalAmount) || 0;
    const months = parseInt(goalMonths) || 12;
    const perMonth = Math.round(target / Math.max(1, months));
    const perDay = Math.round(perMonth / 30);
    const perWeek = Math.round(perMonth / 4.3);

    return { perMonth, perDay, perWeek };
  }, [goalAmount, goalMonths]);

  const totalUserBalanceInUZS = useMemo(() => {
    return userAccounts.reduce((sum, a) => {
      return sum + convertCurrency(a.currentBalance, a.currency, 'UZS');
    }, 0);
  }, [userAccounts]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── Top Header Banner with Live Central Bank Ticker ─── */}
      <div className="bg-gradient-to-br from-[#0F1E36] via-[#132238] to-[#0A1527] border border-zen-800/80 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#38BDF8] flex items-center justify-center text-white shadow-glow">
                <Coins size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Калькулятор & Курсы валют
                  </h1>
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Онлайн ЦБ РУз
                  </span>
                </div>
                <p className="text-xs text-zen-300">
                  Прямая синхронизация с Центральным банком Узбекистана и bank.uz
                </p>
              </div>
            </div>
          </div>

          {/* Quick Rate Badges + Live Sync Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['USD', 'EUR', 'RUB'] as const).map((curr) => {
              const info = rates[curr] || { rateToUZS: 0, diff24h: 0, diffPercent: 0 };
              const isPositive = (info.diff24h || 0) >= 0;
              return (
                <div
                  key={curr}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold"
                >
                  <span className="text-slate-400">1 {curr} =</span>
                  <span className="text-white font-extrabold font-mono">
                    {info.rateToUZS.toLocaleString('ru-RU')} сум
                  </span>
                  <span
                    className={`text-[10px] font-black ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? '↑' : '↓'} {Math.abs(info.diffPercent || 0)}%
                  </span>
                </div>
              );
            })}

            {/* Live Refresh Button */}
            <button
              onClick={handleSyncRates}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-black shadow-glow active:scale-95 transition-all disabled:opacity-50"
              title="Обновить курс онлайн прямо сейчас"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Синхронизация...' : 'Обновить'}</span>
            </button>
          </div>
        </div>

        {/* Sync Metadata bar */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Источник: Официальный реестр ЦБ РУз (cbu.uz) • bank.uz</span>
          </div>
          <div>
            Синхронизировано: <span className="text-white font-bold">{lastSyncedTime}</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'CONVERTER', label: '💱 Конвертер валют', icon: ArrowRightLeft },
          { key: 'FINANCE_CALC', label: '🧮 Быстрый калькулятор (НДС)', icon: CalcIcon },
          { key: 'DEPOSIT', label: '📈 Вклады & Сложные %', icon: PiggyBank },
          { key: 'LOAN', label: '🏦 Кредит & Рассрочка', icon: Landmark },
          { key: 'SAVINGS_GOAL', label: '🎯 План накоплений', icon: Target },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                soundFx.playClick();
                setActiveTab(tab.key as TabType);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex-shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-[#0066FF] text-white shadow-glow'
                  : 'bg-white dark:bg-[#131C2E] text-zen-600 dark:text-zen-400 border border-zen-200 dark:border-zen-800 hover:border-[#0066FF]/50'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════ TAB 1: CURRENCY CONVERTER ══════════════ */}
      {activeTab === 'CONVERTER' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Input & Converter Card */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-apple space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-zen-900 dark:text-zen-100">
                    Мгновенная онлайн-конвертация
                  </h3>
                  <p className="text-xs text-zen-400">
                    Введите сумму в любой валюте — расчёт происходит автоматически
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-zen-100 dark:bg-zen-800/60 p-1 rounded-xl">
                  {(['UZS', 'USD', 'EUR', 'RUB', 'GBP', 'AED', 'KZT'] as const).map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        soundFx.playClick();
                        setActiveSourceCurrency(code);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                        activeSourceCurrency === code
                          ? 'bg-[#0066FF] text-white shadow-sm'
                          : 'text-zen-500 hover:text-zen-800 dark:hover:text-zen-200'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zen-500 uppercase tracking-wider">
                  Сумма для конвертации ({activeSourceCurrency})
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={sourceAmount}
                    onChange={(e) => setSourceAmount(e.target.value)}
                    placeholder="100"
                    className="w-full px-5 py-4 rounded-2xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-2xl font-black text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF] transition-all font-mono"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-sm font-extrabold text-zen-400">
                      {rates[activeSourceCurrency]?.name || activeSourceCurrency}
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {(activeSourceCurrency === 'UZS'
                    ? ['100 000', '1 000 000', '5 000 000', '10 000 000', '50 000 000']
                    : ['10', '50', '100', '500', '1000', '5000']
                  ).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        soundFx.playClick();
                        setSourceAmount(preset.replace(/\s/g, ''));
                      }}
                      className="px-3 py-1 rounded-xl bg-zen-100 dark:bg-zen-800/80 hover:bg-zen-200 dark:hover:bg-zen-700 text-xs font-bold text-zen-600 dark:text-zen-300 transition-all active:scale-95"
                    >
                      {preset} {rates[activeSourceCurrency]?.symbol || ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Converted Output Cards Grid (All Major Currencies) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(['UZS', 'USD', 'EUR', 'RUB', 'GBP', 'AED'] as const).map((curr) => {
                  const val = convertedValues[curr];
                  const info = rates[curr] || { name: curr, rateToUZS: 1 };
                  const formatted = formatWithCurrency(val, curr);

                  return (
                    <div
                      key={curr}
                      className={`p-4 rounded-2xl border transition-all relative group ${
                        activeSourceCurrency === curr
                          ? 'bg-blue-500/10 border-[#0066FF]/40'
                          : 'bg-zen-50 dark:bg-[#0c1424] border-zen-200 dark:border-zen-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-extrabold text-zen-400 uppercase tracking-wider">
                          {info.name} ({curr})
                        </span>
                        <button
                          onClick={() => handleCopy(String(Math.round(val * 100) / 100), curr)}
                          className="p-1 rounded-lg text-zen-400 hover:text-[#0066FF] transition-colors"
                          title="Скопировать"
                        >
                          {copiedKey === curr ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>

                      <p className="text-xl font-black text-zen-900 dark:text-zen-100 font-mono tracking-tight">
                        {formatted}
                      </p>

                      <p className="text-[10px] text-zen-400 mt-1">
                        Курс ЦБ: 1 {curr} = {info.rateToUZS.toLocaleString('ru-RU')} сум
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Rates Comparison Table & User Total Capital */}
            <div className="space-y-4">
              {/* Bank.uz and CBU Rates Breakdown Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-apple space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-[#0066FF]" />
                    <h4 className="text-xs font-black uppercase text-zen-800 dark:text-zen-200 tracking-wider">
                      Курсы в банках Узбекистана
                    </h4>
                  </div>
                  <a
                    href="https://bank.uz/currency/dollar-ssha-uz-aqsh-dollari"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#0066FF] hover:underline flex items-center gap-1 font-bold"
                  >
                    bank.uz <ExternalLink size={10} />
                  </a>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  {[
                    { code: 'USD', name: 'Доллар США', info: rates.USD },
                    { code: 'EUR', name: 'Евро', info: rates.EUR },
                    { code: 'RUB', name: 'Рубль', info: rates.RUB },
                  ].map((item) => (
                    <div
                      key={item.code}
                      className="p-3 rounded-2xl bg-zen-50 dark:bg-zen-900/60 border border-zen-200/60 dark:border-zen-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-zen-900 dark:text-zen-100">{item.name} ({item.code})</span>
                        <span className="font-mono text-[#0066FF] font-extrabold">
                          ЦБ: {item.info?.rateToUZS.toLocaleString('ru-RU')} сум
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zen-500 pt-1 border-t border-zen-200/40 dark:border-zen-800">
                        <span>Покупка: <strong className="text-emerald-500 font-mono">{item.info?.bankBuy?.toLocaleString('ru-RU') || '—'} сум</strong></span>
                        <span>Продажа: <strong className="text-blue-500 font-mono">{item.info?.bankSell?.toLocaleString('ru-RU') || '—'} сум</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Net Worth in Converted Currencies */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-[#131C2E] to-[#0F1E36] border border-indigo-500/30 text-white space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Coins size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400">
                      Ваш общий капитал в валюте
                    </span>
                    <h4 className="text-base font-black">Суммарный баланс</h4>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-400">В сумах (UZS)</span>
                    <p className="text-xl font-black text-white font-mono">
                      {totalUserBalanceInUZS.toLocaleString('ru-RU')} сум
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">В долларах (USD)</span>
                    <p className="text-lg font-black text-emerald-400 font-mono">
                      {formatWithCurrency(
                        convertCurrency(totalUserBalanceInUZS, 'UZS', 'USD'),
                        'USD'
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">В евро (EUR)</span>
                    <p className="text-lg font-black text-sky-400 font-mono">
                      {formatWithCurrency(
                        convertCurrency(totalUserBalanceInUZS, 'UZS', 'EUR'),
                        'EUR'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB 2: FINANCIAL CALCULATOR (WITH NDS 12%) ══════════════ */}
      {activeTab === 'FINANCE_CALC' && (
        <div className="max-w-md mx-auto p-6 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-zen-900 dark:text-zen-100 flex items-center gap-2">
              <CalcIcon size={18} className="text-[#0066FF]" />
              Финансовый калькулятор
            </h3>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              НДС 12%
            </span>
          </div>

          {/* Calculator Display */}
          <div className="p-5 rounded-2xl bg-zen-50 dark:bg-zen-950 border border-zen-200 dark:border-zen-800 text-right space-y-1">
            <p className="text-xs text-zen-400 font-mono h-4">
              {calcPrev !== null ? `${calcPrev} ${calcOp || ''}` : ''}
            </p>
            <p className="text-3xl font-black text-zen-900 dark:text-zen-100 font-mono tracking-tight truncate">
              {parseFloat(calcDisplay).toLocaleString('ru-RU') || '0'}
            </p>
          </div>

          {/* Special Business Buttons (НДС 12%) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAddNDS(12)}
              className="py-2.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-[#0066FF] dark:text-[#38BDF8] border border-[#0066FF]/30 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Percent size={13} />
              <span>+12% НДС (Прибавить)</span>
            </button>
            <button
              onClick={() => handleExtractNDS(12)}
              className="py-2.5 px-3 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/30 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Percent size={13} />
              <span>−12% НДС (Вычесть)</span>
            </button>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleCalcClear}
              className="py-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 font-black text-sm transition-all"
            >
              C
            </button>
            <button
              onClick={() => handleCalcOp('÷')}
              className="py-3.5 rounded-2xl bg-zen-100 dark:bg-zen-800 text-[#0066FF] font-black text-lg transition-all"
            >
              ÷
            </button>
            <button
              onClick={() => handleCalcOp('×')}
              className="py-3.5 rounded-2xl bg-zen-100 dark:bg-zen-800 text-[#0066FF] font-black text-lg transition-all"
            >
              ×
            </button>
            <button
              onClick={() => handleCalcOp('−')}
              className="py-3.5 rounded-2xl bg-zen-100 dark:bg-zen-800 text-[#0066FF] font-black text-lg transition-all"
            >
              −
            </button>

            {['7', '8', '9'].map((d) => (
              <button
                key={d}
                onClick={() => handleCalcNumber(d)}
                className="py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-900 hover:bg-zen-100 dark:hover:bg-zen-800 text-zen-900 dark:text-zen-100 font-bold text-base transition-all active:scale-95"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => handleCalcOp('+')}
              className="py-3.5 rounded-2xl bg-zen-100 dark:bg-zen-800 text-[#0066FF] font-black text-lg transition-all"
            >
              +
            </button>

            {['4', '5', '6'].map((d) => (
              <button
                key={d}
                onClick={() => handleCalcNumber(d)}
                className="py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-900 hover:bg-zen-100 dark:hover:bg-zen-800 text-zen-900 dark:text-zen-100 font-bold text-base transition-all active:scale-95"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => handleCalcNumber('000')}
              className="py-3.5 rounded-2xl bg-zen-100 dark:bg-zen-800 text-zen-700 dark:text-zen-300 font-black text-xs transition-all"
            >
              000
            </button>

            {['1', '2', '3'].map((d) => (
              <button
                key={d}
                onClick={() => handleCalcNumber(d)}
                className="py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-900 hover:bg-zen-100 dark:hover:bg-zen-800 text-zen-900 dark:text-zen-100 font-bold text-base transition-all active:scale-95"
              >
                {d}
              </button>
            ))}
            <button
              onClick={handleCalcEqual}
              className="row-span-2 py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-black text-xl shadow-glow transition-all flex items-center justify-center"
            >
              =
            </button>

            <button
              onClick={() => handleCalcNumber('0')}
              className="col-span-2 py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-900 hover:bg-zen-100 dark:hover:bg-zen-800 text-zen-900 dark:text-zen-100 font-bold text-base transition-all"
            >
              0
            </button>
            <button
              onClick={() => handleCalcNumber('.')}
              className="py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-900 hover:bg-zen-100 dark:hover:bg-zen-800 text-zen-900 dark:text-zen-100 font-bold text-base transition-all"
            >
              .
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ TAB 3: DEPOSIT & COMPOUND INTEREST ══════════════ */}
      {activeTab === 'DEPOSIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Inputs */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-apple space-y-4">
            <h3 className="text-base font-extrabold text-zen-900 dark:text-zen-100 flex items-center gap-2">
              <PiggyBank size={18} className="text-emerald-500" />
              Калькулятор вкладов и сложного процента
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zen-500 mb-1">
                  Начальная сумма вклада (сум)
                </label>
                <input
                  type="number"
                  value={depPrincipal}
                  onChange={(e) => setDepPrincipal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zen-500 mb-1">
                  Ежемесячное пополнение (сум)
                </label>
                <input
                  type="number"
                  value={depMonthlyAdd}
                  onChange={(e) => setDepMonthlyAdd(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zen-500 mb-1">
                    Годовая ставка (%)
                  </label>
                  <input
                    type="number"
                    value={depRate}
                    onChange={(e) => setDepRate(e.target.value)}
                    placeholder="22"
                    className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zen-500 mb-1">
                    Срок (месяцев)
                  </label>
                  <input
                    type="number"
                    value={depMonths}
                    onChange={(e) => setDepMonths(e.target.value)}
                    placeholder="12"
                    className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-[#131C2E] to-[#0A1527] border border-emerald-500/30 text-white space-y-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400">
                Результат сложного процента
              </span>
              <h4 className="text-xs text-slate-400">Итоговый капитал через {depMonths} мес.</h4>
              <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
                {depositResults.finalBalance.toLocaleString('ru-RU')} сум
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <div className="p-3 rounded-2xl bg-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400">Ваши вложения</span>
                <p className="text-base font-extrabold text-white">
                  {depositResults.totalInvested.toLocaleString('ru-RU')} сум
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                <span className="text-[10px] text-emerald-400 font-bold">Чистая прибыль (%)</span>
                <p className="text-base font-black text-emerald-300">
                  +{depositResults.totalInterest.toLocaleString('ru-RU')} сум
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              💡 Средний пассивный доход в месяц составит ~{depositResults.monthlyProfitAvg.toLocaleString('ru-RU')} сум.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════ TAB 4: LOAN CALCULATOR ══════════════ */}
      {activeTab === 'LOAN' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-apple space-y-4">
            <h3 className="text-base font-extrabold text-zen-900 dark:text-zen-100 flex items-center gap-2">
              <Landmark size={18} className="text-blue-500" />
              Калькулятор кредита и рассрочки
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zen-500 mb-1">
                  Сумма кредита / покупки (сум)
                </label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zen-500 mb-1">
                    Ставка банка (% годовых)
                  </label>
                  <input
                    type="number"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zen-500 mb-1">
                    Срок займа (мес)
                  </label>
                  <input
                    type="number"
                    value={loanMonths}
                    onChange={(e) => setLoanMonths(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/60 via-[#131C2E] to-[#0A1527] border border-blue-500/30 text-white space-y-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400">
                Аннуитетный расчёт
              </span>
              <h4 className="text-xs text-slate-400">Ежемесячный платёж</h4>
              <p className="text-3xl font-black text-blue-400 font-mono mt-1">
                {loanResults.monthlyPayment.toLocaleString('ru-RU')} сум / мес
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <div className="p-3 rounded-2xl bg-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400">Всего выплат банку</span>
                <p className="text-base font-extrabold text-white">
                  {loanResults.totalPayment.toLocaleString('ru-RU')} сум
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-0.5">
                <span className="text-[10px] text-rose-400 font-bold">Переплата (проценты)</span>
                <p className="text-base font-black text-rose-300">
                  {loanResults.overpayment.toLocaleString('ru-RU')} сум
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB 5: SAVINGS GOAL PLANNER ══════════════ */}
      {activeTab === 'SAVINGS_GOAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-apple space-y-4">
            <h3 className="text-base font-extrabold text-zen-900 dark:text-zen-100 flex items-center gap-2">
              <Target size={18} className="text-amber-500" />
              План достижения финансовой цели
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zen-500 mb-1">
                  Стоимость цели (сум)
                </label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zen-500 mb-1">
                  Желаемый срок (месяцев)
                </label>
                <input
                  type="number"
                  value={goalMonths}
                  onChange={(e) => setGoalMonths(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:border-[#0066FF] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/60 via-[#131C2E] to-[#0A1527] border border-amber-500/30 text-white space-y-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400">
                Необходимый темп накоплений
              </span>
              <h4 className="text-xs text-slate-400">Сколько откладывать в месяц</h4>
              <p className="text-3xl font-black text-amber-400 font-mono mt-1">
                {goalResults.perMonth.toLocaleString('ru-RU')} сум / мес
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <div className="p-3 rounded-2xl bg-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400">В неделю</span>
                <p className="text-base font-extrabold text-white">
                  ~{goalResults.perWeek.toLocaleString('ru-RU')} сум
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400">В день</span>
                <p className="text-base font-extrabold text-white">
                  ~{goalResults.perDay.toLocaleString('ru-RU')} сум
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

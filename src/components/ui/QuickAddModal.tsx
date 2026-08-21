'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  CheckSquare,
  X,
  ChevronLeft,
  Check,
  Loader2,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '@/components/ui/LanguageProvider';
import { soundFx } from '@/lib/soundEffects';
import { addTransaction, getQuickAddDataAction } from '@/app/actions/financeActions';
import { createTask } from '@/app/actions/taskActions';
import { TransactionType, TaskPriority } from '@prisma/client';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

type ActionMode = 'SELECT' | 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'TASK';

interface AccountOption {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
}

interface CategoryOption {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<ActionMode>('SELECT');
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedTargetAccountId, setSelectedTargetAccountId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  // Task State
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);

  // Status message
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load user accounts & categories on modal open
  useEffect(() => {
    if (open) {
      setMode('SELECT');
      setAmount('');
      setComment('');
      setTaskTitle('');
      setErrorMsg('');

      setLoadingData(true);
      getQuickAddDataAction()
        .then((res) => {
          setAccounts(res.accounts || []);
          setCategories(res.categories || []);
          if (res.accounts && res.accounts.length > 0) {
            setSelectedAccountId(res.accounts[0].id);
            if (res.accounts.length > 1) {
              setSelectedTargetAccountId(res.accounts[1].id);
            }
          }
        })
        .catch((err) => console.error('QuickAdd load error:', err))
        .finally(() => setLoadingData(false));
    }
  }, [open]);

  if (!open) return null;

  const handleSelectMode = (newMode: ActionMode) => {
    soundFx.playModalOpen();
    setMode(newMode);
    setErrorMsg('');

    // Pre-select relevant category
    if (newMode === 'EXPENSE') {
      const expCat = categories.find((c) => c.type === 'EXPENSE');
      if (expCat) setSelectedCategoryId(expCat.id);
    } else if (newMode === 'INCOME') {
      const incCat = categories.find((c) => c.type === 'INCOME');
      if (incCat) setSelectedCategoryId(incCat.id);
    }
  };

  const handleAddThousands = (num: number) => {
    soundFx.playClick();
    const current = parseFloat(amount.replace(/\s/g, '')) || 0;
    setAmount(String(current + num));
  };

  const handleSubmitFinance = () => {
    const numAmount = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      soundFx.playError();
      setErrorMsg('Укажите корректную сумму');
      return;
    }

    if (!selectedAccountId) {
      soundFx.playError();
      setErrorMsg('Выберите счёт');
      return;
    }

    if (mode === 'TRANSFER' && selectedAccountId === selectedTargetAccountId) {
      soundFx.playError();
      setErrorMsg('Счёт отправления и назначения должны различаться');
      return;
    }

    let txType: TransactionType = TransactionType.EXPENSE;
    if (mode === 'INCOME') txType = TransactionType.INCOME;
    if (mode === 'TRANSFER') txType = TransactionType.TRANSFER;

    startTransition(async () => {
      try {
        if (mode === 'INCOME') soundFx.playIncomeSound();
        else soundFx.playExpenseSound();

        await addTransaction({
          type: txType,
          amount: numAmount,
          accountId: selectedAccountId,
          categoryId: mode !== 'TRANSFER' ? selectedCategoryId || undefined : undefined,
          targetAccountId: mode === 'TRANSFER' ? selectedTargetAccountId || undefined : undefined,
          comment: comment.trim() || undefined,
        });

        router.refresh();
        onClose();
      } catch (err: unknown) {
        soundFx.playError();
        const msg = err instanceof Error ? err.message : 'Ошибка создания записи';
        setErrorMsg(msg);
      }
    });
  };

  const handleSubmitTask = () => {
    if (!taskTitle.trim()) {
      soundFx.playError();
      setErrorMsg('Введите название задачи');
      return;
    }

    startTransition(async () => {
      try {
        soundFx.playIncomeSound();
        await createTask({
          title: taskTitle.trim(),
          priority: taskPriority,
          description: comment.trim() || undefined,
        });

        router.refresh();
        onClose();
      } catch (err: unknown) {
        soundFx.playError();
        const msg = err instanceof Error ? err.message : 'Ошибка создания задачи';
        setErrorMsg(msg);
      }
    });
  };

  const formattedPreview = () => {
    const num = parseFloat(amount.replace(/\s/g, ''));
    if (isNaN(num) || num <= 0) return null;
    return new Intl.NumberFormat('ru-RU').format(num) + ' сум';
  };

  const filteredCategories = categories.filter((c) =>
    mode === 'EXPENSE' ? c.type === 'EXPENSE' : c.type === 'INCOME'
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      onClick={() => {
        soundFx.playModalClose();
        onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#131C2E] rounded-3xl p-5 sm:p-6 w-full max-w-lg border border-zen-200 dark:border-zen-800/80 shadow-2xl animate-in zoom-in-95 duration-150 my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {mode !== 'SELECT' && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setMode('SELECT');
                }}
                className="p-1.5 rounded-xl bg-zen-100 dark:bg-zen-800 text-zen-600 dark:text-zen-300 hover:text-zen-900 transition-colors"
                title="Назад"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h3 className="text-base sm:text-lg font-black text-zen-900 dark:text-zen-100">
              {mode === 'SELECT' && t('quick_add_title')}
              {mode === 'EXPENSE' && 'Новый расход'}
              {mode === 'INCOME' && 'Новый доход'}
              {mode === 'TRANSFER' && 'Новый перевод'}
              {mode === 'TASK' && 'Новая задача'}
            </h3>
          </div>

          <button
            onClick={() => {
              soundFx.playModalClose();
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zen-400 hover:text-zen-600 dark:hover:text-zen-200 bg-zen-100 dark:bg-zen-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* ─── 1. SELECTION GRID ─── */}
        {mode === 'SELECT' && (
          <div className="space-y-4">
            <p className="text-xs text-zen-400 mb-2">{t('quick_add_subtitle')}</p>
            <div className="grid grid-cols-2 gap-3">
              {/* + Расход */}
              <button
                type="button"
                onClick={() => handleSelectMode('EXPENSE')}
                className="p-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-sm shadow-glow transition-all active:scale-95 flex flex-col items-center justify-center gap-2 min-h-[76px]"
              >
                <TrendingDown size={22} />
                <span>{t('quick_add_expense')}</span>
              </button>

              {/* + Доход */}
              <button
                type="button"
                onClick={() => handleSelectMode('INCOME')}
                className="p-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-sm shadow-glow-green transition-all active:scale-95 flex flex-col items-center justify-center gap-2 min-h-[76px]"
              >
                <TrendingUp size={22} />
                <span>{t('quick_add_income')}</span>
              </button>

              {/* ↔ Перевод */}
              <button
                type="button"
                onClick={() => handleSelectMode('TRANSFER')}
                className="p-4 rounded-2xl bg-zen-100 dark:bg-zen-800 text-zen-800 dark:text-zen-100 font-extrabold text-sm hover:bg-zen-200 dark:hover:bg-zen-700 transition-all active:scale-95 flex flex-col items-center justify-center gap-2 min-h-[76px] border border-zen-200 dark:border-zen-700/60"
              >
                <ArrowLeftRight size={22} className="text-[#0066FF]" />
                <span>{t('quick_add_transfer')}</span>
              </button>

              {/* ✓ Задача */}
              <button
                type="button"
                onClick={() => handleSelectMode('TASK')}
                className="p-4 rounded-2xl bg-violet-600/15 text-violet-400 border border-violet-500/30 font-extrabold text-sm hover:bg-violet-600/25 transition-all active:scale-95 flex flex-col items-center justify-center gap-2 min-h-[76px]"
              >
                <CheckSquare size={22} />
                <span>{t('quick_add_task')}</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── 2. FORM VIEW (FINANCE: EXPENSE / INCOME / TRANSFER) ─── */}
        {(mode === 'EXPENSE' || mode === 'INCOME' || mode === 'TRANSFER') && (
          <div className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-zen-100 dark:bg-zen-900 p-1 border border-zen-200 dark:border-zen-800">
              <button
                type="button"
                onClick={() => handleSelectMode('EXPENSE')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  mode === 'EXPENSE' ? 'bg-[#0066FF] text-white shadow-glow' : 'text-zen-400 hover:text-zen-200'
                }`}
              >
                − Расход
              </button>
              <button
                type="button"
                onClick={() => handleSelectMode('INCOME')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  mode === 'INCOME' ? 'bg-[#10B981] text-white shadow-glow-green' : 'text-zen-400 hover:text-zen-200'
                }`}
              >
                + Доход
              </button>
              <button
                type="button"
                onClick={() => handleSelectMode('TRANSFER')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  mode === 'TRANSFER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zen-400 hover:text-zen-200'
                }`}
              >
                ↔ Перевод
              </button>
            </div>

            {/* Amount Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-zen-400 uppercase tracking-wider">Сумма (сум)</label>
                {formattedPreview() && (
                  <span className="text-xs font-extrabold text-[#0066FF] font-mono">{formattedPreview()}</span>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-xl font-mono font-black text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              />

              {/* Quick Multipliers */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleAddThousands(1000)}
                  className="py-1.5 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-zen-200 text-zen-700 dark:text-zen-200 text-xs font-bold transition-all active:scale-95"
                >
                  +1 000
                </button>
                <button
                  type="button"
                  onClick={() => handleAddThousands(10000)}
                  className="py-1.5 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-zen-200 text-zen-700 dark:text-zen-200 text-xs font-bold transition-all active:scale-95"
                >
                  +10 000
                </button>
                <button
                  type="button"
                  onClick={() => handleAddThousands(100000)}
                  className="py-1.5 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-zen-200 text-zen-700 dark:text-zen-200 text-xs font-bold transition-all active:scale-95"
                >
                  +100 000
                </button>
              </div>
            </div>

            {/* Account Selector */}
            <div>
              <label className="text-[11px] font-bold text-zen-400 uppercase tracking-wider mb-1 block">
                {mode === 'TRANSFER' ? 'Со счёта' : 'Счёт'}
              </label>
              {loadingData ? (
                <div className="py-2 text-xs text-zen-400 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Загрузка счетов...
                </div>
              ) : (
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currentBalance.toLocaleString('ru-RU')} сум)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Account (For Transfer) */}
            {mode === 'TRANSFER' && (
              <div>
                <label className="text-[11px] font-bold text-zen-400 uppercase tracking-wider mb-1 block">На счёт</label>
                <select
                  value={selectedTargetAccountId}
                  onChange={(e) => setSelectedTargetAccountId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currentBalance.toLocaleString('ru-RU')} сум)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Selector (For Expense / Income) */}
            {mode !== 'TRANSFER' && filteredCategories.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-zen-400 uppercase tracking-wider mb-1 block">Категория</label>
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                  {filteredCategories.slice(0, 10).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        selectedCategoryId === cat.id
                          ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-sm'
                          : 'bg-zen-50 dark:bg-zen-900 text-zen-700 dark:text-zen-300 border-zen-200 dark:border-zen-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="text-[11px] font-bold text-zen-400 uppercase tracking-wider mb-1 block">
                Комментарий (опционально)
              </label>
              <input
                type="text"
                placeholder="Заметки или описание..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-xs text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmitFinance}
              disabled={isPending}
              className={`w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-glow active:scale-95 flex items-center justify-center gap-2 ${
                mode === 'EXPENSE'
                  ? 'bg-[#0066FF] hover:bg-[#0052CC]'
                  : mode === 'INCOME'
                  ? 'bg-[#10B981] hover:bg-[#059669]'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50 min-h-[48px]`}
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Сохранить {mode === 'EXPENSE' ? 'расход' : mode === 'INCOME' ? 'доход' : 'перевод'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── 3. FORM VIEW (TASK) ─── */}
        {mode === 'TASK' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-zen-400 uppercase tracking-wider mb-1 block">
                Название задачи *
              </label>
              <input
                type="text"
                placeholder="Например: Оплатить счета, Купить продукты..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-sm font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-bold text-zen-400 uppercase tracking-wider mb-1.5 block">Приоритет</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTaskPriority(TaskPriority.LOW)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    taskPriority === TaskPriority.LOW
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm'
                      : 'bg-zen-50 dark:bg-zen-900 text-zen-400 border-zen-200 dark:border-zen-800'
                  }`}
                >
                  Низкий
                </button>
                <button
                  type="button"
                  onClick={() => setTaskPriority(TaskPriority.MEDIUM)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    taskPriority === TaskPriority.MEDIUM
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                      : 'bg-zen-50 dark:bg-zen-900 text-zen-400 border-zen-200 dark:border-zen-800'
                  }`}
                >
                  Средний
                </button>
                <button
                  type="button"
                  onClick={() => setTaskPriority(TaskPriority.HIGH)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    taskPriority === TaskPriority.HIGH
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm'
                      : 'bg-zen-50 dark:bg-zen-900 text-zen-400 border-zen-200 dark:border-zen-800'
                  }`}
                >
                  Высокий
                </button>
              </div>
            </div>

            {/* Task Description / Notes */}
            <div>
              <label className="text-[11px] font-bold text-zen-400 uppercase tracking-wider mb-1 block">
                Заметки к задаче (опционально)
              </label>
              <input
                type="text"
                placeholder="Дополнительные детали..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-800 text-xs text-zen-900 dark:text-zen-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmitTask}
              disabled={isPending}
              className="w-full py-3.5 rounded-2xl font-black text-sm bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-glow flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 min-h-[48px]"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Создание...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Создать задачу</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

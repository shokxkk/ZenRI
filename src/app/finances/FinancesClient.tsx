'use client';

import React, { useState, useTransition } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Wallet, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { addTransaction, createAccount, updateTransaction, deleteTransaction } from '@/app/actions/financeActions';
import { UtilityBillWidget } from '@/components/ui/UtilityBillWidget';
import { AccountBrandLogo } from '@/components/ui/AccountBrandLogo';
import { soundFx } from '@/lib/soundEffects';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  UZCARD: 'Uzcard',
  HUMO: 'Humo',
  VISA: 'Visa',
  MASTERCARD: 'MasterCard',
  CASH: 'Наличные',
  SAVINGS: 'Накопительный',
  BANK: 'Банковский счёт',
  PAYME: 'Payme',
  CLICK: 'Click',
  BUSINESS: 'Бизнес',
  OTHER: 'Другое',
};

const ACCOUNT_TYPES_GRID = [
  { type: 'UZCARD', label: 'Uzcard' },
  { type: 'HUMO', label: 'Humo' },
  { type: 'VISA', label: 'Visa' },
  { type: 'MASTERCARD', label: 'MasterCard' },
  { type: 'CASH', label: 'Наличные' },
  { type: 'SAVINGS', label: 'Накопительный' },
  { type: 'BANK', label: 'Банковский счёт' },
  { type: 'PAYME', label: 'Payme' },
  { type: 'CLICK', label: 'Click' },
];

function formatMoney(value: string | number) {
  return Number(value).toLocaleString('ru-RU');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

interface FinancesClientProps {
  accounts: {
    id: string; name: string; type: string; currentBalance: string;
    currency: string; icon: string; includeInTotal: boolean;
  }[];
  transactions: {
    id: string; type: string; amount: string; date: string; comment: string | null;
    category: { id?: string; name: string; color: string | null } | null;
    account: { name: string; type: string };
    targetAccount: { name: string } | null;
  }[];
  categories: { id: string; name: string; type: string; color: string | null }[];
}

type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export function FinancesClient({ accounts, transactions, categories }: FinancesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalType, setModalType] = useState<TxType | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);

  // Edit / Delete State
  const [editingTx, setEditingTx] = useState<{ id: string; amount: string; categoryId: string; comment: string } | null>(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [comment, setComment] = useState('');

  // Account Form
  const [acctName, setAcctName] = useState('');
  const [acctType, setAcctType] = useState('UZCARD');
  const [acctBalance, setAcctBalance] = useState('0');

  const totalBalance = accounts
    .filter((a) => a.includeInTotal)
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const filteredCategories = categories.filter((c) =>
    modalType === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'
  );

  const resetForm = () => {
    setAmount('');
    setAccountId(accounts[0]?.id || '');
    setTargetAccountId('');
    setCategoryId('');
    setComment('');
  };

  const handleAddTx = () => {
    if (!amount || Number(amount) <= 0) return;
    if (modalType === 'INCOME') {
      soundFx.playIncomeSound();
    } else {
      soundFx.playExpenseSound();
    }
    startTransition(async () => {
      await addTransaction({
        type: modalType!,
        amount: Number(amount),
        accountId,
        categoryId: categoryId || undefined,
        targetAccountId: targetAccountId || undefined,
        comment: comment || undefined,
      });
      resetForm();
      setModalType(null);
      router.refresh();
    });
  };

  const handleUpdateTx = () => {
    if (!editingTx || !editingTx.amount) return;
    startTransition(async () => {
      await updateTransaction(editingTx.id, {
        amount: Number(editingTx.amount),
        categoryId: editingTx.categoryId || undefined,
        comment: editingTx.comment || undefined,
      });
      setEditingTx(null);
      router.refresh();
    });
  };

  const handleDeleteTx = (id: string) => {
    if (!confirm('Удалить эту транзакцию?')) return;
    startTransition(async () => {
      await deleteTransaction(id);
      router.refresh();
    });
  };

  const handleCreateAccount = () => {
    if (!acctName) return;
    startTransition(async () => {
      await createAccount({ name: acctName, type: acctType, initialBalance: Number(acctBalance) });
      setAcctName('');
      setAcctBalance('0');
      setShowNewAccount(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">Финансы</h1>
          <p className="text-xs text-zen-400 mt-0.5">Управление счетами, картами и переводами</p>
        </div>
        <button
          onClick={() => setShowNewAccount(true)}
          className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} /> Добавить счёт
        </button>
      </div>

      {/* Hero Total Balance Card */}
      <div className="bg-gradient-to-br from-[#0F1E36] via-[#122442] to-[#0A1527] rounded-card p-6 text-white border border-zen-800 shadow-2xl space-y-6 card-hover">
        <div>
          <span className="text-xs font-semibold text-zen-400 uppercase tracking-widest">Общий баланс</span>
          <p className="text-4xl font-extrabold mt-1 tracking-tight">
            {formatMoney(totalBalance)} <span className="text-xl font-normal text-zen-400">сум</span>
          </p>
        </div>

        <div className="flex items-center gap-6 pt-2 border-t border-zen-800/80">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-income flex items-center gap-1">
              +{formatMoney(totalIncome)}
            </span>
            <span className="text-[10px] text-zen-400">сум (доходы)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-expense flex items-center gap-1">
              −{formatMoney(totalExpense)}
            </span>
            <span className="text-[10px] text-zen-400">сум (расходы)</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { resetForm(); setModalType('EXPENSE'); }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs shadow-glow transition-all hover:scale-105 active:scale-95"
          >
            <ArrowDownRight size={16} />
            <span>Расход</span>
          </button>
          <button
            onClick={() => { resetForm(); setModalType('INCOME'); }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs shadow-glow-green transition-all hover:scale-105 active:scale-95"
          >
            <ArrowUpRight size={16} />
            <span>Доход</span>
          </button>
          <button
            onClick={() => { resetForm(); setModalType('TRANSFER'); }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-zen-800 hover:bg-zen-700 text-zen-100 font-semibold text-xs border border-zen-700 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeftRight size={16} />
            <span>Перевод</span>
          </button>
        </div>
      </div>

      {/* Utility Bills & Tax Accounts Manager */}
      <UtilityBillWidget userAccounts={accounts} />

      {/* Accounts Grid with Custom Brand Logos */}
      <div>
        <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-3 flex items-center gap-2">
          <Wallet size={16} className="text-[#0066FF]" />
          Счета и Карты ({accounts.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {accounts.map((acct) => (
            <div
              key={acct.id}
              className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-4 shadow-apple card-hover flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <AccountBrandLogo type={acct.type} size="md" />
                  <div>
                    <p className="text-xs font-bold text-zen-900 dark:text-zen-100">{acct.name}</p>
                    <p className="text-[10px] text-zen-400 font-medium">
                      {ACCOUNT_TYPE_LABELS[acct.type] || acct.type}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xl font-extrabold text-zen-900 dark:text-zen-100">
                  {formatMoney(acct.currentBalance)} <span className="text-xs font-normal text-zen-400">сум</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions History with Full Edit / Delete Support */}
      <div>
        <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-3">История операций</h2>
        <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card shadow-apple overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-zen-400 text-sm">Операций пока нет</div>
          ) : (
            <div className="divide-y divide-zen-100 dark:divide-zen-800/60">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-zen-50 dark:hover:bg-[#1E293B]/60 transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={clsx(
                        'w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0',
                        tx.type === 'INCOME'
                          ? 'bg-income-light text-income'
                          : tx.type === 'EXPENSE'
                          ? 'bg-expense-light text-expense'
                          : 'bg-[#0066FF]/15 text-[#0066FF]'
                      )}
                    >
                      {tx.type === 'INCOME' && <ArrowUpRight size={18} />}
                      {tx.type === 'EXPENSE' && <ArrowDownRight size={18} />}
                      {tx.type === 'TRANSFER' && <ArrowLeftRight size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zen-900 dark:text-zen-100">
                        {tx.category?.name || (tx.type === 'TRANSFER' ? `Перевод на ${tx.targetAccount?.name}` : 'Без категории')}
                      </p>
                      <p className="text-[10px] text-zen-400">
                        {formatDate(tx.date)} • {tx.account.name}
                        {tx.comment && ` • ${tx.comment}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        'text-sm font-bold',
                        tx.type === 'INCOME' ? 'text-income' : tx.type === 'EXPENSE' ? 'text-expense' : 'text-[#0066FF]'
                      )}
                    >
                      {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '−' : ''}
                      {formatMoney(tx.amount)} сум
                    </span>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          setEditingTx({
                            id: tx.id,
                            amount: tx.amount,
                            categoryId: tx.category?.id || '',
                            comment: tx.comment || '',
                          })
                        }
                        className="p-1.5 rounded-lg text-zen-400 hover:text-[#0066FF] hover:bg-zen-100 dark:hover:bg-zen-800 transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        className="p-1.5 rounded-lg text-zen-400 hover:text-expense hover:bg-expense-light dark:hover:bg-expense-dark transition-colors"
                        title="Удалить транзакцию"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      <Modal
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        title="Редактировать транзакцию"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">
              Сумма (сум)
            </label>
            <input
              type="number"
              value={editingTx?.amount || ''}
              onChange={(e) => setEditingTx((prev) => (prev ? { ...prev, amount: e.target.value } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">
              Категория
            </label>
            <select
              value={editingTx?.categoryId || ''}
              onChange={(e) => setEditingTx((prev) => (prev ? { ...prev, categoryId: e.target.value } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
            >
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">
              Комментарий
            </label>
            <input
              type="text"
              value={editingTx?.comment || ''}
              onChange={(e) => setEditingTx((prev) => (prev ? { ...prev, comment: e.target.value } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
            />
          </div>
          <button
            onClick={handleUpdateTx}
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50"
          >
            {isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        open={!!modalType}
        onClose={() => { setModalType(null); resetForm(); }}
        title={modalType === 'INCOME' ? 'Добавить доход' : modalType === 'EXPENSE' ? 'Добавить расход' : 'Перевод между счетами'}
      >
        <div className="space-y-4">
          {modalType === 'TRANSFER' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zen-50 dark:bg-zen-800 rounded-2xl border border-zen-200 dark:border-zen-700">
                  <span className="text-[10px] text-zen-400 font-semibold uppercase">Откуда</span>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none mt-1"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-zen-50 dark:bg-zen-800 rounded-2xl border border-zen-200 dark:border-zen-700">
                  <span className="text-[10px] text-zen-400 font-semibold uppercase">Куда</span>
                  <select
                    value={targetAccountId}
                    onChange={(e) => setTargetAccountId(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none mt-1"
                  >
                    <option value="">Выберите...</option>
                    {accounts.filter((a) => a.id !== accountId).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Сумма перевода (сум)</label>
                <input
                  type="number" min="0" placeholder="500 000"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-lg font-bold text-center focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
                />
              </div>

              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                  Комиссия 0 сум
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Сумма (сум)</label>
                <input
                  type="number" min="0" placeholder="0"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-base font-bold focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Счёт</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100">
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {formatMoney(a.currentBalance)} сум</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Категория</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100">
                  <option value="">Без категории</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Комментарий</label>
            <input type="text" placeholder="Заметка..."
              value={comment} onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>

          <button
            onClick={handleAddTx} disabled={isPending || !amount}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50"
          >
            {isPending ? 'Сохранение...' : modalType === 'TRANSFER' ? 'Перевести' : 'Сохранить'}
          </button>
        </div>
      </Modal>

      {/* New Account Modal with Visual Brand Badges Selector */}
      <Modal open={showNewAccount} onClose={() => setShowNewAccount(false)} title="Новый счёт / Карта">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Название счёта *</label>
            <input type="text" placeholder="Например: Моя Uzcard или Карта Humo"
              value={acctName} onChange={(e) => setAcctName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-2">Тип платежного средства / Карта</label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES_GRID.map((item) => {
                const isSelected = acctType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setAcctType(item.type);
                      if (!acctName || ACCOUNT_TYPES_GRID.some(g => g.label === acctName)) {
                        setAcctName(item.label);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#0066FF]/15 border-[#0066FF] ring-1 ring-[#0066FF]'
                        : 'bg-zen-50 dark:bg-zen-900/60 border-zen-200 dark:border-zen-800 hover:border-zen-400'
                    }`}
                  >
                    <AccountBrandLogo type={item.type} size="sm" />
                    <span className="text-[11px] font-bold text-zen-900 dark:text-zen-100 truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Начальный баланс (сум)</label>
            <input type="number" min="0" placeholder="0"
              value={acctBalance} onChange={(e) => setAcctBalance(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
            />
          </div>

          <button
            onClick={handleCreateAccount} disabled={isPending || !acctName}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50"
          >
            {isPending ? 'Создание...' : 'Создать счёт'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

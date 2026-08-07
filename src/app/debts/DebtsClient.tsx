'use client';

import React, { useState, useTransition } from 'react';
import { Plus, HandCoins, Calendar, Phone, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { createDebt, addDebtPayment } from '@/app/actions/debtActions';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

function formatMoney(v: string | number) { return Number(v).toLocaleString('ru-RU'); }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }); }

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'warning', PARTIALLY_PAID: 'info' as never, OVERDUE: 'danger', CLOSED: 'success',
};
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Активен', PARTIALLY_PAID: 'Частично', OVERDUE: 'Просрочен', CLOSED: 'Закрыт' };

type Payment = { id: string; amount: string; date: string; comment: string | null };
type Debt = {
  id: string; personName: string; phone: string | null; type: string;
  originalAmount: string; remainingAmount: string; currency: string;
  dueDate: string | null; comment: string | null; status: string;
  payments: Payment[];
};

export function DebtsClient({ debts }: { debts: Debt[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [payDebtId, setPayDebtId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Create form
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'I_OWE' | 'THEY_OWE_ME'>('THEY_OWE_ME');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [comment, setComment] = useState('');

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payComment, setPayComment] = useState('');

  const iOwe = debts.filter((d) => d.type === 'I_OWE');
  const theyOwe = debts.filter((d) => d.type === 'THEY_OWE_ME');

  const totalOwedToMe = theyOwe.filter((d) => d.status !== 'CLOSED')
    .reduce((s, d) => s + Number(d.remainingAmount), 0);
  const totalIOwe = iOwe.filter((d) => d.status !== 'CLOSED')
    .reduce((s, d) => s + Number(d.remainingAmount), 0);

  const handleCreate = () => {
    if (!personName || !amount) return;
    startTransition(async () => {
      await createDebt({ personName, phone: phone || undefined, type: type as never, originalAmount: Number(amount), dueDate: dueDate || undefined, comment: comment || undefined });
      setPersonName(''); setPhone(''); setAmount(''); setDueDate(''); setComment('');
      setShowCreate(false);
      router.refresh();
    });
  };

  const handlePayment = () => {
    if (!payDebtId || !payAmount) return;
    startTransition(async () => {
      await addDebtPayment(payDebtId, Number(payAmount), payComment || undefined);
      setPayAmount(''); setPayComment('');
      setPayDebtId(null);
      router.refresh();
    });
  };

  const DebtCard = ({ debt }: { debt: Debt }) => {
    const paidAmount = Number(debt.originalAmount) - Number(debt.remainingAmount);
    return (
      <div className={clsx('bg-white dark:bg-zen-900 border rounded-2xl shadow-apple overflow-hidden', debt.status === 'CLOSED' ? 'border-income/30 dark:border-income/20 opacity-70' : 'border-zen-200 dark:border-zen-800')}>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zen-900 dark:text-zen-100">{debt.personName}</span>
                <Badge variant={STATUS_VARIANT[debt.status] as never}>{STATUS_LABELS[debt.status]}</Badge>
              </div>
              {debt.phone && <p className="text-xs text-zen-400 mt-0.5 flex items-center gap-1"><Phone size={10} />{debt.phone}</p>}
              {debt.comment && <p className="text-xs text-zen-500 mt-1">{debt.comment}</p>}
            </div>
            <div className="text-right">
              <p className={clsx('text-lg font-bold', debt.type === 'THEY_OWE_ME' ? 'text-income' : 'text-expense')}>
                {formatMoney(debt.remainingAmount)}
              </p>
              <p className="text-[10px] text-zen-400">{debt.currency} осталось</p>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar value={paidAmount} max={Number(debt.originalAmount)} color={debt.type === 'THEY_OWE_ME' ? 'income' : 'expense'} showLabel label={`Выплачено: ${formatMoney(paidAmount)} из ${formatMoney(debt.originalAmount)}`} />
          </div>
          {debt.dueDate && (
            <p className="flex items-center gap-1 text-xs text-zen-400 mt-2"><Calendar size={11} />до {formatDate(debt.dueDate)}</p>
          )}
          <div className="flex gap-2 mt-3">
            {debt.status !== 'CLOSED' && (
              <button onClick={() => setPayDebtId(debt.id)}
                className="flex-1 py-2 rounded-xl bg-accent-light dark:bg-accent-dark/30 text-accent text-xs font-medium hover:opacity-90 transition-all">
                + Оплата
              </button>
            )}
            {debt.payments.length > 0 && (
              <button onClick={() => setExpanded(expanded === debt.id ? null : debt.id)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zen-100 dark:bg-zen-800 text-zen-600 dark:text-zen-400 text-xs font-medium hover:opacity-90">
                История <ChevronDown size={12} className={expanded === debt.id ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            )}
          </div>
        </div>
        {expanded === debt.id && (
          <div className="border-t border-zen-100 dark:border-zen-800 px-4 pb-3 pt-2 space-y-1.5">
            {debt.payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-xs">
                <span className="text-zen-500">{formatDate(p.date)} {p.comment && `• ${p.comment}`}</span>
                <span className="font-semibold text-income">+{formatMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">Долги</h1>
          <p className="text-xs text-zen-500 mt-0.5">{debts.filter((d) => d.status !== 'CLOSED').length} активных</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium shadow-sm transition-all">
          <Plus size={16} /> Добавить
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-income-light dark:bg-income-dark/20 border border-income/20 rounded-2xl p-4">
          <p className="text-xs text-income font-medium flex items-center gap-1"><HandCoins size={12} />Мне должны</p>
          <p className="text-xl font-bold text-income mt-1">{formatMoney(totalOwedToMe)} <span className="text-xs">UZS</span></p>
        </div>
        <div className="bg-expense-light dark:bg-expense-dark/20 border border-expense/20 rounded-2xl p-4">
          <p className="text-xs text-expense font-medium">Я должен</p>
          <p className="text-xl font-bold text-expense mt-1">{formatMoney(totalIOwe)} <span className="text-xs">UZS</span></p>
        </div>
      </div>

      {theyOwe.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zen-900 dark:text-zen-100 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-income inline-block" />Мне должны
          </h2>
          <div className="space-y-3">{theyOwe.map((d) => <DebtCard key={d.id} debt={d} />)}</div>
        </div>
      )}

      {iOwe.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zen-900 dark:text-zen-100 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-expense inline-block" />Я должен
          </h2>
          <div className="space-y-3">{iOwe.map((d) => <DebtCard key={d.id} debt={d} />)}</div>
        </div>
      )}

      {debts.length === 0 && (
        <div className="text-center py-12 text-zen-400 text-sm">Долгов нет 🎉</div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Новый долг">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['THEY_OWE_ME', 'I_OWE'] as const).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={clsx('py-2.5 rounded-xl text-sm font-medium transition-all', type === t ? (t === 'THEY_OWE_ME' ? 'bg-income text-white' : 'bg-expense text-white') : 'bg-zen-100 dark:bg-zen-800 text-zen-600 dark:text-zen-400')}>
                {t === 'THEY_OWE_ME' ? 'Мне должны' : 'Я должен'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Имя *</label>
            <input type="text" placeholder="Имя человека" value={personName} onChange={(e) => setPersonName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Сумма (UZS) *</label>
              <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Телефон</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Срок возврата</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Комментарий</label>
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <button onClick={handleCreate} disabled={isPending || !personName || !amount}
            className="w-full py-3.5 rounded-xl font-medium text-sm text-white bg-accent hover:bg-accent-hover transition-all disabled:opacity-50">
            {isPending ? 'Сохранение...' : 'Создать'}
          </button>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!payDebtId} onClose={() => { setPayDebtId(null); setPayAmount(''); setPayComment(''); }} title="Добавить оплату">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Сумма (UZS)</label>
            <input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Комментарий</label>
            <input type="text" value={payComment} onChange={(e) => setPayComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <button onClick={handlePayment} disabled={isPending || !payAmount}
            className="w-full py-3.5 rounded-xl font-medium text-sm text-white bg-income hover:opacity-90 transition-all disabled:opacity-50">
            {isPending ? 'Сохранение...' : 'Зафиксировать оплату'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

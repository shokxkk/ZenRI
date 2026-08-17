'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Flame, Droplets, Trash2, Building2, Landmark, Plus, CheckCircle2, Edit2, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { addTransaction } from '@/app/actions/financeActions';
import { useRouter } from 'next/navigation';

export type UtilityItem = {
  id: string;
  name: string;
  type: 'ELECTRICITY' | 'GAS' | 'WATER' | 'GARBAGE' | 'TAX' | 'COMMUNAL';
  accountNumber: string;
  balance: number;
  dueDate: string;
};

const TYPE_CONFIG = {
  ELECTRICITY: { label: 'Электричество', icon: Zap,       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  defaultName: 'Электричество (РЭС)',         defaultDue: 'до 10-го' },
  GAS:         { label: 'Газ',           icon: Flame,     color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   defaultName: 'Природный газ (Райгаз)',      defaultDue: 'до 15-го' },
  WATER:       { label: 'Вода',          icon: Droplets,  color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',   defaultName: 'Водоканал (Сувсоз)',          defaultDue: 'до 10-го' },
  GARBAGE:     { label: 'Мусор',         icon: Trash2,    color: '#10B981', bg: 'rgba(16,185,129,0.12)',  defaultName: 'Вывоз мусора (Махсустранс)', defaultDue: 'до 25-го' },
  COMMUNAL:    { label: 'ЖКХ',           icon: Building2, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', defaultName: 'Квартплата / ТЧСЖ',          defaultDue: 'до 5-го'  },
  TAX:         { label: 'Налоги',        icon: Landmark,  color: '#0066FF', bg: 'rgba(0,102,255,0.12)',   defaultName: 'Налоговая служба (ИНН)',      defaultDue: 'до 1 окт' },
} as const;

const DEFAULT_BILLS: UtilityItem[] = [
  { id: '1', name: 'Электричество', type: 'ELECTRICITY', accountNumber: 'Л/С 20491823', balance: -140000, dueDate: 'до 10-го' },
  { id: '2', name: 'Газ',           type: 'GAS',         accountNumber: 'Л/С 84920482', balance: 45000,   dueDate: 'до 15-го' },
  { id: '3', name: 'Вода',          type: 'WATER',       accountNumber: 'Л/С 1029485',  balance: -65000,  dueDate: 'до 10-го' },
  { id: '4', name: 'Вывоз мусора',  type: 'GARBAGE',     accountNumber: 'Л/С 4920194',  balance: -18000,  dueDate: 'до 25-го' },
  { id: '5', name: 'Налоги (ИНН)',  type: 'TAX',         accountNumber: 'ИНН 302948194',balance: 0,       dueDate: 'до 1 окт'  },
  { id: '6', name: 'Квартплата',    type: 'COMMUNAL',    accountNumber: 'Договор 1204928', balance: -120000, dueDate: 'до 5-го' },
];

function fmt(val: number) {
  return Math.abs(val).toLocaleString('ru-RU');
}

// ── Inline Payment Form ──────────────────────────────────────────────────────
function PayRow({
  item,
  userAccounts,
  onDone,
}: {
  item: UtilityItem;
  userAccounts: { id: string; name: string; currentBalance: string }[];
  onDone: (paidAmount: number, accountId: string) => void;
}) {
  const [amount, setAmount] = useState(String(Math.abs(item.balance)));
  const [accountId, setAccountId] = useState(userAccounts[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    setBusy(true);
    onDone(n, accountId);
  };

  return (
    <div style={{ background: 'rgba(0,102,255,0.06)', borderTop: '1px solid rgba(0,102,255,0.15)' }} className="px-4 pb-4 pt-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Сумма"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
        />
        {userAccounts.length > 0 && (
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
          >
            {userAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>
      <button
        onClick={submit}
        disabled={busy || !amount}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
        style={{ background: busy ? '#444' : '#0066FF' }}
      >
        {busy ? 'Оплачиваем...' : 'Подтвердить оплату'}
      </button>
    </div>
  );
}

// ── Utility Card ─────────────────────────────────────────────────────────────
function UtilityCard({
  item,
  userAccounts,
  onEdit,
  onDelete,
  onPaid,
}: {
  item: UtilityItem;
  userAccounts: { id: string; name: string; currentBalance: string }[];
  onEdit: () => void;
  onDelete: () => void;
  onPaid: (amount: number, accountId: string) => void;
}) {
  const [paying, setPaying] = useState(false);
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.COMMUNAL;
  const Icon = cfg.icon;
  const hasDebt = item.balance < 0;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'var(--card-bg, rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Card body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Row 1: icon + name + actions */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: cfg.bg }}
          >
            <Icon size={17} color={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zen-900 dark:text-white truncate leading-tight">{item.name}</p>
            <p className="text-[11px] text-zen-400 truncate font-mono">{item.accountNumber}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-zen-400 hover:text-zen-700 dark:hover:text-zen-200 hover:bg-zen-100 dark:hover:bg-zen-800 transition-colors"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-zen-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Row 2: balance + due + pay button */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p
              className="text-base font-extrabold leading-tight"
              style={{ color: hasDebt ? '#EF4444' : '#10B981' }}
            >
              {hasDebt ? `−${fmt(item.balance)}` : item.balance === 0 ? '0' : `+${fmt(item.balance)}`}
              <span className="text-[11px] font-semibold ml-1 opacity-70">сум</span>
            </p>
            <p className="text-[11px] text-zen-400 mt-0.5">{item.dueDate}</p>
          </div>

          {hasDebt ? (
            <button
              onClick={() => setPaying(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: paying ? '#374151' : '#0066FF' }}
            >
              {paying ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {paying ? 'Скрыть' : 'Оплатить'}
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold" style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)' }}>
              <CheckCircle2 size={12} />
              Оплачено
            </span>
          )}
        </div>
      </div>

      {/* Inline payment form (no modal) */}
      {paying && hasDebt && (
        <PayRow
          item={item}
          userAccounts={userAccounts}
          onDone={(amount, accountId) => {
            onPaid(amount, accountId);
            setPaying(false);
          }}
        />
      )}
    </div>
  );
}

// ── Edit Panel (inline, below header) ────────────────────────────────────────
function EditPanel({
  item,
  onSave,
  onDelete,
  onClose,
}: {
  item: UtilityItem;
  onSave: (updated: UtilityItem) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<UtilityItem>({ ...item });

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ border: '1px solid rgba(0,102,255,0.3)', background: 'rgba(0,102,255,0.05)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-zen-900 dark:text-white">Редактировать</p>
        <button onClick={onClose} className="p-1 rounded-lg text-zen-400 hover:text-zen-700 dark:hover:text-zen-200 transition-colors">
          <X size={15} />
        </button>
      </div>

      <input
        type="text"
        value={draft.name}
        onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
        placeholder="Название"
        className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF] w-full"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={draft.accountNumber}
          onChange={e => setDraft(d => ({ ...d, accountNumber: e.target.value }))}
          placeholder="Л/С или Договор"
          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
        />
        <input
          type="text"
          value={draft.dueDate}
          onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value }))}
          placeholder="Срок оплаты"
          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
        />
      </div>

      <input
        type="number"
        inputMode="numeric"
        value={draft.balance}
        onChange={e => setDraft(d => ({ ...d, balance: Number(e.target.value) }))}
        placeholder="Баланс (минус = долг)"
        className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF] w-full"
      />

      <div className="flex gap-2">
        <button
          onClick={onDelete}
          className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
          style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)' }}
        >
          <Trash2 size={13} /> Удалить
        </button>
        <button
          onClick={() => onSave(draft)}
          className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: '#0066FF' }}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}

// ── Add Form ─────────────────────────────────────────────────────────────────
function AddForm({ onAdd, onClose }: { onAdd: (item: UtilityItem) => void; onClose: () => void }) {
  const [type, setType] = useState<UtilityItem['type']>('ELECTRICITY');
  const [name, setName] = useState<string>(TYPE_CONFIG.ELECTRICITY.defaultName);
  const [accountNo, setAccountNo] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [dueDate, setDueDate] = useState<string>(TYPE_CONFIG.ELECTRICITY.defaultDue);

  const pickType = (t: UtilityItem['type']) => {
    setType(t);
    setName(TYPE_CONFIG[t].defaultName);
    setDueDate(TYPE_CONFIG[t].defaultDue);
  };

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      id: String(Date.now()),
      name: name.trim(),
      type,
      accountNumber: accountNo.trim() || 'Л/С не указан',
      balance: Number(balance) || 0,
      dueDate: dueDate.trim() || 'до 10-го',
    });
    onClose();
  };

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ border: '1px solid rgba(0,102,255,0.25)', background: 'rgba(0,102,255,0.04)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-zen-900 dark:text-white">Новый счёт</p>
        <button onClick={onClose} className="p-1 rounded-lg text-zen-400 hover:text-zen-700 dark:hover:text-zen-200 transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Type picker */}
      <div className="grid grid-cols-3 gap-1.5">
        {(Object.keys(TYPE_CONFIG) as UtilityItem['type'][]).map(t => {
          const cfg = TYPE_CONFIG[t];
          const Icon = cfg.icon;
          const sel = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => pickType(t)}
              className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[11px] font-bold transition-all"
              style={{
                border: `1.5px solid ${sel ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                background: sel ? cfg.bg : 'rgba(255,255,255,0.03)',
                color: sel ? cfg.color : '#9CA3AF',
              }}
            >
              <Icon size={16} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Fields */}
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Название"
        className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF] w-full"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={accountNo}
          onChange={e => setAccountNo(e.target.value)}
          placeholder="Номер Л/С"
          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
        />
        <input
          type="text"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          placeholder="Срок"
          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
        />
      </div>

      <input
        type="number"
        inputMode="numeric"
        value={balance}
        onChange={e => setBalance(e.target.value)}
        placeholder="Баланс (минус = долг)"
        className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF] w-full"
      />

      <button
        onClick={submit}
        disabled={!name.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
        style={{ background: '#0066FF' }}
      >
        Создать счёт
      </button>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────
export const UtilityBillWidget: React.FC<{
  userAccounts?: { id: string; name: string; currentBalance: string }[];
}> = ({ userAccounts = [] }) => {
  const router = useRouter();
  const [utilities, setUtilities] = useState<UtilityItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('zenri_utility_bills');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUtilities(parsed);
          setLoaded(true);
          return;
        }
      }
    } catch {}
    setUtilities(DEFAULT_BILLS);
    localStorage.setItem('zenri_utility_bills', JSON.stringify(DEFAULT_BILLS));
    setLoaded(true);
  }, []);

  const save = useCallback((items: UtilityItem[]) => {
    setUtilities(items);
    localStorage.setItem('zenri_utility_bills', JSON.stringify(items));
  }, []);

  const handlePaid = useCallback(async (item: UtilityItem, amount: number, accountId: string) => {
    // Update local balance immediately (optimistic)
    const updated = utilities.map(u =>
      u.id === item.id ? { ...u, balance: u.balance + amount } : u
    );
    save(updated);

    // Send to backend
    try {
      if (accountId) {
        await addTransaction({
          type: 'EXPENSE',
          amount,
          accountId,
          comment: `Оплата: ${item.name} (${item.accountNumber})`,
        });
        router.refresh();
      }
    } catch (e) {
      console.error('Payment error:', e);
    }
  }, [utilities, save, router]);

  const handleSaveEdit = useCallback((updated: UtilityItem) => {
    save(utilities.map(u => u.id === updated.id ? updated : u));
    setEditingId(null);
  }, [utilities, save]);

  const handleDelete = useCallback((id: string) => {
    save(utilities.filter(u => u.id !== id));
    setEditingId(null);
  }, [utilities, save]);

  const handleAdd = useCallback((item: UtilityItem) => {
    save([...utilities, item]);
    setShowAdd(false);
  }, [utilities, save]);

  const totalDebt = utilities.filter(u => u.balance < 0).reduce((s, u) => s + Math.abs(u.balance), 0);

  if (!loaded) return null;

  return (
    <div className="bg-white dark:bg-[#111827] border border-zen-200 dark:border-zen-800/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,102,255,0.12)' }}>
            <Building2 size={16} color="#0066FF" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-zen-900 dark:text-white leading-tight">Коммуналка</h2>
            {totalDebt > 0 && (
              <p className="text-[11px] font-semibold" style={{ color: '#EF4444' }}>
                Долг: {fmt(totalDebt)} сум
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setEditingId(null); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex-shrink-0"
          style={{ background: showAdd ? '#374151' : '#0066FF' }}
        >
          {showAdd ? <X size={13} /> : <Plus size={13} />}
          {showAdd ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {/* Add Form (inline) */}
      {showAdd && <AddForm onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {/* Empty state */}
      {utilities.length === 0 && !showAdd && (
        <div className="text-center py-8">
          <Building2 size={32} className="mx-auto mb-2 opacity-30 text-zen-400" />
          <p className="text-sm font-semibold text-zen-500 dark:text-zen-400">Нет счетов. Нажмите «Добавить»</p>
        </div>
      )}

      {/* Cards grid */}
      {utilities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {utilities.map(item => (
            <div key={item.id} className="flex flex-col gap-2">
              <UtilityCard
                item={item}
                userAccounts={userAccounts}
                onEdit={() => setEditingId(id => id === item.id ? null : item.id)}
                onDelete={() => handleDelete(item.id)}
                onPaid={(amount, accountId) => handlePaid(item, amount, accountId)}
              />
              {editingId === item.id && (
                <EditPanel
                  item={item}
                  onSave={handleSaveEdit}
                  onDelete={() => handleDelete(item.id)}
                  onClose={() => setEditingId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Flame,
  Droplets,
  Trash2,
  Building2,
  Landmark,
  Plus,
  CheckCircle2,
  Edit2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { addTransaction } from '@/app/actions/financeActions';
import { useRouter } from 'next/navigation';

export type UtilityItem = {
  id: string;
  name: string;
  type: 'ELECTRICITY' | 'GAS' | 'WATER' | 'GARBAGE' | 'TAX' | 'COMMUNAL';
  accountNumber: string;
  balance: number;
  dueDate: string;
  iconName: string;
};

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ELECTRICITY: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/15' },
  GAS: { icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/15' },
  WATER: { icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-500/15' },
  GARBAGE: { icon: Trash2, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
  TAX: { icon: Landmark, color: 'text-[#0066FF]', bg: 'bg-[#0066FF]/15' },
  COMMUNAL: { icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/15' },
};

function formatMoney(val: number) {
  return Math.abs(val).toLocaleString('ru-RU');
}

export const UtilityBillWidget: React.FC<{
  userAccounts?: { id: string; name: string; currentBalance: string }[];
}> = ({ userAccounts = [] }) => {
  const router = useRouter();
  const [utilities, setUtilities] = useState<UtilityItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [payingItem, setPayingItem] = useState<UtilityItem | null>(null);
  const [editingItem, setEditingItem] = useState<UtilityItem | null>(null);

  // Form State
  const [payAmount, setPayAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(userAccounts[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Custom State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<UtilityItem['type']>('ELECTRICITY');
  const [newAccountNo, setNewAccountNo] = useState('');
  const [newBalance, setNewBalance] = useState('0');

  useEffect(() => {
    const stored = localStorage.getItem('zenri_utility_bills');
    if (stored) {
      try {
        setUtilities(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
    setLoaded(true);
  }, []);

  const saveUtilities = (items: UtilityItem[]) => {
    setUtilities(items);
    localStorage.setItem('zenri_utility_bills', JSON.stringify(items));
  };

  const handlePaySubmit = async () => {
    if (!payingItem || !payAmount || Number(payAmount) <= 0) return;
    setIsSubmitting(true);
    try {
      if (selectedAccountId) {
        await addTransaction({
          type: 'EXPENSE',
          amount: Number(payAmount),
          accountId: selectedAccountId,
          comment: `Оплата коммунальных: ${payingItem.name} (${payingItem.accountNumber})`,
        });
      }

      // Update utility balance locally
      const updated = utilities.map((u) => {
        if (u.id === payingItem.id) {
          return { ...u, balance: u.balance + Number(payAmount) };
        }
        return u;
      });
      saveUtilities(updated);

      setPayingItem(null);
      setPayAmount('');
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    const updated = utilities.map((u) => (u.id === editingItem.id ? editingItem : u));
    saveUtilities(updated);
    setEditingItem(null);
  };

  const handleAddSubmit = () => {
    if (!newName) return;
    const newItem: UtilityItem = {
      id: String(Date.now()),
      name: newName,
      type: newType,
      accountNumber: newAccountNo ? `Л/С ${newAccountNo}` : 'Л/С не указан',
      balance: Number(newBalance),
      dueDate: 'до 10-го числа',
      iconName: newType,
    };
    saveUtilities([...utilities, newItem]);
    setNewName('');
    setNewAccountNo('');
    setNewBalance('0');
    setShowAddModal(false);
  };

  const totalDebt = utilities
    .filter((u) => u.balance < 0)
    .reduce((sum, u) => sum + Math.abs(u.balance), 0);

  if (!loaded) return null;

  return (
    <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-6 shadow-apple space-y-5 card-hover relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#10B981] flex items-center justify-center text-white shadow-glow">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zen-900 dark:text-zen-100 flex items-center gap-2">
              Коммуналка и Налоги
              <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] text-[10px] font-extrabold">
                Лицевые счета
              </span>
            </h2>
            <p className="text-xs text-zen-400 mt-0.5">Учёт лицевых счетов, задолженностей и оплата в 1 клик</p>
          </div>
        </div>

        {/* Total Debt Summary & Add Button */}
        <div className="flex items-center gap-3">
          {totalDebt > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-extrabold">
              <ShieldAlert size={14} />
              <span>Задолженность: {formatMoney(totalDebt)} сум</span>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} /> Счёт
          </button>
        </div>
      </div>

      {/* Grid of Utility Cards or Empty State */}
      {utilities.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl bg-zen-50 dark:bg-zen-900/40 border border-dashed border-zen-200 dark:border-zen-800">
          <Building2 size={32} className="mx-auto text-zen-400 mb-2 opacity-50" />
          <p className="text-sm font-bold text-zen-900 dark:text-zen-100">Нет лицевых счетов</p>
          <p className="text-xs text-zen-400 mt-1 max-w-sm mx-auto">
            Добавьте ваши лицевые счета (Электричество, Газ, Вода, Мусор, Налоги), чтобы отслеживать задолженности и оплачивать в 1 клик.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow"
          >
            + Добавить коммунальный счёт
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {utilities.map((item) => {
            const style = TYPE_ICONS[item.type] || TYPE_ICONS.COMMUNAL;
            const Icon = style.icon;
            const hasDebt = item.balance < 0;

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-zen-50 dark:bg-zen-900/60 border border-zen-200/60 dark:border-zen-800 flex flex-col justify-between space-y-3 transition-all hover:border-[#0066FF]/40 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${style.bg} ${style.color} flex items-center justify-center font-bold flex-shrink-0`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zen-900 dark:text-zen-100">{item.name}</h3>
                      <p className="text-[10px] text-zen-400 font-mono mt-0.5">{item.accountNumber}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 rounded-lg text-zen-400 hover:text-[#0066FF] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Редактировать счет"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                <div className="flex items-end justify-between pt-2 border-t border-zen-200/50 dark:border-zen-800/60">
                  <div>
                    <span className="text-[10px] text-zen-400 block">{item.dueDate}</span>
                    <p className={`text-sm font-extrabold ${hasDebt ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {hasDebt ? `−${formatMoney(item.balance)} сум` : `+${formatMoney(item.balance)} сум`}
                    </p>
                  </div>

                  {hasDebt ? (
                    <button
                      onClick={() => {
                        setPayingItem(item);
                        setPayAmount(String(Math.abs(item.balance)));
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all active:scale-95"
                    >
                      <span>Оплатить</span>
                      <ArrowRight size={13} />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                      <CheckCircle2 size={14} /> Оплачено
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Utility Modal */}
      <Modal
        open={!!payingItem}
        onClose={() => setPayingItem(null)}
        title={`Оплата: ${payingItem?.name || ''}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-zen-50 dark:bg-zen-800/80 rounded-2xl border border-zen-200 dark:border-zen-700">
            <span className="text-[10px] text-zen-400 font-semibold uppercase">Лицевой счёт</span>
            <p className="text-sm font-bold text-zen-900 dark:text-zen-100 mt-0.5">{payingItem?.accountNumber}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Сумма к оплате (сум)</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-lg font-bold text-center text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          {userAccounts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Списать со счёта</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              >
                {userAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {Number(a.currentBalance).toLocaleString('ru-RU')} сум
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePaySubmit}
            disabled={isSubmitting || !payAmount}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Проведение платежа...' : 'Подтвердить оплату'}
          </button>
        </div>
      </Modal>

      {/* Edit Utility Account Modal */}
      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Редактировать лицевой счёт"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Название услуги</label>
            <input
              type="text"
              value={editingItem?.name || ''}
              onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Номер договора / Л/С</label>
            <input
              type="text"
              value={editingItem?.accountNumber || ''}
              onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, accountNumber: e.target.value } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Текущий баланс (отрицательный = долг)</label>
            <input
              type="number"
              value={editingItem?.balance || 0}
              onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, balance: Number(e.target.value) } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <button
            onClick={handleUpdateItem}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all"
          >
            Сохранить изменения
          </button>
        </div>
      </Modal>

      {/* Add New Utility Contract Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Новый коммунальный счёт">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Название услуги *</label>
            <input
              type="text"
              placeholder="Например: Газ Ташкент"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Тип коммунальной услуги</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as UtilityItem['type'])}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            >
              <option value="ELECTRICITY">⚡️ Электричество</option>
              <option value="GAS">🔥 Природный газ</option>
              <option value="WATER">💧 Водоснабжение</option>
              <option value="GARBAGE">🗑️ Вывоз мусора</option>
              <option value="TAX">🏛️ Налоговая служба (ИНН)</option>
              <option value="COMMUNAL">🏢 ЖКХ / ТЧСЖ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Номер лицевого счёта / Договора</label>
            <input
              type="text"
              placeholder="Например: 20491823"
              value={newAccountNo}
              onChange={(e) => setNewAccountNo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Начальный баланс (отрицательный = долг)</label>
            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <button
            onClick={handleAddSubmit}
            disabled={!newName}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50"
          >
            Создать лицевой счёт
          </button>
        </div>
      </Modal>
    </div>
  );
};

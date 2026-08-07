'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Gift,
  Plus,
  Zap,
  Edit2,
  Trash2,
  Smartphone,
  Car,
  Plane,
  Laptop,
  Heart,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';

export type WishItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  iconName: string;
  category: string;
};

const WISH_ICONS: Record<string, React.ElementType> = {
  Smartphone,
  Plane,
  Laptop,
  Car,
  Gift,
  Heart,
};

function formatMoney(val: number) {
  return val.toLocaleString('ru-RU');
}

export const WishlistWidget: React.FC<{
  monthlyNetSavings?: number;
}> = ({ monthlyNetSavings = 0 }) => {
  const router = useRouter();
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fundingItem, setFundingItem] = useState<WishItem | null>(null);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);

  // Form State
  const [addFundAmount, setAddFundAmount] = useState('');

  // New Wish State
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCurrent, setNewCurrent] = useState('0');
  const [newIcon, setNewIcon] = useState('Gift');

  useEffect(() => {
    const stored = localStorage.getItem('zenri_wishlist_items');
    if (stored) {
      try {
        setWishes(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
    setLoaded(true);
  }, []);

  const saveWishes = (items: WishItem[]) => {
    setWishes(items);
    localStorage.setItem('zenri_wishlist_items', JSON.stringify(items));
  };

  const handleAddFund = () => {
    if (!fundingItem || !addFundAmount || Number(addFundAmount) <= 0) return;
    const updated = wishes.map((w) => {
      if (w.id === fundingItem.id) {
        return { ...w, currentAmount: w.currentAmount + Number(addFundAmount) };
      }
      return w;
    });
    saveWishes(updated);
    setFundingItem(null);
    setAddFundAmount('');
    router.refresh();
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    const updated = wishes.map((w) => (w.id === editingItem.id ? editingItem : w));
    saveWishes(updated);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (!confirm('Удалить эту хотелку?')) return;
    const updated = wishes.filter((w) => w.id !== id);
    saveWishes(updated);
  };

  const handleCreateWish = () => {
    if (!newName || !newTarget) return;
    const newItem: WishItem = {
      id: String(Date.now()),
      name: newName,
      targetAmount: Number(newTarget),
      currentAmount: Number(newCurrent) || 0,
      iconName: newIcon,
      category: 'Мечты',
    };
    saveWishes([...wishes, newItem]);
    setNewName('');
    setNewTarget('');
    setNewCurrent('0');
    setShowAddModal(false);
  };

  if (!loaded) return null;

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-card p-6 text-slate-800 dark:text-white border border-slate-200/90 dark:border-slate-800 shadow-apple relative overflow-hidden space-y-5 card-hover">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#EC4899]/10 blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#EC4899] to-[#8B5CF6] flex items-center justify-center text-white shadow-glow">
            <Gift size={18} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zen-900 dark:text-zen-100 flex items-center gap-2">
              Хотелки (Wishlist)
              <span className="px-2.5 py-0.5 rounded-full bg-[#EC4899]/15 text-[#EC4899] text-[10px] font-extrabold flex items-center gap-1">
                <Sparkles size={11} /> AI Predict Score
              </span>
            </h2>
            <p className="text-xs text-zen-400 mt-0.5">Умный скоринг и расчёт сроков достижения ваших целей</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] hover:opacity-90 text-white text-xs font-bold shadow-glow transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} /> Хотелка
        </button>
      </div>

      {/* Wishes Grid or Empty State */}
      {wishes.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-zen-50 dark:bg-zen-900/40 border border-dashed border-zen-200 dark:border-zen-800">
          <Gift size={32} className="mx-auto text-zen-400 mb-2 opacity-50" />
          <p className="text-sm font-bold text-zen-900 dark:text-zen-100">Список хотeлок пуст</p>
          <p className="text-xs text-zen-400 mt-1 max-w-sm mx-auto">
            Добавьте свою первую цель или мечту (например: Автомобиль, Телефон, Путешествие), чтобы AI рассчитал сроки достижения.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white text-xs font-bold shadow-glow"
          >
            + Добавить первую хотелку
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {wishes.map((item) => {
            const Icon = WISH_ICONS[item.iconName] || Gift;
            const pct = Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100));
            const remaining = Math.max(0, item.targetAmount - item.currentAmount);

            const savings = monthlyNetSavings > 0 ? monthlyNetSavings : 1000000;
            const monthsNeeded = remaining > 0 ? (remaining / savings).toFixed(1) : '0';
            const isAchievableSoon = Number(monthsNeeded) <= 3;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-zen-50 dark:bg-zen-900/60 border border-zen-200/60 dark:border-zen-800 flex flex-col justify-between space-y-4 hover:border-[#EC4899]/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#EC4899]/20 to-[#8B5CF6]/20 text-[#EC4899] flex items-center justify-center font-bold flex-shrink-0">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zen-900 dark:text-zen-100">{item.name}</h3>
                      <p className="text-xs text-zen-400 font-semibold mt-0.5">
                        {formatMoney(item.currentAmount)} / <span className="text-zen-900 dark:text-white font-extrabold">{formatMoney(item.targetAmount)} сум</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 text-zen-400 hover:text-[#0066FF]"
                      title="Редактировать"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-zen-400 hover:text-rose-500"
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1 font-bold">
                    <span className="text-[#EC4899]">{pct}% накоплено</span>
                    <span className="text-zen-400">Осталось: {formatMoney(remaining)} сум</span>
                  </div>
                  <div className="w-full bg-zen-200 dark:bg-zen-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* AI Predict Score Badge */}
                <div className="p-3 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/25 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Zap size={14} className="text-[#00C2FF] flex-shrink-0 animate-pulse" />
                    <span className="text-zen-900 dark:text-zen-100 font-bold">
                      {pct >= 100 ? (
                        <span className="text-emerald-500 font-extrabold">🎉 Готово к покупке!</span>
                      ) : (
                        <>
                          AI Score:{' '}
                          <strong className="text-[#00C2FF]">
                            {isAchievableSoon ? '🎯 95% Достижимо' : '⏳ В процессе'} за {monthsNeeded} мес.
                          </strong>
                        </>
                      )}
                    </span>
                  </div>

                  {pct < 100 && (
                    <button
                      onClick={() => setFundingItem(item)}
                      className="px-2.5 py-1 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-[11px] font-bold shadow-glow transition-all active:scale-95"
                    >
                      + Пополнить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fund Wish Modal */}
      <Modal open={!!fundingItem} onClose={() => setFundingItem(null)} title={`Пополнить: ${fundingItem?.name}`}>
        <div className="space-y-4">
          <p className="text-xs text-zen-400">
            Добавьте накопленную сумму в копилку цели <strong>«{fundingItem?.name}»</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Сумма пополнения (сум)</label>
            <input
              type="number"
              placeholder="500 000"
              value={addFundAmount}
              onChange={(e) => setAddFundAmount(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-lg font-bold text-center text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#EC4899]"
            />
          </div>

          <button
            onClick={handleAddFund}
            disabled={!addFundAmount}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] shadow-glow transition-all disabled:opacity-50"
          >
            Пополнить копилку
          </button>
        </div>
      </Modal>

      {/* Edit Wish Modal */}
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Редактировать хотелку">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Название мечты</label>
            <input
              type="text"
              value={editingItem?.name || ''}
              onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Целевая стоимость (сум)</label>
            <input
              type="number"
              value={editingItem?.targetAmount || 0}
              onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, targetAmount: Number(e.target.value) } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <button
            onClick={handleUpdateItem}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] shadow-glow transition-all"
          >
            Сохранить изменения
          </button>
        </div>
      </Modal>

      {/* Add New Wish Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Новая хотелка / Мечта">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Название хотелки *</label>
            <input
              type="text"
              placeholder="Например: Игровой ПК или Часы"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Целевая стоимость (сум) *</label>
            <input
              type="number"
              placeholder="15 000 000"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Иконка</label>
            <select
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm font-bold text-zen-900 dark:text-zen-100"
            >
              <option value="Smartphone">📱 Смартфон / Техника</option>
              <option value="Laptop">💻 Ноутбук / ПК</option>
              <option value="Plane">✈️ Путешествие / Отпуск</option>
              <option value="Car">🚗 Автомобиль / Транспорт</option>
              <option value="Gift">🎁 Подарок / Мечта</option>
              <option value="Heart">❤️ Другое</option>
            </select>
          </div>
          <button
            onClick={handleCreateWish}
            disabled={!newName || !newTarget}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] shadow-glow transition-all disabled:opacity-50"
          >
            Создать хотелку
          </button>
        </div>
      </Modal>
    </div>
  );
};

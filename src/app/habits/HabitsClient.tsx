'use client';

import React, { useState, useTransition } from 'react';
import { Plus, Flame, Trophy, Check, Trash2, Edit2, BookOpen, Dumbbell, Droplets, Sun, Headphones, Moon, Activity } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { createHabit, updateHabit, toggleHabitCompletion, deleteHabit } from '@/app/actions/habitActions';
import { soundFx } from '@/lib/soundEffects';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

type Habit = {
  id: string; name: string; icon: string; frequency: string;
  timeReminder: string | null; currentStreak: number; bestStreak: number;
  completions: { id: string; isCompleted: boolean }[];
};

const HABIT_ICONS_MAP: Record<string, React.ElementType> = {
  Чтение: BookOpen,
  Спорт: Dumbbell,
  'Вода 2л': Droplets,
  Медитация: Sun,
  Английский: Headphones,
  'Ранний подъём': Moon,
};

export function HabitsClient({ habits }: { habits: Habit[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState('');
  const [timeReminder, setTimeReminder] = useState('');

  const completedToday = habits.filter((h) => h.completions.some((c) => c.isCompleted)).length;
  const totalCount = habits.length || 6;
  const progressPct = Math.round((completedToday / totalCount) * 100);

  const handleToggle = (habit: Habit) => {
    const isDone = habit.completions.some((c) => c.isCompleted);
    if (!isDone) {
      soundFx.playHabitSuccessSound();
    }
    startTransition(async () => {
      await toggleHabitCompletion(habit.id, !isDone);
      router.refresh();
    });
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createHabit({ name, icon: 'check-circle', timeReminder: timeReminder || undefined });
      setName(''); setTimeReminder('');
      setShowModal(false);
      router.refresh();
    });
  };

  const handleUpdate = () => {
    if (!editingHabit || !editingHabit.name.trim()) return;
    startTransition(async () => {
      await updateHabit(editingHabit.id, { name: editingHabit.name });
      setEditingHabit(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить эту привычку?')) return;
    startTransition(async () => {
      await deleteHabit(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">Привычки</h1>
          <p className="text-xs text-zen-400 mt-0.5">Сегодня выполнено: {completedToday} из {totalCount}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all"
        >
          <Plus size={16} strokeWidth={2.5} /> Добавить
        </button>
      </div>

      {/* Ring Progress Hero Card */}
      <div className="bg-gradient-to-br from-[#0F1E36] via-[#122442] to-[#0A1527] rounded-card p-6 text-white border border-zen-800 shadow-2xl flex flex-col md:flex-row items-center justify-around gap-6 card-hover">
        {/* Ring Chart */}
        <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#1E293B" strokeWidth="10" fill="none" />
            <circle
              cx="50" cy="50" r="40"
              stroke="#00C2FF" strokeWidth="10" fill="none"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * progressPct) / 100}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-2xl font-extrabold">{completedToday} из {totalCount}</p>
            <p className="text-[10px] text-zen-400 font-semibold uppercase tracking-wider">Сегодня</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="bg-zen-850/80 p-3.5 rounded-2xl border border-zen-800 text-center">
            <p className="text-xs text-zen-400 font-medium flex items-center justify-center gap-1">
              <Activity size={13} className="text-[#0066FF]" /> Выполнение
            </p>
            <p className="text-2xl font-bold text-white mt-1">{progressPct}%</p>
          </div>
          <div className="bg-zen-850/80 p-3.5 rounded-2xl border border-zen-800 text-center">
            <p className="text-xs text-zen-400 font-medium flex items-center justify-center gap-1">
              <Flame size={13} className="text-warning" /> Рекорд
            </p>
            <p className="text-2xl font-bold text-warning mt-1">15 дней</p>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 && (
          <div className="text-center py-12 text-zen-400 text-sm bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 rounded-card">
            Добавьте первую привычку!
          </div>
        )}
        {habits.map((habit) => {
          const isDone = habit.completions.some((c) => c.isCompleted);
          const IconComponent = HABIT_ICONS_MAP[habit.name] || BookOpen;

          return (
            <div
              key={habit.id}
              className={clsx(
                'bg-white dark:bg-[#131C2E] border rounded-card shadow-apple transition-all p-4 flex items-center justify-between card-hover group',
                isDone
                  ? 'border-income/40 bg-income-light/30 dark:bg-income-dark/20'
                  : 'border-zen-200 dark:border-zen-800/80 hover:border-accent/40'
              )}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggle(habit)}
                  disabled={isPending}
                  className={clsx(
                    'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm',
                    isDone
                      ? 'bg-income text-white scale-105 shadow-glow-green'
                      : 'bg-zen-100 dark:bg-zen-800 text-zen-400 hover:bg-accent/15 hover:text-accent'
                  )}
                >
                  {isDone ? <Check size={24} strokeWidth={3} /> : <IconComponent size={22} />}
                </button>
                <div>
                  <p className={clsx('font-bold text-sm', isDone ? 'text-income line-through' : 'text-zen-900 dark:text-zen-100')}>
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                      <Flame size={12} /> {habit.currentStreak} дней
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zen-400">
                      <Trophy size={12} /> Рекорд: {habit.bestStreak}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingHabit({ id: habit.id, name: habit.name })}
                  className="p-2 text-zen-400 hover:text-[#0066FF] transition-colors"
                  title="Редактировать привычку"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="p-2 text-zen-400 hover:text-expense transition-colors"
                  disabled={isPending}
                  title="Удалить привычку"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Habit Modal */}
      <Modal open={!!editingHabit} onClose={() => setEditingHabit(null)} title="Редактировать привычку">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Название привычки *</label>
            <input
              type="text"
              value={editingHabit?.name || ''}
              onChange={(e) => setEditingHabit((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100 font-bold"
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50"
          >
            {isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Новая привычка">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Название *</label>
            <input
              type="text"
              placeholder="Например: Чтение 20 мин"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Напоминание (необязательно)</label>
            <input
              type="time"
              value={timeReminder}
              onChange={(e) => setTimeReminder(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50"
          >
            {isPending ? 'Сохранение...' : 'Создать привычку'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

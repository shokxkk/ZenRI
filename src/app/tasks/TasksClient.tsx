'use client';

import React, { useState, useTransition } from 'react';
import { Plus, CheckSquare2, Square, Trash2, Edit2, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { createTask, updateTask, updateTaskStatus, deleteTask } from '@/app/actions/taskActions';
import { soundFx } from '@/lib/soundEffects';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

type Task = {
  id: string; title: string; description: string | null;
  priority: string; status: string; dueDate: string | null; dueTime: string | null;
  categoryName: string | null;
  subtasks: { id: string; title: string; isCompleted: boolean }[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function isOverdue(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date() && new Date(iso).toDateString() !== new Date().toDateString();
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  Платеж: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  Работа: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  Личное: 'bg-accent/15 text-accent border-accent/30',
  Здоровье: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  Финансы: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
};

export function TasksClient({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<{ id: string; title: string; priority: string; dueTime: string; categoryName: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<'today' | 'tomorrow' | 'week' | 'overdue' | 'all'>('today');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [categoryName, setCategoryName] = useState('Личное');

  const todayStr = new Date().toDateString();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toDateString();

  const filtered = tasks.filter((t) => {
    if (activeFilter === 'today') return t.dueDate && new Date(t.dueDate).toDateString() === todayStr;
    if (activeFilter === 'tomorrow') return t.dueDate && new Date(t.dueDate).toDateString() === tomorrowStr;
    if (activeFilter === 'overdue') return isOverdue(t.dueDate) && t.status !== 'COMPLETED';
    if (activeFilter === 'week') {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      const diffDays = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }
    return true;
  });

  const handleCreate = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask({ title, description: description || undefined, priority: priority as never, dueDate: dueDate || undefined, dueTime: dueTime || undefined, categoryName: categoryName || undefined });
      setTitle(''); setDescription(''); setPriority('MEDIUM'); setDueDate(''); setDueTime(''); setCategoryName('Личное');
      setShowModal(false);
      router.refresh();
    });
  };

  const handleUpdate = () => {
    if (!editingTask || !editingTask.title.trim()) return;
    startTransition(async () => {
      await updateTask(editingTask.id, {
        title: editingTask.title,
        priority: editingTask.priority as never,
        dueTime: editingTask.dueTime,
        categoryName: editingTask.categoryName,
      });
      setEditingTask(null);
      router.refresh();
    });
  };

  const handleToggle = (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    if (nextStatus === 'COMPLETED') {
      soundFx.playTaskSuccessSound();
    }
    startTransition(async () => {
      await updateTaskStatus(task.id, nextStatus as never);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить эту задачу?')) return;
    startTransition(async () => {
      await deleteTask(id);
      router.refresh();
    });
  };

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const todayCount = tasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === todayStr && t.status !== 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">Задачи</h1>
          <p className="text-xs text-zen-400 mt-0.5">Сегодня: {todayCount} • Выполнено: {completedCount}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold shadow-glow transition-all"
        >
          <Plus size={16} strokeWidth={2.5} /> Добавить
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-zen-100 dark:bg-[#131C2E] p-1.5 rounded-2xl w-fit border border-zen-200/60 dark:border-zen-800">
        {[
          ['today', 'Сегодня'],
          ['tomorrow', 'Завтра'],
          ['week', 'Неделя'],
          ['overdue', 'Просроченные'],
          ['all', 'Все'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key as never)}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-semibold transition-all',
              activeFilter === key
                ? 'bg-[#0066FF] text-white shadow-glow'
                : 'text-zen-500 hover:text-zen-900 dark:hover:text-zen-100'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zen-400 text-sm bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 rounded-card">
            Задач нет 🎉
          </div>
        )}
        {filtered.map((task) => {
          const categoryStyle = task.categoryName
            ? CATEGORY_COLOR_MAP[task.categoryName] || 'bg-accent/15 text-accent border-accent/30'
            : 'bg-zen-200/50 dark:bg-zen-700/50 text-zen-400 border-zen-300/50';
          return (
            <div
              key={task.id}
              className={clsx(
                'bg-white dark:bg-[#131C2E] border rounded-2xl shadow-apple transition-all card-hover group',
                task.status === 'COMPLETED'
                  ? 'border-zen-200 dark:border-zen-800 opacity-60'
                  : 'border-zen-200 dark:border-zen-800/80 hover:border-accent/40'
              )}
            >
              <div className="flex items-start gap-3 p-4">
                <button
                  onClick={() => handleToggle(task)}
                  className="mt-0.5 flex-shrink-0"
                  disabled={isPending}
                >
                  {task.status === 'COMPLETED' ? (
                    <CheckSquare2 size={20} className="text-income" />
                  ) : (
                    <Square size={20} className="text-zen-400 hover:text-accent transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={clsx(
                        'text-sm font-semibold',
                        task.status === 'COMPLETED' ? 'line-through text-zen-400' : 'text-zen-900 dark:text-zen-100'
                      )}
                    >
                      {task.title}
                    </span>
                    {task.categoryName && (
                      <span className={clsx('px-2.5 py-0.5 text-[10px] font-bold rounded-lg border', categoryStyle)}>
                        {task.categoryName}
                      </span>
                    )}
                  </div>
                  {task.description && <p className="text-xs text-zen-400 mt-1 truncate">{task.description}</p>}
                  {task.dueDate && (
                    <div
                      className={clsx(
                        'flex items-center gap-1.5 mt-1.5 text-xs font-medium',
                        isOverdue(task.dueDate) ? 'text-expense' : 'text-zen-400'
                      )}
                    >
                      {isOverdue(task.dueDate) ? <AlertTriangle size={13} /> : <Clock size={13} />}
                      <span>
                        {formatDate(task.dueDate)}
                        {task.dueTime && ` в ${task.dueTime}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {task.subtasks.length > 0 && (
                    <button
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      className="p-1.5 text-zen-400 hover:text-zen-600 transition-colors"
                    >
                      {expandedTask === task.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  )}
                  {/* Edit Task Button */}
                  <button
                    onClick={() =>
                      setEditingTask({
                        id: task.id,
                        title: task.title,
                        priority: task.priority,
                        dueTime: task.dueTime || '',
                        categoryName: task.categoryName || 'Личное',
                      })
                    }
                    className="p-1.5 text-zen-400 hover:text-[#0066FF] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Редактировать задачу"
                  >
                    <Edit2 size={16} />
                  </button>
                  {/* Delete Task Button */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 text-zen-400 hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isPending}
                    title="Удалить задачу"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Task Modal */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Редактировать задачу">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Название задачи *</label>
            <input
              type="text"
              value={editingTask?.title || ''}
              onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, title: e.target.value } : null))}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100 font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Приоритет</label>
              <select
                value={editingTask?.priority || 'MEDIUM'}
                onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, priority: e.target.value } : null))}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
              >
                <option value="HIGH">Высокий</option>
                <option value="MEDIUM">Средний</option>
                <option value="LOW">Низкий</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Категория</label>
              <select
                value={editingTask?.categoryName || 'Личное'}
                onChange={(e) => setEditingTask((prev) => (prev ? { ...prev, categoryName: e.target.value } : null))}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-[#0066FF] text-zen-900 dark:text-zen-100"
              >
                <option value="Платеж">Платеж</option>
                <option value="Работа">Работа</option>
                <option value="Личное">Личное</option>
                <option value="Здоровье">Здоровье</option>
                <option value="Финансы">Финансы</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            disabled={isPending}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all disabled:opacity-50"
          >
            {isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </Modal>

      {/* Create Task Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Новая задача">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Название *</label>
            <input
              type="text"
              placeholder="Что нужно сделать?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Описание</label>
            <textarea
              rows={2}
              placeholder="Подробности..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Приоритет</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              >
                <option value="HIGH">Высокий</option>
                <option value="MEDIUM">Средний</option>
                <option value="LOW">Низкий</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Категория</label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              >
                <option value="Платеж">Платеж</option>
                <option value="Работа">Работа</option>
                <option value="Личное">Личное</option>
                <option value="Здоровье">Здоровье</option>
                <option value="Финансы">Финансы</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Дата</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zen-700 dark:text-zen-300 mb-1">Время</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={isPending || !title.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] transition-all disabled:opacity-50 shadow-glow"
          >
            {isPending ? 'Сохранение...' : 'Создать задачу'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

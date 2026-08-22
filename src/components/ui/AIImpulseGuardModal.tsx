'use client';

import React, { useState } from 'react';
import { X, Brain, Sparkles, Timer, CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface ImpulseItem {
  id: string;
  name: string;
  price: number;
  reason: string;
  cooldownEndsAt: number;
  status: 'PENDING_COOLDOWN' | 'APPROVED' | 'CANCELLED';
}

interface AIImpulseGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBalance: number;
}

export const AIImpulseGuardModal: React.FC<AIImpulseGuardModalProps> = ({
  isOpen,
  onClose,
  totalBalance,
}) => {
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [q1Value, setQ1Value] = useState<'YES' | 'NO' | ''>('');
  const [q2Value, setQ2Value] = useState<'YES' | 'NO' | ''>('');
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    decision: 'COOLDOWN' | 'APPROVED' | 'RISKY';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleEvaluate = () => {
    const priceNum = parseFloat(itemPrice) || 0;
    if (!itemName.trim() || priceNum <= 0) return;

    soundFx.playClick();

    // Calculate AI Impulse Risk Score
    let riskScore = 50;
    const balanceRatio = priceNum / Math.max(1, totalBalance);

    if (balanceRatio > 0.2) riskScore += 30; // High impact on balance
    if (q1Value === 'NO') riskScore += 20; // Forget in 30 days
    if (q2Value === 'YES') riskScore += 15; // Has alternative

    if (riskScore >= 60) {
      setEvaluationResult({
        score: riskScore,
        decision: 'COOLDOWN',
        message: '🛑 ИИ рекомендует включить 24-часовой «Таймер Остывания»! Сделайте паузу 24 часа. Если через 24ч желание сохранится — покупка обоснована.',
      });
    } else {
      setEvaluationResult({
        score: riskScore,
        decision: 'APPROVED',
        message: '✅ Покупка прошла оценку ИИ! Она умеренно влияет на ваш баланс и принесёт реальную пользу.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#180A21] via-[#100617] to-[#08020D] border border-purple-500/40 p-6 shadow-2xl text-white space-y-5 overflow-hidden">

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-extrabold shadow-lg">
              <Brain size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">ИИ-Детектор Импульсивных Покупок</h3>
              <p className="text-[11px] text-purple-300">24-часовой Cooldown Guard от ненужных трат</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-3 relative z-10">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Название планового товара / услуги
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Например: Новые кроссовки / Наушники"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Стоимость (сум)
            </label>
            <input
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="1 500 000"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder:text-slate-500 font-mono"
            />
          </div>

          {/* Quick AI Questions */}
          <div className="space-y-2 pt-1">
            <label className="text-[10px] font-black text-purple-300 uppercase tracking-widest block">
              Быстрые ИИ-вопросы для оценки:
            </label>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <p className="font-medium text-slate-200">1. Вспомните ли вы об этой покупке через 30 дней?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setQ1Value('YES')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    q1Value === 'YES' ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white'
                  }`}
                >
                  Да, абсолютно
                </button>
                <button
                  onClick={() => setQ1Value('NO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    q1Value === 'NO' ? 'bg-rose-500 text-white' : 'bg-white/10 text-white'
                  }`}
                >
                  Возможно нет
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <p className="font-medium text-slate-200">2. Есть ли у вас аналог или альтернатива прямо сейчас?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setQ2Value('YES')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    q2Value === 'YES' ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-white'
                  }`}
                >
                  Да, есть
                </button>
                <button
                  onClick={() => setQ2Value('NO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    q2Value === 'NO' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white'
                  }`}
                >
                  Нет, очень нужно
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={!itemName.trim() || !itemPrice}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Sparkles size={16} />
            <span>Провести ИИ-Оценку Покупки</span>
          </button>
        </div>

        {/* Evaluation Result */}
        {evaluationResult && (
          <div
            className={`p-4 rounded-2xl border space-y-2 animate-in fade-in duration-300 relative z-10 ${
              evaluationResult.decision === 'COOLDOWN'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs">
              {evaluationResult.decision === 'COOLDOWN' ? <Timer size={18} className="text-amber-400 animate-pulse" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
              <span>{evaluationResult.decision === 'COOLDOWN' ? 'Активирован 24h Cooldown' : 'ИИ-Одобрение Получено'}</span>
            </div>

            <p className="text-xs leading-relaxed font-medium">
              {evaluationResult.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

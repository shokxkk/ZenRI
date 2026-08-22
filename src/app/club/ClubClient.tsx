'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  MessageSquare,
  Hash,
  Send,
  Users,
  Bell,
  Sparkles,
  Heart,
  PlusCircle,
  Flame,
  CheckCheck,
  Shield,
  Award,
  Circle,
  Lock,
} from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { triggerFlyingCoins, triggerHaptic } from '@/lib/coinAnimation';
import { addCoinsToUser, getUserShopData } from '@/lib/barsikShopStore';
import { getRealLeagueLeaderboard, RealLeagueMember } from '@/app/actions/leagueActions';

interface Topic {
  id: string;
  name: string;
  icon: string;
  unreadCount: number;
  description: string;
}

interface TelegramMessage {
  id: string;
  topicId: string;
  authorName: string;
  avatarUrl: string;
  badge: string;
  streak: number;
  text: string;
  timeStr: string;
  isSelf?: boolean;
  likesCount?: number;
  userLiked?: boolean;
}

const FORUM_TOPICS: Topic[] = [
  { id: 'general', name: 'общий-чат', icon: '💬', unreadCount: 3, description: 'Главное обсуждение финансового роста и успехов' },
  { id: 'lifehacks', name: 'лайфхаки-и-советы', icon: '💡', unreadCount: 1, description: 'Способы оптимизации расходов и экономии' },
  { id: 'achievements', name: 'наши-достижения', icon: '🚀', unreadCount: 0, description: 'Победы в Лиге, покупка желанных веточек и цели' },
  { id: 'deals', name: 'скидки-и-находки', icon: '🛒', unreadCount: 2, description: 'Выгодные акции, скидки и кэшбэки' },
  { id: 'reviews', name: 'отзывы-о-zenri', icon: '⭐', unreadCount: 0, description: 'Ваши впечатления и идеи по улучшению приложения' },
];

const INITIAL_MESSAGES: TelegramMessage[] = [
  {
    id: 'm1',
    topicId: 'general',
    authorName: 'PRODAX',
    avatarUrl: '/images/mascot_rich_hoodie.png',
    badge: 'Алмазная Лига 💎',
    streak: 14,
    text: 'Всем салам! Кто уже настроил ИИ-Автопилот дневного лимита? Невероятно спасает от импульсивных трат 🔥',
    timeStr: '14:30',
    likesCount: 12,
  },
  {
    id: 'm2',
    topicId: 'general',
    authorName: 'CyberShark #942',
    avatarUrl: '/images/mascot_happy_hoodie.png',
    badge: 'Золотая Лига 🥇',
    streak: 9,
    text: 'Привет! Да, спидометр подушки теперь аккуратно показывает полгода автономии. Очень мотивирует!',
    timeStr: '14:32',
    likesCount: 8,
  },
  {
    id: 'm3',
    topicId: 'lifehacks',
    authorName: 'ZenTrader #108',
    avatarUrl: '/images/mascot_rich_hoodie.png',
    badge: 'Алмазная Лига 💎',
    streak: 21,
    text: 'Лайфхак: Откладывайте ровно 10% с любого поступившего дохода до любых трат. Поверьте, разницы в расходах не почувствуете, а подушка растет со скоростью ракеты 🚀',
    timeStr: '13:15',
    likesCount: 25,
  },
  {
    id: 'm4',
    topicId: 'deals',
    authorName: 'AlphaWolf #331',
    avatarUrl: '/images/mascot_angry_hoodie.png',
    badge: 'Серебряная Лига 🥈',
    streak: 5,
    text: 'В магазине Барсика выбил кибер-очки за ZenCoins. Теперь аватар смотрится супер стильно в чате 😎',
    timeStr: '12:40',
    likesCount: 15,
  },
];

export function ClubClient() {
  const { data: session } = useSession();
  const currentUserName = session?.user?.name || 'Пользователь ZenRI';

  const [activeTopic, setActiveTopic] = useState<string>('general');
  const [messages, setMessages] = useState<TelegramMessage[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [zenCoins, setZenCoins] = useState(1250);
  const [topics, setTopics] = useState<Topic[]>(FORUM_TOPICS);

  // Real Database Registered Users
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  useEffect(() => {
    setZenCoins(getUserShopData().zenCoins);

    // Fetch real registered users from Prisma DB
    getRealLeagueLeaderboard().then((users: RealLeagueMember[]) => {
      if (users && users.length > 0) {
        setRealUsers(users);
      }
    });
  }, []);

  const currentTopic = topics.find((t) => t.id === activeTopic) || topics[0];

  const handleSelectTopic = (topicId: string) => {
    soundFx.playClick();
    setActiveTopic(topicId);
    // Clear unread count for selected topic
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, unreadCount: 0 } : t))
    );
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    soundFx.playClick();
    triggerHaptic(25);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: TelegramMessage = {
      id: `msg_${Date.now()}`,
      topicId: activeTopic,
      authorName: currentUserName,
      avatarUrl: '/images/mascot_happy_hoodie.png',
      badge: 'Алмазная Лига 💎',
      streak: 14,
      text: inputMessage,
      timeStr,
      isSelf: true,
      likesCount: 1,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Award +10 ZenCoins
    const updatedShop = addCoinsToUser(10);
    setZenCoins(updatedShop.zenCoins);

    // Show Telegram Notification Banner
    setToastNotification(`💬 Новое сообщение отправлено в #${currentTopic.name}`);
    setTimeout(() => setToastNotification(null), 3500);
  };

  const handleLikeMessage = (e: React.MouseEvent, msgId: string) => {
    soundFx.playClick();
    triggerHaptic(20);
    triggerFlyingCoins(e.clientX, e.clientY, true);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const isLiked = !m.userLiked;
          return {
            ...m,
            userLiked: isLiked,
            likesCount: (m.likesCount || 0) + (isLiked ? 1 : -1),
          };
        }
        return m;
      })
    );

    const updatedShop = addCoinsToUser(5);
    setZenCoins(updatedShop.zenCoins);
  };

  const filteredMessages = messages.filter((m) => m.topicId === activeTopic);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 relative">
      {/* Top Header Bar with BACK BUTTON Arrow ← Назад */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            onClick={() => soundFx.playClick()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-[#0066FF] text-zen-700 dark:text-zen-200 hover:text-white font-bold text-xs transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Назад в Главный экран</span>
          </Link>

          <div className="h-6 w-px bg-zen-200 dark:bg-zen-800" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center text-[#0066FF]">
              <Users size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-zen-900 dark:text-white flex items-center gap-2">
                <span>ZenRI Club Supergroup</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <Lock size={11} /> Анонимно
                </span>
              </h1>
              <p className="text-[10px] text-zen-400">Telegram-style форум с темами и топиками</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-black text-amber-300">
          <Award size={15} className="text-amber-400" />
          <span className="font-mono text-white">{zenCoins}🪙</span>
        </div>
      </div>

      {/* Telegram Toast Notification Popup */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border border-white/20 text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Bell size={18} className="animate-bounce" />
          <span className="text-xs font-bold">{toastNotification}</span>
        </div>
      )}

      {/* Main Grid: Telegram Forum Topics Bar + Real Users + Chat Window */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* LEFT COLUMN (4 cols): Telegram Forum Topics List */}
        <div className="md:col-span-4 space-y-4">

          {/* Topics List Card */}
          <div className="p-4 rounded-card bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-3">
            <h3 className="text-xs font-extrabold text-zen-900 dark:text-zen-100 uppercase tracking-widest flex items-center justify-between">
              <span>Тематические Топики</span>
              <span className="text-[10px] text-[#00C2FF] font-mono">{FORUM_TOPICS.length} тем</span>
            </h3>

            <div className="space-y-1.5">
              {topics.map((t) => {
                const isSelected = t.id === activeTopic;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTopic(t.id)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all text-left group ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white font-bold shadow-glow scale-[1.02]'
                        : 'bg-zen-50 dark:bg-zen-900/60 text-zen-700 dark:text-zen-300 hover:bg-zen-100 dark:hover:bg-zen-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{t.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate flex items-center gap-1">
                          <Hash size={13} className={isSelected ? 'text-white' : 'text-zen-400'} />
                          <span>{t.name}</span>
                        </p>
                      </div>
                    </div>

                    {/* Unread Counter Badge e.g. +1, +3 */}
                    {t.unreadCount > 0 && !isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black shadow-sm animate-pulse">
                        +{t.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real Registered Database Users Bar */}
          <div className="p-4 rounded-card bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-3">
            <h3 className="text-xs font-extrabold text-zen-900 dark:text-zen-100 uppercase tracking-widest flex items-center justify-between">
              <span>Участники Клуба</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Circle size={8} className="fill-emerald-400 animate-ping" />
                {realUsers.filter((u: RealLeagueMember) => u.isOnline).length} онлайн
              </span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {realUsers.map((u: RealLeagueMember, idx: number) => (
                <div key={u.userId || idx} className="flex items-center justify-between p-2 rounded-xl bg-zen-50 dark:bg-slate-950/70 border border-zen-100 dark:border-zen-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-full bg-[#0066FF]/20 text-[#0066FF] flex items-center justify-center text-[10px] font-extrabold flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-zen-900 dark:text-white truncate max-w-[120px]">{u.name}</span>
                  </div>

                  {u.isOnline ? (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>онлайн</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      <span>{u.lastSeenText || 'оффлайн'}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Telegram Messages Chat Window */}
        <div className="md:col-span-8 space-y-3">
          <div className="p-5 rounded-card bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-4 min-h-[540px] flex flex-col justify-between">

            {/* Chat Topic Header */}
            <div className="pb-3 border-b border-zen-100 dark:border-zen-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentTopic.icon}</span>
                <div>
                  <h2 className="text-sm font-extrabold text-zen-900 dark:text-white flex items-center gap-1">
                    <Hash size={14} className="text-[#00C2FF]" />
                    <span>{currentTopic.name}</span>
                  </h2>
                  <p className="text-[11px] text-zen-400">{currentTopic.description}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-zen-400 bg-zen-100 dark:bg-zen-800 px-2.5 py-1 rounded-xl">
                {filteredMessages.length} сообщений
              </span>
            </div>

            {/* Telegram Speech Bubbles Area */}
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {filteredMessages.length === 0 ? (
                <div className="py-12 text-center text-zen-400 space-y-2">
                  <MessageSquare size={32} className="mx-auto text-zen-500" />
                  <p className="text-xs font-medium">Будьте первым, кто напишет в #{currentTopic.name}!</p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1 ${msg.isSelf ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl space-y-1.5 shadow-sm relative ${
                        msg.isSelf
                          ? 'bg-gradient-to-r from-[#0055FF] to-[#00A3FF] text-white rounded-br-none'
                          : 'bg-zen-50 dark:bg-slate-950 border border-zen-200 dark:border-zen-800 text-zen-900 dark:text-slate-100 rounded-bl-none'
                      }`}
                    >
                      {/* Author Header */}
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className={`font-black flex items-center gap-1.5 ${msg.isSelf ? 'text-amber-200' : 'text-amber-400'}`}>
                          <span>{msg.authorName}</span>
                          <span className="text-[9px] opacity-80">({msg.badge})</span>
                        </span>
                        <span className={`text-[9px] font-mono ${msg.isSelf ? 'text-white/70' : 'text-zen-400'}`}>
                          {msg.timeStr}
                        </span>
                      </div>

                      {/* Text */}
                      <p className="text-xs leading-relaxed font-medium">{msg.text}</p>

                      {/* Telegram Like / Respect Button */}
                      <div className="flex justify-between items-center pt-1">
                        <button
                          onClick={(e) => handleLikeMessage(e, msg.id)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                            msg.userLiked
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-white/10 text-white/80 hover:bg-white/20'
                          }`}
                        >
                          <Heart size={12} className={msg.userLiked ? 'fill-rose-400 text-rose-400' : ''} />
                          <span>{msg.likesCount || 1} (+5🪙)</span>
                        </button>

                        <CheckCheck size={14} className={msg.isSelf ? 'text-white/80' : 'text-zen-400'} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Telegram Input Bar */}
            <div className="flex gap-2 pt-2 border-t border-zen-100 dark:border-zen-800/60">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Написать в #${currentTopic.name}...`}
                className="flex-1 py-3 px-4 rounded-2xl bg-zen-50 dark:bg-slate-950 border border-zen-200 dark:border-zen-700 text-xs text-zen-900 dark:text-white placeholder:text-zen-400 focus:outline-none focus:border-[#0066FF]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="py-3 px-5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-glow active:scale-95 transition-all"
              >
                <Send size={15} />
                <span>Отправить</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

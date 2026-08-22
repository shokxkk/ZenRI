'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Heart, Sparkles, Send, Flame, Crown, Shield, PlusCircle, MessageCircle, Lock, Award } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { triggerFlyingCoins, triggerHaptic } from '@/lib/coinAnimation';
import { addCoinsToUser, getUserShopData } from '@/lib/barsikShopStore';
import {
  CommunityPost,
  ChatMessage,
  getCommunityPosts,
  getChatMessages,
  createCommunityPost,
  togglePostLike,
  sendCommunityChatMessage,
} from '@/lib/communityStore';

export function ClubClient() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'PRODAX';

  const [activeTab, setActiveTab] = useState<'FEED' | 'CHAT'>('FEED');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newChatText, setNewChatText] = useState('');
  const [zenCoins, setZenCoins] = useState(1250);

  useEffect(() => {
    setPosts(getCommunityPosts());
    setChatMessages(getChatMessages());
    setZenCoins(getUserShopData().zenCoins);
  }, []);

  const handleLike = (e: React.MouseEvent, postId: string) => {
    soundFx.playClick();
    triggerHaptic(20);
    triggerFlyingCoins(e.clientX, e.clientY, true);
    const updatedShop = addCoinsToUser(10);
    setZenCoins(updatedShop.zenCoins);
    const updated = togglePostLike(postId);
    setPosts(updated);
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    soundFx.playClick();
    triggerHaptic(30);
    const updated = createCommunityPost(userName, 'Алмазный Дивизион 💎', 14, newPostContent);
    setPosts(updated);
    setNewPostContent('');
    const updatedShop = addCoinsToUser(15);
    setZenCoins(updatedShop.zenCoins);
  };

  const handleSendChat = () => {
    if (!newChatText.trim()) return;
    soundFx.playClick();
    triggerHaptic(20);
    const updated = sendCommunityChatMessage(userName, 'Алмазный Дивизион 💎', 14, newChatText);
    setChatMessages(updated);
    setNewChatText('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-card bg-gradient-to-r from-[#0F1A30] via-[#141238] to-[#0A1A2E] border border-[#00C2FF]/30 text-white shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C2FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-start flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00C2FF]/20 border border-[#00C2FF]/40 flex items-center justify-center text-[#00C2FF] font-extrabold shadow-lg">
              <MessageSquare size={26} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>ZenRI Club</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Lock size={12} /> 100% Анонимно
                </span>
              </h1>
              <p className="text-xs text-[#00C2FF] font-medium mt-0.5">
                Закрытое сообщество осознанных пользователей ZenRI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-amber-300">
            <Award size={16} className="text-amber-400" />
            <span>Ваши ZenCoins: <strong className="font-mono text-white">{zenCoins}🪙</strong></span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium relative z-10 max-w-2xl">
          Делитесь личным опытом экономии, давайте фин-советы и участвуйте в закрытом чате.
          Ваши банковские балансы и суммы остатков <strong>надежно скрыты</strong> от остальных участников!
        </p>
      </div>

      {/* Navigation Tabs (📰 Лента vs 💬 Общий Чат) */}
      <div className="flex gap-3 border-b border-zen-200 dark:border-zen-800/80 pb-2">
        <button
          onClick={() => { soundFx.playClick(); setActiveTab('FEED'); }}
          className={`py-2.5 px-5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
            activeTab === 'FEED'
              ? 'bg-[#0066FF] text-white shadow-glow'
              : 'bg-white dark:bg-[#131C2E] text-zen-600 dark:text-zen-400 border border-zen-200 dark:border-zen-800 hover:text-white'
          }`}
        >
          <MessageCircle size={16} />
          <span>Лента Лайфхаков & Отзывов ({posts.length})</span>
        </button>

        <button
          onClick={() => { soundFx.playClick(); setActiveTab('CHAT'); }}
          className={`py-2.5 px-5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
            activeTab === 'CHAT'
              ? 'bg-purple-600 text-white shadow-glow-purple'
              : 'bg-white dark:bg-[#131C2E] text-zen-600 dark:text-zen-400 border border-zen-200 dark:border-zen-800 hover:text-white'
          }`}
        >
          <MessageSquare size={16} />
          <span>Общий Чат Сообщества ({chatMessages.length})</span>
        </button>
      </div>

      {/* TAB 1: COMMUNITY FEED */}
      {activeTab === 'FEED' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Create Post Box */}
          <div className="p-5 rounded-card bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-3">
            <h3 className="text-xs font-extrabold text-zen-900 dark:text-zen-100 uppercase tracking-widest">
              Поделиться финансовым опытом или отзывом
            </h3>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Расскажите, как вам удалось сэкономить или что посоветуете сообществу..."
              className="w-full h-24 p-3.5 rounded-2xl bg-zen-50 dark:bg-slate-950 border border-zen-200 dark:border-zen-700 text-sm text-zen-900 dark:text-white placeholder:text-zen-400 resize-none focus:outline-none focus:border-[#0066FF]"
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-amber-500 font-bold">✨ За публикацию поприветствуем вас +15 ZenCoins 🪙</span>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="py-2.5 px-5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-2 shadow-glow transition-all active:scale-95"
              >
                <PlusCircle size={15} />
                <span>Опубликовать в Клуб</span>
              </button>
            </div>
          </div>

          {/* Posts Feed List */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-5 rounded-card bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-3 transition-transform hover:scale-[1.01]"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden border border-zen-200 dark:border-zen-700 bg-slate-950 flex-shrink-0">
                      <img src={post.avatarUrl} alt={post.authorName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zen-900 dark:text-white flex items-center gap-2">
                        <span>{post.authorName}</span>
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          🔥 {post.streak}d Страйк
                        </span>
                      </h4>
                      <span className="text-xs font-mono text-[#00C2FF] font-bold">{post.badge}</span>
                    </div>
                  </div>
                  <span className="text-xs text-zen-400">{post.timeAgo}</span>
                </div>

                <p className="text-sm text-zen-800 dark:text-slate-200 leading-relaxed font-medium">
                  {post.content}
                </p>

                <div className="pt-3 border-t border-zen-100 dark:border-zen-800/60 flex justify-between items-center">
                  <button
                    onClick={(e) => handleLike(e, post.id)}
                    className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all active:scale-95 ${
                      post.userLiked
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                        : 'bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-zen-600 dark:text-zen-300 hover:text-white'
                    }`}
                  >
                    <Heart size={15} className={post.userLiked ? 'fill-rose-400 text-rose-400' : ''} />
                    <span>{post.likesCount} Респектов (+10🪙)</span>
                  </button>

                  <span className="text-xs text-zen-400 font-mono">🔒 Баланс автора скрыт</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE COMMUNITY CHAT */}
      {activeTab === 'CHAT' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-5 rounded-card bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 shadow-apple space-y-4 min-h-[420px] flex flex-col justify-between">
            {/* Chat List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-3.5 rounded-2xl bg-zen-50 dark:bg-slate-950/80 border border-zen-200 dark:border-zen-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-500 flex items-center gap-2">
                      <span>{msg.authorName}</span>
                      <span className="text-[10px] text-[#00C2FF] font-mono">({msg.badge})</span>
                    </span>
                    <span className="text-[10px] text-zen-400 font-mono">{msg.timeStr}</span>
                  </div>
                  <p className="text-xs text-zen-800 dark:text-slate-100 font-medium leading-normal">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2 pt-2 border-t border-zen-100 dark:border-zen-800/60">
              <input
                type="text"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Сообщение в общий чат ZenRI..."
                className="flex-1 py-3 px-4 rounded-2xl bg-zen-50 dark:bg-slate-950 border border-zen-200 dark:border-zen-700 text-xs text-zen-900 dark:text-white placeholder:text-zen-400 focus:outline-none focus:border-[#0066FF]"
              />
              <button
                onClick={handleSendChat}
                disabled={!newChatText.trim()}
                className="py-3 px-5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-glow"
              >
                <Send size={15} />
                <span>Отправить</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

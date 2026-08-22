'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Heart, Sparkles, Send, Flame, Crown, Shield, Share2, PlusCircle, ThumbsUp, MessageCircle } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { triggerFlyingCoins, triggerHaptic } from '@/lib/coinAnimation';
import { addCoinsToUser } from '@/lib/barsikShopStore';
import {
  CommunityPost,
  ChatMessage,
  getCommunityPosts,
  getChatMessages,
  createCommunityPost,
  togglePostLike,
  sendCommunityChatMessage,
} from '@/lib/communityStore';

interface ZenRICommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  badge: string;
  currentStreak: number;
}

export const ZenRICommunityModal: React.FC<ZenRICommunityModalProps> = ({
  isOpen,
  onClose,
  userName,
  badge,
  currentStreak,
}) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'CHAT'>('FEED');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newChatText, setNewChatText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPosts(getCommunityPosts());
      setChatMessages(getChatMessages());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLike = (e: React.MouseEvent, postId: string) => {
    soundFx.playClick();
    triggerHaptic(20);
    triggerFlyingCoins(e.clientX, e.clientY, true);
    // Award +10 ZenCoins on respect!
    addCoinsToUser(10);
    const updated = togglePostLike(postId);
    setPosts(updated);
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    soundFx.playClick();
    triggerHaptic(30);
    const updated = createCommunityPost(userName, badge, currentStreak, newPostContent);
    setPosts(updated);
    setNewPostContent('');
  };

  const handleSendChat = () => {
    if (!newChatText.trim()) return;
    soundFx.playClick();
    triggerHaptic(20);
    const updated = sendCommunityChatMessage(userName, badge, currentStreak, newChatText);
    setChatMessages(updated);
    setNewChatText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#120B26] via-[#0A0618] to-[#05030E] border border-[#00C2FF]/30 p-6 shadow-2xl text-white space-y-5 overflow-hidden">

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C2FF]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00C2FF]/20 border border-[#00C2FF]/40 flex items-center justify-center text-[#00C2FF] font-extrabold shadow-lg">
              <MessageSquare size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
                <span>ZenRI Club</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                  🔒 100% Приватно
                </span>
              </h3>
              <p className="text-[11px] text-[#00C2FF]">Закрытое сообщество финансово грамотных людей</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2 Tabs: 📰 Лента vs 💬 Общий Чат */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/50 border border-white/10 relative z-10">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('FEED'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'FEED'
                ? 'bg-gradient-to-r from-[#0066FF] to-[#00C2FF] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle size={14} />
            <span>Лента Лайфхаков</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('CHAT'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'CHAT'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={14} />
            <span>Общий Чат</span>
          </button>
        </div>

        {/* TAB 1: COMMUNITY FEED / WALL */}
        {activeTab === 'FEED' && (
          <div className="space-y-4 animate-in fade-in duration-200 relative z-10">
            {/* Create Post Input */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Поделитесь вашим финансовым лайфхаком или отзывом..."
                className="w-full h-16 p-2 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-[#00C2FF]"
              />
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-amber-300 font-medium">✨ Публикация даёт +10 ZenCoins 🪙</span>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-1 transition-all"
                >
                  <PlusCircle size={13} />
                  <span>Опубликовать</span>
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {posts.map((post) => (
                <div key={post.id} className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 bg-black/60 flex-shrink-0">
                        <img src={post.avatarUrl} alt={post.authorName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>{post.authorName}</span>
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                            🔥 {post.streak}d
                          </span>
                        </h5>
                        <span className="text-[9px] font-mono text-[#00C2FF]">{post.badge}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500">{post.timeAgo}</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {post.content}
                  </p>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <button
                      onClick={(e) => handleLike(e, post.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                        post.userLiked
                          ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart size={13} className={post.userLiked ? 'fill-rose-400 text-rose-400' : ''} />
                      <span>{post.likesCount} Респектов (+10🪙)</span>
                    </button>

                    <span className="text-[9px] text-slate-500 font-mono">🔒 Баланс скрыт</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE COMMUNITY CHAT */}
        {activeTab === 'CHAT' && (
          <div className="space-y-3 animate-in fade-in duration-200 relative z-10">
            {/* Chat Messages */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 max-h-60 overflow-y-auto space-y-2.5">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                      <span>{msg.authorName}</span>
                      <span className="text-[8px] text-[#00C2FF] font-mono">({msg.badge})</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">{msg.timeStr}</span>
                  </div>
                  <p className="text-xs text-slate-100 font-medium">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Напишите сообщение в общий чат..."
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00C2FF]"
              />
              <button
                onClick={handleSendChat}
                disabled={!newChatText.trim()}
                className="py-2.5 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 text-white font-bold text-xs"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

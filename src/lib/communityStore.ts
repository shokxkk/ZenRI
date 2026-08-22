'use client';

export interface CommunityPost {
  id: string;
  authorName: string;
  avatarUrl: string;
  badge: string;
  streak: number;
  content: string;
  likesCount: number;
  userLiked: boolean;
  timeAgo: string;
}

export interface ChatMessage {
  id: string;
  authorName: string;
  avatarUrl: string;
  badge: string;
  streak: number;
  text: string;
  timeStr: string;
}

const STORAGE_POSTS_KEY = 'zenri_community_posts_v1';
const STORAGE_CHAT_KEY = 'zenri_community_chat_v1';

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    authorName: 'PRODAX',
    avatarUrl: '/images/mascot_rich_hoodie.png',
    badge: 'Алмазная Лига 💎',
    streak: 14,
    content: 'Сэкономил 450 000 сум за последние 2 недели просто благодаря ИИ-Табу на такси и еду вне дома! Кошелек говорит спасибо 🔥',
    likesCount: 18,
    userLiked: false,
    timeAgo: '15 минут назад',
  },
  {
    id: 'post_2',
    authorName: 'CyberShark #942',
    avatarUrl: '/images/mascot_happy_hoodie.png',
    badge: 'Золотая Лига 🥇',
    streak: 9,
    content: 'Приложение ZenRI с Барсиком реально дисциплинирует. Раньше деньги просто утекали сквозь пальцы, теперь 30% дохода стабильно идут в копилку!',
    likesCount: 24,
    userLiked: false,
    timeAgo: '1 час назад',
  },
  {
    id: 'post_3',
    authorName: 'ZenTrader #108',
    avatarUrl: '/images/mascot_rich_hoodie.png',
    badge: 'Алмазная Лига 💎',
    streak: 21,
    content: 'Совет новичкам: включите ИИ-Автопилот дневного лимита. Это невероятно держит в тонусе и помогает не совершать лишних трат 🎯',
    likesCount: 31,
    userLiked: false,
    timeAgo: '3 часа назад',
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'chat_1',
    authorName: 'Samurai #777',
    avatarUrl: '/images/mascot_angry_hoodie.png',
    badge: 'Золотая Лига 🥇',
    streak: 7,
    text: 'Всем привет! Кто уже выбил золотое худи для Барсика в магазине? 😎',
    timeStr: '14:20',
  },
  {
    id: 'chat_2',
    authorName: 'AlphaWolf #331',
    avatarUrl: '/images/mascot_happy_hoodie.png',
    badge: 'Серебряная Лига 🥈',
    streak: 5,
    text: 'Я вчера забрал! Очки и корона смотрятся просто убойно на карточке 👑',
    timeStr: '14:22',
  },
  {
    id: 'chat_3',
    authorName: 'PRODAX',
    avatarUrl: '/images/mascot_rich_hoodie.png',
    badge: 'Алмазная Лига 💎',
    streak: 14,
    text: 'Рад видеть всех в клубе ZenRI! Давайте вместе поднимать процент сбережений 🔥',
    timeStr: '14:25',
  },
];

export function getCommunityPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return INITIAL_POSTS;
  try {
    const raw = localStorage.getItem(STORAGE_POSTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_POSTS;
}

export function saveCommunityPosts(posts: CommunityPost[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(posts));
  } catch {}
}

export function getChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_CHAT;
  try {
    const raw = localStorage.getItem(STORAGE_CHAT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_CHAT;
}

export function saveChatMessages(msgs: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(msgs));
  } catch {}
}

export function createCommunityPost(
  authorName: string,
  badge: string,
  streak: number,
  content: string
): CommunityPost[] {
  const current = getCommunityPosts();
  const newPost: CommunityPost = {
    id: `post_${Date.now()}`,
    authorName: authorName || 'Пользователь ZenRI',
    avatarUrl: '/images/mascot_happy_hoodie.png',
    badge: badge || 'Бронзовая Лига 🥉',
    streak: streak || 1,
    content,
    likesCount: 1,
    userLiked: true,
    timeAgo: 'Только что',
  };
  const updated = [newPost, ...current];
  saveCommunityPosts(updated);
  return updated;
}

export function togglePostLike(postId: string): CommunityPost[] {
  const current = getCommunityPosts();
  const updated = current.map((p) => {
    if (p.id === postId) {
      const isLiked = !p.userLiked;
      return {
        ...p,
        userLiked: isLiked,
        likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1,
      };
    }
    return p;
  });
  saveCommunityPosts(updated);
  return updated;
}

export function sendCommunityChatMessage(
  authorName: string,
  badge: string,
  streak: number,
  text: string
): ChatMessage[] {
  const current = getChatMessages();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newMsg: ChatMessage = {
    id: `chat_${Date.now()}`,
    authorName: authorName || 'PRODAX',
    avatarUrl: '/images/mascot_happy_hoodie.png',
    badge: badge || 'Бронзовая Лига 🥉',
    streak: streak || 1,
    text,
    timeStr,
  };

  const updated = [...current, newMsg];
  saveChatMessages(updated);
  return updated;
}

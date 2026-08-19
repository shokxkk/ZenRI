'use server';

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function askChatGPT(messages: Message[], customApiKey?: string): Promise<string> {
  const userId = await getUserId();
  const apiKey = customApiKey?.trim() || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return 'Ошибка: API ключ OpenAI не найден в настройках профиля или в .env.';
  }

  const openai = new OpenAI({ apiKey });

  // Gather live user context from Prisma
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      habits: true,
      tasks: { where: { status: 'TODO' } },
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthlyIncome, monthlyExpense] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const totalBalance = user?.accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0) || 0;
  const incomeSum = Number(monthlyIncome._sum.amount || 0);
  const expenseSum = Number(monthlyExpense._sum.amount || 0);

  const accountsSummary = user?.accounts.map((a) => `${a.name}: ${Number(a.currentBalance).toLocaleString('ru-RU')} UZS`).join(', ') || 'Нет счетов';
  const pendingTasksCount = user?.tasks.length || 0;

  const systemPrompt: Message = {
    role: 'system',
    content: `Ты — ZenRI AI Assistant, умный финансовый и продуктивный советник пользователя ${user?.name || 'Пользователь'}.
    
    Текущий финансовый контекст пользователя в ZenRI:
    - Общий баланс на счетах: ${totalBalance.toLocaleString('ru-RU')} UZS
    - Счета: ${accountsSummary}
    - Доходы в этом месяце: ${incomeSum.toLocaleString('ru-RU')} UZS
    - Расходы в этом месяце: ${expenseSum.toLocaleString('ru-RU')} UZS
    - Активные задачи: ${pendingTasksCount} задач
    - Привычки: ${user?.habits.map(h => h.name).join(', ') || 'Чтение, Спорт, Вода'}

    СТРОГОЕ ПРАВИЛО ФОРМАТИРОВАНИЯ:
    НЕ ИСПОЛЬЗУЙ никакие символы разметки Markdown, такие как **, ***, ###, ##, #, \\frac, \\text, \\approx, \\times или фигурные скобки.
    Пиши ответ ПРЕКРАСНЫМ ЧИСТЫМ ТЕКСТОМ без звездочек и решеток!
    Используй обычные абзацы, маркеры списка (•) и смайлики (эмодзи).`,
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
      max_tokens: 600,
    });

    let text = response.choices[0]?.message?.content || 'Не удалось получить ответ от AI.';
    
    // Post-process sanitation to strip any residual markdown or LaTeX tags
    text = text
      .replace(/#{1,6}\s?/g, '')       // Strip hashes
      .replace(/\*\*\*/g, '')          // Strip triple asterisks
      .replace(/\*\*/g, '')            // Strip double asterisks
      .replace(/\*/g, '')              // Strip single asterisks
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2') // Clean LaTeX fractions
      .replace(/\\text\{([^}]+)\}/g, '$1') // Clean LaTeX text
      .replace(/\\[a-zA-Z]+/g, '')     // Clean remaining LaTeX backslashes
      .replace(/[\{\}]/g, '');         // Strip curly braces

    return text;
  } catch (error: unknown) {
    console.error('OpenAI Error:', error);
    try {
      const fallbackResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 600,
      });
      let text = fallbackResponse.choices[0]?.message?.content || 'Ответ от AI получён.';
      text = text
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[\{\}]/g, '');
      return text;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return `Ошибка связи с ChatGPT API: ${errMsg}`;
    }
  }
}

export type RecommendedBook = {
  title: string;
  author: string;
  category: 'FINANCE' | 'BUSINESS' | 'SELF_DEV' | 'PSYCHOLOGY' | 'TECH' | 'FICTION' | 'ISLAMIC' | 'OTHER';
  totalPages: number;
  price: number;
  coverGradient: string;
  shortReason: string;
  keyInsight: string;
};

const GRADIENTS_POOL = [
  'from-blue-600 via-indigo-700 to-slate-900',
  'from-emerald-600 via-teal-700 to-slate-900',
  'from-amber-500 via-orange-600 to-slate-900',
  'from-purple-600 via-violet-700 to-slate-900',
  'from-rose-600 via-pink-700 to-slate-900',
  'from-cyan-600 via-blue-700 to-slate-900',
];

const FALLBACK_BOOKS: RecommendedBook[] = [
  {
    title: 'Думай медленно... Решай быстро',
    author: 'Даниэль Канеман',
    category: 'PSYCHOLOGY',
    totalPages: 650,
    price: 95000,
    coverGradient: 'from-purple-600 via-violet-700 to-slate-900',
    shortReason: 'Нобелевский лауреат объясняет, как работают две системы нашего мышления и как избегать когнитивных ловушек.',
    keyInsight: 'Мы склонны переоценивать свое понимание мира и недооценивать роль случая.',
  },
  {
    title: 'Принципы: Жизнь и работа',
    author: 'Рэй Далио',
    category: 'BUSINESS',
    totalPages: 590,
    price: 130000,
    coverGradient: 'from-blue-600 via-indigo-700 to-slate-900',
    shortReason: 'Основатель крупнейшего хедж-фонда Bridgewater делится алгоритмами принятия решений и радикальной прозрачности.',
    keyInsight: 'Боль + Осмысление = Прогресс.',
  },
  {
    title: 'Психология денег',
    author: 'Морган Хаузел',
    category: 'FINANCE',
    totalPages: 280,
    price: 75000,
    coverGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    shortReason: 'Финансовый успех зависит не от того, насколько вы умны, а от того, как вы себя ведете с деньгами.',
    keyInsight: 'Богатство — это то, чего вы не видите: некупленные машины, неодетые часы и непервый класс.',
  },
  {
    title: 'Глубокая работа (Deep Work)',
    author: 'Кэл Ньюпорт',
    category: 'SELF_DEV',
    totalPages: 300,
    price: 85000,
    coverGradient: 'from-cyan-600 via-blue-700 to-slate-900',
    shortReason: 'Правила сфокусированного успеха в мире, перегруженном уведомлениями и отвлекающими факторами.',
    keyInsight: 'Способность концентрироваться без отвлечений становится суперсилой в современной экономике.',
  },
  {
    title: 'Антихрупкость: Как извлечь выгоду из хаоса',
    author: 'Нассим Николас Талеб',
    category: 'FINANCE',
    totalPages: 720,
    price: 110000,
    coverGradient: 'from-amber-500 via-orange-600 to-slate-900',
    shortReason: 'Как не просто выживать в условиях стресса и неопределенности, а становиться сильнее и богаче.',
    keyInsight: 'Антихрупкость любит случайность и неопределенность, что означает любовь к ошибкам.',
  },
  {
    title: 'Эссенциализм: Путь к простоте',
    author: 'Грег МакКеон',
    category: 'SELF_DEV',
    totalPages: 260,
    price: 80000,
    coverGradient: 'from-rose-600 via-pink-700 to-slate-900',
    shortReason: 'Делать меньше, но лучше. Как перестать распыляться и сосредоточиться на самом важном.',
    keyInsight: 'Если вы сами не расставите приоритеты в своей жизни, кто-то другой сделает это за вас.',
  },
  {
    title: 'От нуля к единице',
    author: 'Питер Тиль',
    category: 'BUSINESS',
    totalPages: 200,
    price: 70000,
    coverGradient: 'from-blue-600 via-indigo-700 to-slate-900',
    shortReason: 'Как создавать компании будущего и выходить из конкуренции создавая уникальные монополии.',
    keyInsight: 'Каждый великий бизнес строится вокруг секрета, скрытого от внешнего мира.',
  },
  {
    title: 'Чистый код (Clean Code)',
    author: 'Роберт Мартин',
    category: 'TECH',
    totalPages: 460,
    price: 120000,
    coverGradient: 'from-cyan-600 via-blue-700 to-slate-900',
    shortReason: 'Библия разработчиков о том, как создавать архитектуру, которую легко читать и поддерживать.',
    keyInsight: 'Отношение времени чтения кода к написанию нового превышает 10 к 1.',
  },
  {
    title: 'Самый богатый человек в Вавилоне',
    author: 'Джордж Клейсон',
    category: 'FINANCE',
    totalPages: 160,
    price: 55000,
    coverGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    shortReason: 'Вечная классика финансовой грамотности: как откладывать 10%, беречь капитал и приумножать золото.',
    keyInsight: 'Часть всего, что вы зарабатываете, принадлежит вам, и ее нужно сохранить.',
  },
  {
    title: 'Сила воли: Как развить и укрепить',
    author: 'Келли Макгонигал',
    category: 'PSYCHOLOGY',
    totalPages: 320,
    price: 85000,
    coverGradient: 'from-purple-600 via-violet-700 to-slate-900',
    shortReason: 'Стэнфордский курс о том, как устроен самоконтроль на уровне мозга и как преодолеть лень.',
    keyInsight: 'Самоконтроль похож на мышцу: он утомляется от использования, но тренируется нагрузками.',
  },
];

export async function getAIBookRecommendation(excludeTitles: string[] = []): Promise<RecommendedBook> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const available = FALLBACK_BOOKS.filter(
      (b) => !excludeTitles.some((t) => t.toLowerCase() === b.title.toLowerCase())
    );
    const pool = available.length > 0 ? available : FALLBACK_BOOKS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  try {
    const openai = new OpenAI({ apiKey });
    const prompt = `Порекомендуй одну выдающуюся, признанную в мире книгу по саморазвитию, финансам, бизнесу, психологии или технологиям.
Не рекомендуй книги из этого списка (пользователь уже знает их): ${excludeTitles.slice(0, 10).join(', ') || 'нет'}.

Верни строго валидный JSON объект (без markdown блоков, без обратных кавычек) со следующими полями:
{
  "title": "Название книги на русском",
  "author": "Автор",
  "category": "FINANCE" | "BUSINESS" | "SELF_DEV" | "PSYCHOLOGY" | "TECH" | "FICTION" | "ISLAMIC" | "OTHER",
  "totalPages": 300,
  "price": 85000,
  "shortReason": "Краткая емкая причина почему эту книгу стоит прочесть (1 предложение)",
  "keyInsight": "Главный ключевой инсайт или цитата из книги"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 400,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      title: parsed.title || 'Выдающаяся книга',
      author: parsed.author || 'Мировой автор',
      category: parsed.category || 'SELF_DEV',
      totalPages: Number(parsed.totalPages) || 300,
      price: Number(parsed.price) || 85000,
      coverGradient: GRADIENTS_POOL[Math.floor(Math.random() * GRADIENTS_POOL.length)],
      shortReason: parsed.shortReason || 'Трансформирующее чтение для качественного прорыва.',
      keyInsight: parsed.keyInsight || 'Фокусируйтесь на системе действий каждый день.',
    };
  } catch (err) {
    console.error('Error fetching OpenAI book recommendation:', err);
    const available = FALLBACK_BOOKS.filter(
      (b) => !excludeTitles.some((t) => t.toLowerCase() === b.title.toLowerCase())
    );
    const pool = available.length > 0 ? available : FALLBACK_BOOKS;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

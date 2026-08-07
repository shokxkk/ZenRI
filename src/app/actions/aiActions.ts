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

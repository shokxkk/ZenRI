import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegramBot';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        telegramId: { not: null },
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        telegramId: true,
      },
    });

    // Start & End of today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayDateFormatted = now.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });

    let sentCount = 0;

    for (const u of users) {
      if (!u.telegramId) continue;

      // Fetch today's transactions for user
      const todayTransactions = await prisma.transaction.findMany({
        where: {
          userId: u.id,
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      });

      let todayIncome = 0;
      let todayExpense = 0;
      const categoryTotals: Record<string, number> = {};

      for (const tx of todayTransactions) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'INCOME') {
          todayIncome += amt;
        } else if (tx.type === 'EXPENSE') {
          todayExpense += amt;
          const catName = tx.comment || 'Прочие расходы';
          categoryTotals[catName] = (categoryTotals[catName] || 0) + amt;
        }
      }

      const netDay = todayIncome - todayExpense;

      // Find top expense category
      let topCategory = '—';
      let topCategoryAmount = 0;
      for (const [cat, amt] of Object.entries(categoryTotals)) {
        if (amt > topCategoryAmount) {
          topCategoryAmount = amt;
          topCategory = cat;
        }
      }

      // Generate Barsik AI Advice
      let barsikAdvice = '';
      if (todayExpense === 0 && todayIncome === 0) {
        barsikAdvice = `«Спокойный день! 0 трат — отличная тренировка финансовой дисциплины. Барсик доволен!»`;
      } else if (netDay >= 0) {
        barsikAdvice = `«Отличная работа! Сегодня ты сохранил в плюсе ${netDay.toLocaleString('ru-RU')} сум. Продолжай в том же духе!»`;
      } else {
        barsikAdvice = `«Внимание: сегодня расходы превысили доход на ${Math.abs(netDay).toLocaleString('ru-RU')} сум! Завтра Барсик советует воздержаться от необязательных покупок.»`;
      }

      const reportText =
        `🐆 <b>Привет! Я Барсик! 🐾</b>\n\n` +
        `Как прошёл твой день, <b>${u.name || 'Друг'}</b>? Присылаю твой ежедневный финансовый отчёт за <b>${todayDateFormatted}</b>:\n\n` +
        `📊 <b>ИТОГИ ДНЯ (23:00):</b>\n` +
        `🟢 <b>Доход за сегодня:</b> +${todayIncome.toLocaleString('ru-RU')} сум\n` +
        `🔴 <b>Расход за сегодня:</b> -${todayExpense.toLocaleString('ru-RU')} сум\n` +
        `⚖️ <b>Баланс дня:</b> ${netDay >= 0 ? '+' : ''}${netDay.toLocaleString('ru-RU')} сум\n` +
        `🏷 <b>Топ статья трат:</b> ${topCategory} ${topCategoryAmount > 0 ? `(${topCategoryAmount.toLocaleString('ru-RU')} сум)` : ''}\n\n` +
        `💡 <b>ФИНАНСОВЫЙ СОВЕТ ОТ БАРСИКА:</b>\n` +
        `<i>${barsikAdvice}</i>\n` +
        `───────────────\n` +
        `💡 <i>Напиши прямо сюда расходы на завтра, например: <code>Такси 25000</code> — и я добавлю их на сайт!</i>`;

      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '📱 Открыть сайт www.zenri.uz',
              url: 'https://www.zenri.uz/dashboard',
            },
          ],
        ],
      };

      await sendTelegramMessage(u.telegramId, reportText, replyMarkup);
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      sentCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error generating daily report' }, { status: 500 });
  }
}

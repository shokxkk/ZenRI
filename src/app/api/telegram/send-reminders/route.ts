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

    let sentCount = 0;
    for (const u of users) {
      if (!u.telegramId) continue;

      const reminderText =
        `☕ <b>Вечерний учёт ZenRI</b>\n\n` +
        `Здравствуйте, <b>${u.name || 'Пользователь'}</b>! Как прошёл день?\n\n` +
        `Не забудьте занести вечерние расходы и выполненные задачи за сегодня 🎯\n\n` +
        `💡 <i>Напишите прямо сюда в бот (например: <code>Такси 25000</code> или <code>Ужин 45000</code>) — и расход запишется на сайт www.zenri.uz автоматически!</i>`;

      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '📱 Открыть Личный Кабинет',
              url: 'https://www.zenri.uz/dashboard',
            },
          ],
        ],
      };

      await sendTelegramMessage(u.telegramId, reminderText, replyMarkup);
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      sentCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error sending reminders' }, { status: 500 });
  }
}

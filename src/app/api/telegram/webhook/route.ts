import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CurrencyCode } from '@prisma/client';
import {
  sendTelegramMessage,
  createMagicLoginToken,
  getTelegramAvatarUrl,
  saveTelegramAuthCode,
} from '@/lib/telegramBot';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message || update?.edited_message;

    if (!message || !message.from) {
      return NextResponse.json({ ok: true });
    }

    const { id: telegramIdNum, first_name, last_name, username } = message.from;
    const chatId = message.chat.id;
    const telegramId = String(telegramIdNum);
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || username || `User_${telegramId}`;
    const syntheticEmail = `tg_${telegramId}@telegram.zenri.app`;

    // Fetch avatar safely
    let avatarUrl: string | null = null;
    try {
      avatarUrl = await getTelegramAvatarUrl(telegramIdNum);
    } catch {
      // ignore
    }

    let userId: string = telegramId;

    // Find or create user in DB safely
    try {
      let user = await prisma.user.findUnique({ where: { telegramId } });

      if (!user) {
        const existingByEmail = await prisma.user.findUnique({ where: { email: syntheticEmail } });

        if (existingByEmail) {
          user = await prisma.user.update({
            where: { email: syntheticEmail },
            data: {
              telegramId,
              telegramUsername: username || null,
              avatarUrl: avatarUrl || existingByEmail.avatarUrl,
              name: displayName,
            },
          });
        } else {
          user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                name: displayName,
                email: syntheticEmail,
                telegramId,
                telegramUsername: username || null,
                avatarUrl: avatarUrl || null,
                authProvider: 'telegram',
                defaultCurrency: CurrencyCode.UZS,
                settings: {
                  create: {
                    language: 'ru',
                    theme: 'light',
                  },
                },
              },
            });

            // Default categories
            const defaultCategories = [
              { name: 'Продукты', type: 'EXPENSE' as const, icon: 'shopping-cart', color: '#3B82F6' },
              { name: 'Кафе и рестораны', type: 'EXPENSE' as const, icon: 'coffee', color: '#F59E0B' },
              { name: 'Транспорт', type: 'EXPENSE' as const, icon: 'car', color: '#EF4444' },
              { name: 'Коммунальные', type: 'EXPENSE' as const, icon: 'home', color: '#8B5CF6' },
              { name: 'Зарплата', type: 'INCOME' as const, icon: 'briefcase', color: '#10B981' },
              { name: 'Фриланс / Бизнес', type: 'INCOME' as const, icon: 'trending-up', color: '#059669' },
            ];

            await tx.category.createMany({
              data: defaultCategories.map((cat) => ({
                userId: newUser.id,
                name: cat.name,
                type: cat.type,
                icon: cat.icon,
                color: cat.color,
                isSystem: true,
              })),
            });

            await tx.account.create({
              data: {
                userId: newUser.id,
                name: 'Основной счёт (Uzcard)',
                type: 'UZCARD',
                currency: CurrencyCode.UZS,
                initialBalance: 0,
                currentBalance: 0,
                icon: 'credit-card',
              },
            });

            return newUser;
          });
        }
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            telegramUsername: username || user.telegramUsername,
            name: displayName || user.name,
            avatarUrl: avatarUrl || user.avatarUrl,
          },
        });
      }

      if (user) {
        userId = user.id;
      }
    } catch (dbErr) {
      console.error('DB user creation/update error in webhook:', dbErr);
    }

    // Generate 6-digit code
    const sixDigitCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Save in fast memory store
    saveTelegramAuthCode(sixDigitCode, userId, telegramId, displayName);

    // 2. Also try saving in DB if table exists (ignore error if not migrated)
    try {
      await (prisma as unknown as { telegramAuthCode?: { deleteMany: (args: unknown) => Promise<unknown>; create: (args: unknown) => Promise<unknown> } })
        .telegramAuthCode?.deleteMany({ where: { telegramId } });
      await (prisma as unknown as { telegramAuthCode?: { create: (args: unknown) => Promise<unknown> } })
        .telegramAuthCode?.create({
          data: {
            code: sixDigitCode,
            telegramId,
            userId,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
    } catch {
      // Ignore schema drift on production DB
    }

    // Generate Magic Token for instant 1-click web login
    const magicToken = createMagicLoginToken(userId, telegramId);
    const loginUrl = `https://www.zenri.uz/auth/telegram-callback?token=${magicToken}`;

    // Reply to user in Telegram with 6-digit Code + 1-Click Button
    const welcomeText =
      `👋 Здравствуйте, <b>${displayName}</b>!\n\n` +
      `✨ Добро пожаловать в <b>ZenRI Life OS</b>.\n\n` +
      `🔑 <b>Ваш 6-значный код для входа на сайт:</b>\n\n` +
      `👉 <code>${sixDigitCode}</code> 👈\n\n` +
      `<i>(Нажмите на код чтобы скопировать. Введите его на сайте www.zenri.uz — номер телефона вводить не нужно!)</i>\n\n` +
      `⏱ Код действует 15 минут.\n` +
      `───────────────\n` +
      `Или нажмите кнопку ниже для входа в 1 клик:`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Войти в личный кабинет (в 1 клик)',
            url: loginUrl,
          },
        ],
        [
          {
            text: '📱 Открыть Web App',
            web_app: { url: 'https://www.zenri.uz/dashboard' },
          },
        ],
      ],
    };

    await sendTelegramMessage(chatId, welcomeText, replyMarkup);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Fatal Webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram so it doesn't backoff
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', service: 'ZenRI Telegram Bot Webhook' });
}

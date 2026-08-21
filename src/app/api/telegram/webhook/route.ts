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
    const text = (message.text || '').trim();

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { telegramId } });

    // Handle Quick Expense / Income logging directly from Telegram messages (e.g., "Такси 25000" or "Кофе 15000")
    if (text && !text.startsWith('/start') && user) {
      const match = text.match(/([a-zA-Zа-яА-ЯёЁ\s]+)?\s*(\d+[\d\s]*)/);
      if (match) {
        const categoryOrComment = (match[1] || 'Расход').trim();
        const rawAmount = match[2].replace(/\s/g, '');
        const amount = parseInt(rawAmount, 10);

        if (!isNaN(amount) && amount > 0) {
          // Find default account
          let account = await prisma.account.findFirst({ where: { userId: user.id } });
          if (!account) {
            account = await prisma.account.create({
              data: {
                userId: user.id,
                name: 'Основной счёт',
                type: 'UZCARD',
                currency: CurrencyCode.UZS,
                initialBalance: 0,
                currentBalance: 0,
              },
            });
          }

          // Create transaction
          await prisma.transaction.create({
            data: {
              userId: user.id,
              accountId: account.id,
              type: 'EXPENSE',
              amount,
              comment: categoryOrComment,
              date: new Date(),
            },
          });

          // Deduct from account
          await prisma.account.update({
            where: { id: account.id },
            data: {
              currentBalance: {
                decrement: amount,
              },
            },
          });

          const reply =
            `✅ <b>Записано в ZenRI!</b>\n\n` +
            `💸 <b>Расход:</b> ${amount.toLocaleString('ru-RU')} сум\n` +
            `🏷 <b>Категория / Заметка:</b> ${categoryOrComment}\n` +
            `───────────────\n` +
            `Баланс автоматически обновлён на сайте www.zenri.uz 🎯`;

          await sendTelegramMessage(chatId, reply);
          return NextResponse.json({ ok: true });
        }
      }
    }

    const displayName = [first_name, last_name].filter(Boolean).join(' ') || username || `User_${telegramId}`;
    const syntheticEmail = `tg_${telegramId}@telegram.zenri.app`;

    // Generate 6-digit code with 15-minute expiration
    const sixDigitCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const codePayload = `TGCODE:${sixDigitCode}:${expiresAt}`;

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
              passwordHash: codePayload,
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
                passwordHash: codePayload,
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
            passwordHash: codePayload,
          },
        });
      }

      if (user) {
        userId = user.id;

        if (user.isBlocked) {
          const blockNotice =
            `🚫 <b>Доступ к ZenRI приостановлен</b>\n\n` +
            `Ваш аккаунт был временно заблокирован администратором.\n` +
            (user.blockReason ? `\n📌 <b>Причина:</b> <i>${user.blockReason}</i>\n` : '') +
            `\nЕсли вы считаете, что это ошибка, пожалуйста, обратитесь к поддержке.`;

          await sendTelegramMessage(chatId, blockNotice);
          return NextResponse.json({ ok: true });
        }
      }
    } catch (dbErr) {
      console.error('DB user creation/update error in webhook:', dbErr);
    }

    // Also save in fast memory store
    saveTelegramAuthCode(sixDigitCode, userId, telegramId, displayName);

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
      `💡 <b>Совет:</b> Вы можете писать прямо в этот бот свои расходы (например: <code>Такси 25000</code> или <code>Обед 45000</code>) — они автоматически запишутся на ваш сайт!\n\n` +
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
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', service: 'ZenRI Telegram Bot Webhook' });
}

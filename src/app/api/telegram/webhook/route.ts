import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CurrencyCode } from '@prisma/client';
import {
  sendTelegramMessage,
  answerCallbackQuery,
  editTelegramMessageText,
  createMagicLoginToken,
  getTelegramAvatarUrl,
  saveTelegramAuthCode,
} from '@/lib/telegramBot';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // ─── 1. Handle Inline Button Callback Queries (Approve / Reject / Edit) ───
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbId = cb.id;
      const dataStr = cb.data || '';
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;
      const telegramId = String(cb.from?.id);

      await answerCallbackQuery(cbId);

      const user = await prisma.user.findUnique({ where: { telegramId } });
      if (!user || !chatId || !messageId) {
        return NextResponse.json({ ok: true });
      }

      if (dataStr.startsWith('approve:')) {
        // Format: approve:TYPE:AMOUNT:CATEGORY
        const [, type, amountStr, categoryName] = dataStr.split(':');
        const amount = parseInt(amountStr, 10) || 0;
        const txType = (type === 'INCOME' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE';

        if (amount > 0) {
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
              type: txType,
              amount,
              comment: categoryName || (txType === 'INCOME' ? 'Доход' : 'Расход'),
              date: new Date(),
            },
          });

          // Update account balance
          if (txType === 'INCOME') {
            await prisma.account.update({
              where: { id: account.id },
              data: { currentBalance: { increment: amount } },
            });
          } else {
            await prisma.account.update({
              where: { id: account.id },
              data: { currentBalance: { decrement: amount } },
            });
          }

          const approvedNotice =
            `✅ <b>Транзакция успешно одобрена и записана!</b>\n\n` +
            `📌 <b>Тип:</b> ${txType === 'INCOME' ? 'Доход 💰' : 'Расход 💸'}\n` +
            `💰 <b>Сумма:</b> ${amount.toLocaleString('ru-RU')} сум\n` +
            `🏷 <b>Категория:</b> ${categoryName || 'Общее'}\n` +
            `───────────────\n` +
            `🎯 Баланс обновлён на сайте www.zenri.uz`;

          await editTelegramMessageText(chatId, messageId, approvedNotice);
        }
      } else if (dataStr === 'reject') {
        const rejectedNotice =
          `❌ <b>Транзакция отклонена и отменена.</b>\n\n` +
          `Никаких изменений в вашем балансе не произведено.`;

        await editTelegramMessageText(chatId, messageId, rejectedNotice);
      } else if (dataStr === 'edit') {
        const editNotice =
          `✏️ <b>Редактирование записи:</b>\n\n` +
          `Отправьте скорректированную запись текстом прямо в чат в формате:\n` +
          `• <code>Расход 25000 Такси</code>\n` +
          `• <code>Доход 500000 Зарплата</code>\n` +
          `• <code>Еда 35000</code>`;

        await sendTelegramMessage(chatId, editNotice);
      }

      return NextResponse.json({ ok: true });
    }

    // ─── 2. Handle Text & Voice Messages ───
    const message = update?.message || update?.edited_message;
    if (!message || !message.from) {
      return NextResponse.json({ ok: true });
    }

    const { id: telegramIdNum, first_name, last_name, username } = message.from;
    const chatId = message.chat.id;
    const telegramId = String(telegramIdNum);
    const text = (message.text || '').trim();

    let user = await prisma.user.findUnique({ where: { telegramId } });

    // AI Parsing Algorithm for Quick Expense/Income messages
    if (text && !text.startsWith('/start') && user) {
      const isIncomeKeyword = text.toLowerCase().includes('доход') || text.toLowerCase().includes('приход') || text.toLowerCase().includes('зарплата') || text.toLowerCase().includes('получил');
      const txType = isIncomeKeyword ? 'INCOME' : 'EXPENSE';

      // Match amount digits
      const match = text.match(/(\d+[\d\s]*)/);
      if (match) {
        const rawAmount = match[1].replace(/\s/g, '');
        const amount = parseInt(rawAmount, 10);

        if (!isNaN(amount) && amount > 0) {
          // Extract category word
          let categoryName = text.replace(/(\d+[\d\s]*)/, '').replace(/(расход|доход|приход|сум|сумов|сомони|uzs)/gi, '').trim();
          if (!categoryName) {
            categoryName = txType === 'INCOME' ? 'Доход' : 'Такси / Еда / Разное';
          }

          // Render AI Draft Confirmation Card with Interactive Inline Buttons
          const draftNotice =
            `🤖 <b>ИИ-Анализ транзакции</b>\n\n` +
            `📌 <b>Тип:</b> ${txType === 'INCOME' ? 'Доход 💰' : 'Расход 💸'}\n` +
            `💰 <b>Сумма:</b> ${amount.toLocaleString('ru-RU')} сум\n` +
            `🏷 <b>Категория:</b> ${categoryName}\n` +
            `───────────────\n` +
            `<i>Проверьте данные и выберите действие:</i>`;

          const inlineKeyboard = {
            inline_keyboard: [
              [
                {
                  text: '✅ Одобрить',
                  callback_data: `approve:${txType}:${amount}:${categoryName}`,
                },
                {
                  text: '✏️ Изменить',
                  callback_data: `edit`,
                },
                {
                  text: '❌ Отклонить',
                  callback_data: `reject`,
                },
              ],
            ],
          };

          await sendTelegramMessage(chatId, draftNotice, inlineKeyboard);
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

    let avatarUrl: string | null = null;
    try {
      avatarUrl = await getTelegramAvatarUrl(telegramIdNum);
    } catch {
      // ignore
    }

    let userId: string = telegramId;

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

            const defaultCategories = [
              { name: 'Продукты', type: 'EXPENSE' as const, icon: 'shopping-cart', color: '#3B82F6' },
              { name: 'Кафе и рестораны', type: 'EXPENSE' as const, icon: 'coffee', color: '#F59E0B' },
              { name: 'Транспорт', type: 'EXPENSE' as const, icon: 'car', color: '#EF4444' },
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

    saveTelegramAuthCode(sixDigitCode, userId, telegramId, displayName);

    const magicToken = createMagicLoginToken(userId, telegramId);
    const loginUrl = `https://www.zenri.uz/auth/telegram-callback?token=${magicToken}`;

    const welcomeText =
      `👋 Здравствуйте, <b>${displayName}</b>!\n\n` +
      `✨ Добро пожаловать в <b>ZenRI Life OS</b>.\n\n` +
      `🔑 <b>Ваш 6-значный код для входа на сайт:</b>\n\n` +
      `👉 <code>${sixDigitCode}</code> 👈\n\n` +
      `<i>(Нажмите на код чтобы скопировать. Введите его на сайте www.zenri.uz — номер телефона вводить не нужно!)</i>\n\n` +
      `💡 <b>Умный учёт через Telegram:</b>\n` +
      `Напишите прямо в этот чат, например: <code>Такси 25000</code> или <code>Доход 500000 Зарплата</code> — ИИ распознает сумму, тип и категорию, и пришлёт карточку для подтверждения с кнопками [✅ Одобрить] [✏️ Изменить] [❌ Отклонить]!\n\n` +
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

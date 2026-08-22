import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { CurrencyCode } from '@prisma/client';

// Verify Telegram Login Widget data authenticity using HMAC-SHA256
function verifyTelegramData(data: Record<string, string>, botToken: string): boolean {
  const { hash, ...rest } = data;
  if (!hash) return false;

  // Build check string: sorted key=value pairs joined by \n
  const checkStr = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');

  // Key is SHA-256 hash of bot token
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(checkStr).digest('hex');

  return computedHash === hash;
}

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { id: telegramId, first_name, last_name, username, photo_url, auth_date } = params;

    if (!telegramId) {
      return NextResponse.json({ error: 'No Telegram ID provided' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8797376988:AAEJJbESQHyr5apAbhOlLm3mKq1FX3OC2sw';
    if (!botToken) {
      return NextResponse.json({ error: 'Telegram bot not configured.' }, { status: 503 });
    }

    // Verify data freshness (max 10 minutes old)
    const authTime = parseInt(auth_date || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authTime > 600) {
      return NextResponse.json({ error: 'Auth data expired' }, { status: 401 });
    }

    // Verify hash
    const isValid = verifyTelegramData(params, botToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Find or create user
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || username || `User_${telegramId}`;
    // Telegram users get a synthetic email to satisfy the unique email constraint
    const syntheticEmail = `tg_${telegramId}@telegram.zenri.app`;

    let user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      // Check if email already exists (edge case)
      const existingByEmail = await prisma.user.findUnique({ where: { email: syntheticEmail } });

      if (existingByEmail) {
        // Link telegram to existing
        user = await prisma.user.update({
          where: { email: syntheticEmail },
          data: { telegramId, telegramUsername: username, avatarUrl: photo_url || null },
        });
      } else {
        // Create new user
        user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: displayName,
              email: syntheticEmail,
              telegramId,
              telegramUsername: username || null,
              avatarUrl: photo_url || null,
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

          // Create default categories
          const defaultCategories = [
            { name: 'Продукты', type: 'EXPENSE' as const, icon: 'shopping-cart', color: '#3B82F6' },
            { name: 'Кафе и рестораны', type: 'EXPENSE' as const, icon: 'coffee', color: '#F59E0B' },
            { name: 'Транспорт', type: 'EXPENSE' as const, icon: 'car', color: '#EF4444' },
            { name: 'Зарплата', type: 'INCOME' as const, icon: 'briefcase', color: '#10B981' },
            { name: 'Фриланс', type: 'INCOME' as const, icon: 'trending-up', color: '#059669' },
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
      // Update avatar/username if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: username || user.telegramUsername,
          avatarUrl: photo_url || user.avatarUrl,
        },
      });
    }

    // Check if user is blocked by Admin
    if (user.isBlocked) {
      return NextResponse.json(
        { error: `🚫 Ваш доступ к приложению приостановлен администратором. ${user.blockReason ? `Причина: ${user.blockReason}` : ''}` },
        { status: 403 }
      );
    }

    // Return user data for NextAuth credentials sign-in
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    console.error('Telegram auth error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

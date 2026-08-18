import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8797376988:AAEJJbESQHyr5apAbhOlLm3mKq1FX3OC2sw';
const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'zenri_prod_jwt_secret_key_2026_zenri_app';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export function createMagicLoginToken(userId: string, telegramId: string): string {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
  const payload = `${userId}:${telegramId}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payload)
    .digest('hex');
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  return token;
}

export function verifyMagicLoginToken(token: string): { valid: boolean; userId?: string; telegramId?: string } {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = raw.split(':');
    if (parts.length !== 4) return { valid: false };

    const [userId, telegramId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false };
    }

    const payload = `${userId}:${telegramId}:${expiresAtStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(payload)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: true, userId, telegramId };
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, unknown>
) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    return null;
  }
}

export async function getTelegramAvatarUrl(telegramUserId: number | string): Promise<string | null> {
  try {
    const photosRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${telegramUserId}&limit=1`
    );
    const photosData = await photosRes.json();
    if (!photosData.ok || !photosData.result?.photos?.length) {
      return null;
    }

    const photoSizes = photosData.result.photos[0];
    const largestPhoto = photoSizes[photoSizes.length - 1];
    if (!largestPhoto?.file_id) return null;

    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${largestPhoto.file_id}`
    );
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) return null;

    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
  } catch (err) {
    console.error('Failed to get Telegram avatar:', err);
    return null;
  }
}

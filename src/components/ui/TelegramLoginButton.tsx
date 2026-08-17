'use client';

import { useEffect, useRef, useCallback } from 'react';
import { signIn } from 'next-auth/react';

interface TelegramLoginButtonProps {
  botUsername?: string;
  onError?: (msg: string) => void;
  onLoading?: (v: boolean) => void;
}

declare global {
  interface Window {
    TelegramLoginCallback?: (user: Record<string, string>) => void;
  }
}

export function TelegramLoginButton({ botUsername, onError, onLoading }: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTelegramAuth = useCallback(
    async (tgUser: Record<string, string>) => {
      onLoading?.(true);
      try {
        // Step 1: Verify with our backend and get/create DB user
        const params = new URLSearchParams(tgUser as Record<string, string>);
        const res = await fetch(`/api/auth/telegram?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          onError?.(data.error || 'Ошибка входа через Telegram');
          onLoading?.(false);
          return;
        }

        // Step 2: Sign in via NextAuth telegram provider using the verified user ID
        const signInRes = await signIn('telegram', {
          userId: data.user.id,
          redirect: false,
        });

        if (signInRes?.error) {
          onError?.('Не удалось создать сессию');
          onLoading?.(false);
        } else {
          window.location.href = '/dashboard';
        }
      } catch {
        onError?.('Произошла ошибка. Попробуйте ещё раз.');
        onLoading?.(false);
      }
    },
    [onError, onLoading]
  );

  useEffect(() => {
    window.TelegramLoginCallback = handleTelegramAuth;
    return () => {
      delete window.TelegramLoginCallback;
    };
  }, [handleTelegramAuth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !botUsername) return;

    // Remove any existing widget
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'TelegramLoginCallback(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    container.appendChild(script);
  }, [botUsername]);

  if (!botUsername) {
    return (
      <div className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-slate-600 text-slate-500 text-xs font-bold text-center flex items-center justify-center gap-2">
        <span>✈️</span>
        <span>Telegram не настроен (требуется BOT_TOKEN)</span>
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center items-center min-h-[54px]" />;
}

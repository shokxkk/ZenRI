'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Send, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

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

export function TelegramLoginButton({
  botUsername = 'zenriauthefication_bot',
  onError,
  onLoading,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [domainWarning, setDomainWarning] = useState(false);

  const handleTelegramAuth = useCallback(
    async (tgUser: Record<string, string>) => {
      onLoading?.(true);
      try {
        const params = new URLSearchParams(tgUser as Record<string, string>);
        const res = await fetch(`/api/auth/telegram?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          onError?.(data.error || 'Ошибка входа через Telegram');
          onLoading?.(false);
          return;
        }

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
        onError?.('Произошла ошибка соединения с сервером');
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
    if (!container) return;

    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '14');
    script.setAttribute('data-onauth', 'TelegramLoginCallback(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    script.onload = () => setWidgetLoaded(true);

    container.appendChild(script);

    // Check if running on localhost or non-zenri domain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setDomainWarning(true);
      }
    }
  }, [botUsername]);

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      {/* Official Telegram Widget Container */}
      <div
        ref={containerRef}
        className="flex justify-center items-center min-h-[50px] transition-all"
      />

      {/* Direct Telegram Bot Action Button */}
      <a
        href={`https://t.me/${botUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3.5 px-4 rounded-2xl bg-[#229ED9] hover:bg-[#1E8EC4] text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <Send size={15} className="fill-white" />
        <span>Открыть бота @{botUsername}</span>
        <ExternalLink size={13} className="opacity-80" />
      </a>

      {/* Localhost / domain notice */}
      {domainWarning && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed space-y-1 text-left w-full">
          <p className="font-bold flex items-center gap-1.5 text-amber-200">
            <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />
            Инструкция для работы кнопки на сайте zenri.uz:
          </p>
          <p className="text-slate-300">
            В Telegram у <b>@BotFather</b> отправьте команду: <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">/setdomain</code> → выберите <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">@{botUsername}</code> → укажите <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">zenri.uz</code>
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Sparkles, Send, Bot, User as UserIcon, RefreshCw, Zap } from 'lucide-react';
import { askChatGPT, Message } from '@/app/actions/aiActions';
import { AIPredictWidget } from '@/components/ui/AIPredictWidget';

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[\{\}]/g, '');
}

export function AIClient({ userName }: { userName: string }) {
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Привет, ${userName}! 👋\n\nЯ ваш персональный AI-финансовый ассистент на базе ChatGPT. Я проанализировал ваши текущие счета, доходы и расходы в ZenRI.\n\nЧем я могу вам помочь сегодня?`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isPending) return;

    const userMsg: Message = { role: 'user', content: query };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    if (!textToSend) setInput('');

    startTransition(async () => {
      const apiHistory = updatedMessages.filter((m) => m.role !== 'system');
      const customKey = typeof window !== 'undefined' ? localStorage.getItem('zenri_custom_openai_key') || undefined : undefined;
      const reply = await askChatGPT(apiHistory, customKey);
      const cleanedReply = cleanText(reply);

      setMessages((prev) => [...prev, { role: 'assistant', content: cleanedReply }]);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100 flex items-center gap-2">
          <Sparkles className="text-[#0066FF]" size={24} />
          AI Ассистент ChatGPT
        </h1>
        <p className="text-xs text-zen-400 mt-0.5">
          Интеллектуальный советник с реальным анализом ваших финансов ZenRI
        </p>
      </div>

      {/* Embedded AI Predict Pro Module */}
      <AIPredictWidget
        monthlyIncome={12000000}
        monthlyExpense={545000}
        topCategoryName="Кафе и рестораны"
        topCategoryAmount={340000}
      />

      {/* Quick Prompts */}
      <div>
        <p className="text-xs font-bold text-zen-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
          <Zap size={13} className="text-[#0066FF]" /> Быстрые вопросы для ChatGPT
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            '📊 Проанализируй мои расходы за этот месяц',
            '💡 Как мне накопить 28 млн сум быстрее?',
            '☕️ Сколько я трачу на Кафе и развлечения?',
            '🎯 Дай 3 совета по финансовой свободе',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              disabled={isPending}
              className="text-left p-3 rounded-2xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 text-xs font-bold text-zen-800 dark:text-zen-200 hover:border-[#0066FF] hover:text-[#0066FF] dark:hover:text-[#00C2FF] transition-all shadow-apple card-hover disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ChatGPT Interactive Chat Box */}
      <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card shadow-2xl flex flex-col h-[480px] overflow-hidden">
        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] text-white flex items-center justify-center flex-shrink-0 shadow-glow font-bold text-xs">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0066FF] text-white font-medium rounded-tr-none shadow-glow'
                    : 'bg-zen-100 dark:bg-zen-900/80 text-zen-900 dark:text-zen-100 border border-zen-200/60 dark:border-zen-800/60 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {cleanText(msg.content)}
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0055FF] to-[#8B5CF6] text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
                  <UserIcon size={16} />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isPending && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot size={18} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-zen-100 dark:bg-zen-900/80 border border-zen-200/60 dark:border-zen-800 text-xs text-zen-400 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-[#0066FF]" />
                <span>ChatGPT обрабатывает ваш запрос...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="p-4 bg-zen-50 dark:bg-zen-950/60 border-t border-zen-200 dark:border-zen-800/60 flex items-center gap-3">
          <input
            type="text"
            placeholder="Спросите ChatGPT о финансах, бюджете или задачах..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            className="flex-1 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 text-xs text-zen-900 dark:text-zen-100 placeholder-zen-400 focus:outline-none focus:border-[#0066FF] font-medium transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={isPending || !input.trim()}
            className="w-11 h-11 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white flex items-center justify-center shadow-glow transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
            title="Отправить запрос ChatGPT"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

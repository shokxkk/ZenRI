'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

export const ThemeToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored
      ? stored === 'dark'
      : document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;

    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
      soundFx.playToggleOff();
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
      soundFx.playToggleOn();
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl text-zen-400 hover:text-zen-900 dark:hover:text-zen-100 bg-zen-100 dark:bg-zen-800/80 transition-colors"
      title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

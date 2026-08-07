import React from 'react';

interface ZenLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const ZenLogo: React.FC<ZenLogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Modern Stylized Gradient 'Z' Emblem with Dot (as in Image 4) */}
      <div className={`relative flex items-center justify-center flex-shrink-0 ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="zenLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C2FF" />
              <stop offset="100%" stopColor="#0055FF" />
            </linearGradient>
          </defs>

          {/* Top Bar of Z */}
          <rect x="18" y="18" width="56" height="18" rx="9" fill="url(#zenLogoGradient)" />
          {/* Diagonal Slash of Z */}
          <path
            d="M68 28 L28 72 C25 75 29 80 34 80 L52 80 C56 80 60 76 60 72 Z"
            fill="url(#zenLogoGradient)"
          />
          {/* Floating Dot (Dot of RI/Zen) */}
          <circle cx="75" cy="72" r="11" fill="url(#zenLogoGradient)" />
        </svg>
      </div>

      <div className="flex flex-col justify-center">
        <span className={`font-bold tracking-tight text-zen-900 dark:text-white ${textClasses[size]}`}>
          Zen<span className="bg-gradient-to-r from-[#00C2FF] to-[#0055FF] bg-clip-text text-transparent">RI</span>
        </span>
      </div>
    </div>
  );
};

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
      <div className={`relative flex items-center justify-center flex-shrink-0 ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(0,194,255,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="zenLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="50%" stopColor="#00A3FF" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>
          </defs>

          {/* Top Bar of Z */}
          <rect x="22" y="24" width="46" height="16" rx="8" fill="url(#zenLogoGrad)" />
          {/* Diagonal Slash of Z */}
          <polygon points="68,24 42,74 24,74 50,24" fill="url(#zenLogoGrad)" />
          {/* Bottom Pill Cap */}
          <circle cx="33" cy="74" r="9" fill="url(#zenLogoGrad)" />
          {/* Floating Dot */}
          <circle cx="74" cy="74" r="8.5" fill="url(#zenLogoGrad)" />
        </svg>
      </div>

      <div className="flex flex-col justify-center">
        <span className={`font-black tracking-tight text-zen-900 dark:text-white ${textClasses[size]}`}>
          Zen<span className="bg-gradient-to-r from-[#00E5FF] via-[#00A3FF] to-[#0066FF] bg-clip-text text-transparent">RI</span>
        </span>
      </div>
    </div>
  );
};

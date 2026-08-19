// Векторные флаги стран для выбора языка в ZenRI
// Точные SVG флаги: Россия, Узбекистан, США

import React from 'react';

interface FlagProps {
  size?: number;
  className?: string;
}

/** 🇷🇺 Флаг России — три горизонтальные полосы: белая, синяя, красная */
export const FlagRussia: React.FC<FlagProps> = ({ size = 48, className = '' }) => (
  <svg
    width={size}
    height={Math.round(size * 0.667)}
    viewBox="0 0 900 600"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ borderRadius: 4 }}
  >
    <rect width="900" height="200" y="0" fill="#FFFFFF" />
    <rect width="900" height="200" y="200" fill="#0037A5" />
    <rect width="900" height="200" y="400" fill="#D52B1E" />
  </svg>
);

/** 🇺🇿 Флаг Узбекистана — голубая, белая, зелёная полосы с полумесяцем и звёздами */
export const FlagUzbekistan: React.FC<FlagProps> = ({ size = 48, className = '' }) => (
  <svg
    width={size}
    height={Math.round(size * 0.5)}
    viewBox="0 0 900 450"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ borderRadius: 4 }}
  >
    {/* Голубая полоса */}
    <rect width="900" height="150" y="0" fill="#1EB2E0" />
    {/* Тонкая белая линия-сепаратор */}
    <rect width="900" height="15" y="150" fill="#FFFFFF" />
    {/* Белая центральная полоса */}
    <rect width="900" height="120" y="165" fill="#FFFFFF" />
    {/* Тонкая белая линия-сепаратор */}
    <rect width="900" height="15" y="285" fill="#FFFFFF" />
    {/* Зелёная полоса */}
    <rect width="900" height="150" y="300" fill="#1EB53A" />

    {/* Полумесяц (белый) */}
    <circle cx="100" cy="75" r="50" fill="#FFFFFF" />
    <circle cx="120" cy="75" r="42" fill="#1EB2E0" />

    {/* 12 звёзд (белые) — три ряда по 4 */}
    {[0, 1, 2, 3].map(i => (
      <polygon
        key={`s1-${i}`}
        points="0,-8 1.9,-5.9 6.2,-6.2 4,-3.1 7.6,0 4,1.2 6.2,5.2 1.9,3.3 0,7.6 -1.9,3.3 -6.2,5.2 -4,1.2 -7.6,0 -4,-3.1 -6.2,-6.2 -1.9,-5.9"
        fill="#FFFFFF"
        transform={`translate(${170 + i * 36}, 55) scale(0.85)`}
      />
    ))}
    {[0, 1, 2, 3].map(i => (
      <polygon
        key={`s2-${i}`}
        points="0,-8 1.9,-5.9 6.2,-6.2 4,-3.1 7.6,0 4,1.2 6.2,5.2 1.9,3.3 0,7.6 -1.9,3.3 -6.2,5.2 -4,1.2 -7.6,0 -4,-3.1 -6.2,-6.2 -1.9,-5.9"
        fill="#FFFFFF"
        transform={`translate(${152 + i * 36}, 90) scale(0.85)`}
      />
    ))}
    {[0, 1, 2, 3].map(i => (
      <polygon
        key={`s3-${i}`}
        points="0,-8 1.9,-5.9 6.2,-6.2 4,-3.1 7.6,0 4,1.2 6.2,5.2 1.9,3.3 0,7.6 -1.9,3.3 -6.2,5.2 -4,1.2 -7.6,0 -4,-3.1 -6.2,-6.2 -1.9,-5.9"
        fill="#FFFFFF"
        transform={`translate(${170 + i * 36}, 125) scale(0.85)`}
      />
    ))}
  </svg>
);

/** 🇺🇸 Флаг США — 13 чередующихся полос + синий кантон со звёздами */
export const FlagUSA: React.FC<FlagProps> = ({ size = 48, className = '' }) => {
  const h = Math.round(size * 0.526); // соотношение 1:1.9
  const stripeH = h / 13;

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 1900 1000"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: 4 }}
    >
      {/* 13 полос: 7 красных, 6 белых */}
      {Array.from({ length: 13 }, (_, i) => (
        <rect
          key={`stripe-${i}`}
          x="0"
          y={i * (1000 / 13)}
          width="1900"
          height={1000 / 13 + 1}
          fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
        />
      ))}

      {/* Синий кантон (union) — 7/13 высоты, 2/5 ширины */}
      <rect x="0" y="0" width="760" height={7 * (1000 / 13)} fill="#3C3B6E" />

      {/* 50 звёзд — 5 рядов по 6 и 4 ряда по 5 (чередование) */}
      {(() => {
        const stars = [];
        const starSize = 38;
        const cantonW = 760;
        const cantonH = 7 * (1000 / 13);
        const colSpacing = cantonW / 12;
        const rowSpacing = cantonH / 10;

        for (let row = 0; row < 9; row++) {
          const cols = row % 2 === 0 ? 6 : 5;
          const xOffset = row % 2 === 0 ? colSpacing : colSpacing * 2;
          for (let col = 0; col < cols; col++) {
            const cx = xOffset + col * (cantonW / (row % 2 === 0 ? 6 : 5)) * (row % 2 === 0 ? (5 / 6) : 1) + (row % 2 === 0 ? 0 : colSpacing * 0.5);
            const cy = rowSpacing + row * rowSpacing;
            stars.push(
              <polygon
                key={`star-${row}-${col}`}
                points={generateStarPoints(cx, cy, starSize, starSize * 0.4, 5)}
                fill="#FFFFFF"
              />
            );
          }
        }
        return stars;
      })()}
    </svg>
  );
};

function generateStarPoints(
  cx: number, cy: number,
  outerR: number, innerR: number,
  points: number
): string {
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    coords.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return coords.join(' ');
}

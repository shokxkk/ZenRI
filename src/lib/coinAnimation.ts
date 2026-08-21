'use client';

import { soundFx } from './soundEffects';

/**
 * Triggers haptic vibration on mobile devices
 */
export function triggerHaptic(pattern: number | number[] = 40) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignored if browser blocks vibration
    }
  }
}

/**
 * Spawns 3D animated coins flying from click point to balance card
 */
export function triggerFlyingCoins(originX?: number, originY?: number, isIncome: boolean = false) {
  if (typeof window === 'undefined') return;

  // 1. Trigger Haptic Vibration
  triggerHaptic([30, 40, 50]);

  // 2. Play Coin Sound
  soundFx.playCoin();

  // 3. Calculate start coordinates
  const startX = originX ?? window.innerWidth / 2;
  const startY = originY ?? window.innerHeight / 2;

  // Target: Hero balance card area (top left center)
  const targetX = Math.min(window.innerWidth * 0.4, 300);
  const targetY = 180;

  const coinCount = 12;
  const symbol = isIncome ? '🪙' : '💸';

  for (let i = 0; i < coinCount; i++) {
    const coin = document.createElement('div');
    coin.innerText = symbol;
    coin.className = 'fixed z-50 pointer-events-none select-none text-2xl filter drop-shadow-lg';

    // Random initial offset spread
    const offsetX = (Math.random() - 0.5) * 120;
    const offsetY = (Math.random() - 0.5) * 120;
    const initialX = startX + offsetX;
    const initialY = startY + offsetY;

    coin.style.left = `${initialX}px`;
    coin.style.top = `${initialY}px`;
    coin.style.opacity = '1';
    coin.style.transform = `scale(${0.6 + Math.random() * 0.8}) rotate(${Math.random() * 360}deg)`;
    coin.style.transition = `all ${0.7 + Math.random() * 0.5}s cubic-bezier(0.18, 0.89, 0.32, 1.28)`;

    document.body.appendChild(coin);

    // Animate to target
    setTimeout(() => {
      coin.style.left = `${targetX + (Math.random() - 0.5) * 60}px`;
      coin.style.top = `${targetY + (Math.random() - 0.5) * 40}px`;
      coin.style.opacity = '0';
      coin.style.transform = 'scale(0.3) rotate(720deg)';
    }, 50 + i * 40);

    // Remove element
    setTimeout(() => {
      if (document.body.contains(coin)) {
        document.body.removeChild(coin);
      }
    }, 1400);
  }
}

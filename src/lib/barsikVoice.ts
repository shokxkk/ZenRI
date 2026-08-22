'use client';

/**
 * Enhanced Neural Speech Synthesis for Mascot Barsik
 * Selects the highest quality natural/neural voice available on device (Edge Natural, Google Neural, Apple Natural)
 * Adjusts pitch, rate & timbre to sound like a friendly, energetic snow leopard cub AI assistant.
 */
export function speakBarsikVoice(text: string, isMuted: boolean = false) {
  if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    // Clean text for speech (remove markdown symbols like *, #, _, etc.)
    const cleanText = text
      .replace(/[\*\_~`#]/g, '')
      .replace(/[\u1F600-\u1F64F]/g, '') // remove emojis if any disrupt speech
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05; // Lively, natural pace
    utterance.pitch = 1.12; // Friendly, youthful mascot tone

    const speakWithVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Find highest quality Russian neural voice candidate
        const ruVoices = voices.filter((v) => v.lang.startsWith('ru') || v.lang.startsWith('RU'));

        const bestVoice =
          ruVoices.find((v) => v.name.includes('Natural') || v.name.includes('Neural')) ||
          ruVoices.find((v) => v.name.includes('Google') || v.name.includes('Yandex')) ||
          ruVoices.find((v) => v.name.includes('Pavel') || v.name.includes('Dmitry') || v.name.includes('Svetlana')) ||
          ruVoices.find((v) => v.name.includes('Yuri') || v.name.includes('Milena') || v.name.includes('Katya')) ||
          ruVoices[0] ||
          voices.find((v) => v.lang.includes('ru')) ||
          null;

        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speakWithVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        speakWithVoice();
      };
      // Fallback
      setTimeout(speakWithVoice, 100);
    }
  } catch (err) {
    console.error('Speech synthesis error:', err);
  }
}

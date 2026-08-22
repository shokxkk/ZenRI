/**
 * Barsik Speech Synthesis Engine - Disabled per user request
 */
export function speakBarsikVoice(text: string, isMuted: boolean = false) {
  // Voice output disabled
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

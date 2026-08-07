/**
 * Converts any audio Blob (webm, ogg, etc.) to WAV format
 * using the browser's Web Audio API (AudioContext).
 * Returns a WAV Blob that Aisha STT accepts.
 */
export async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const arrayBuffer = await audioBlob.arrayBuffer();

  // Use AudioContext to decode the compressed audio
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  let audioBuffer: AudioBuffer;

  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    await audioCtx.close();
  }

  // Mix down to mono at 16kHz for optimal STT
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;

  // Get audio data from the first channel (mono)
  const channelData = audioBuffer.getChannelData(0);

  // Build WAV file
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);       // file size - 8
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);                         // chunk size
  view.setUint16(20, 1, true);                          // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true);            // block align
  view.setUint16(34, 16, true);                         // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);             // data chunk size

  // PCM samples (Float32 → Int16)
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

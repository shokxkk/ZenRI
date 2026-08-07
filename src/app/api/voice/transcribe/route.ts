import { NextRequest, NextResponse } from 'next/server';

const AISHA_STT_URL = 'https://back.aisha.group/api/v1/stt/post/';
const AISHA_API_KEY = process.env.AISHA_STT_API_KEY || 'MAw6WUgS.SRBPzk0ZCogC2TxhUF3FCsjOkuapRIM5';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = (formData.get('language') as string) || 'ru';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Determine extension from mime type
    const mimeType = audioFile.type || 'audio/wav';
    let ext = 'wav';
    if (mimeType.includes('ogg')) ext = 'ogg';
    else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'mp4';
    else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) ext = 'mp3';

    const filename = `voice.${ext}`;

    // Convert File to Buffer then re-create Blob
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBlob = new Blob([buffer], { type: mimeType });

    // Build FormData for Aisha STT API
    const aishaFormData = new FormData();
    aishaFormData.append('audio', audioBlob, filename);
    aishaFormData.append('language', language);
    aishaFormData.append('has_diarization', 'false');

    console.log(`[STT] Sending: ${filename}, size: ${buffer.length} bytes, lang: ${language}`);

    // Append language=ru to query param as well to ensure Aisha STT forces Russian model
    const targetUrl = `${AISHA_STT_URL}?language=${encodeURIComponent(language)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': AISHA_API_KEY,
          'Accept-Language': language,
        },
        body: aishaFormData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = await response.text();
    console.log(`[STT] Status: ${response.status}, body: ${rawText.slice(0, 300)}`);

    if (!response.ok) {
      let errorMsg = 'Речь не распознана. Попробуйте повторить громче.';
      try {
        const errJson = JSON.parse(rawText);
        if (errJson.error_key === 'audio_file_empty') {
          errorMsg = 'Речь не обнаружена. Говорите громче и ближе к микрофону.';
        } else if (errJson.error_key === 'stt_transcription_failed' || response.status === 503) {
          errorMsg = 'Не удалось разобрать речь. Пожалуйста, повторите чуть громче и чётче.';
        } else if (errJson.detail) {
          errorMsg = errJson.detail;
        } else if (errJson.error) {
          errorMsg = errJson.error;
        }
      } catch { /* not JSON */ }

      if (response.status === 402) errorMsg = 'Недостаточно баланса на STT сервисе';
      else if (response.status === 403) errorMsg = 'Нет доступа к STT сервису (проверьте API ключ)';

      return NextResponse.json({ error: errorMsg, status: response.status });
    }

    let data: { transcript?: string; duration?: number; id?: number };
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'Некорректный ответ от STT сервиса' });
    }

    return NextResponse.json({
      transcript: data.transcript || '',
      duration: data.duration,
      id: data.id,
    });
  } catch (error) {
    console.error('Voice transcribe error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Ошибка подключения: ${msg}` }, { status: 500 });
  }
}

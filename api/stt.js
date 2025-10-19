import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Expect JSON: { audioBase64: string, mimeType: string }
    const { audioBase64, mimeType } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing audioBase64' });
    }
    const contentType = typeof mimeType === 'string' ? mimeType : 'audio/webm';

    const buffer = Buffer.from(audioBase64, 'base64');

    // Use Web API File polyfill via openai helpers where available
    // Fallback: construct a WebFile if environment supports
    const webFile = new File([buffer], 'audio', { type: contentType });

    const transcript = await openai.audio.transcriptions.create({
      model: 'gpt-4o-mini-transcribe',
      file: webFile,
    });

    const text = transcript?.text || '';
    return res.status(200).json({ text });
  } catch (error) {
    console.error('OpenAI STT API error:', error);
    return res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
}



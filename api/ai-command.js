import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side env var (no VITE_ prefix)
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward the exact OpenAI request from client
    const response = await openai.chat.completions.create(req.body);
    
    // Return the response
    res.status(200).json(response);
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return user-friendly error
    res.status(500).json({ 
      error: 'AI service unavailable',
      details: error.message 
    });
  }
}

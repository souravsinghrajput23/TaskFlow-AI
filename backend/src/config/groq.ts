import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || '';

if (!apiKey || apiKey === 'gsk_placeholder_key') {
  console.warn('WARNING: GROQ_API_KEY is not configured or is a placeholder. AI features will fail or return mock responses.');
}

const groq = new Groq({
  apiKey: apiKey,
});

export default groq;

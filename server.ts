import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy GoogleGenAI client accessor
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not set in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder ordered by availability and latency
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackResult {
  text: string;
  modelUsed: string;
}

/**
 * Executes content generation with automated fallback ladder across model tiers
 */
async function generateContentWithFallback(
  systemInstruction: string,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
): Promise<FallbackResult> {
  const ai = getGenAI();
  let lastError: unknown = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        contents,
      });

      const responseText = response.text || '';
      if (responseText.trim()) {
        return { text: responseText, modelUsed: modelName };
      }
    } catch (err: any) {
      lastError = err;
      // Recoverable error (e.g. 503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED, 404 NOT_FOUND).
      // Sleep briefly (200ms) before trying the next tier in the ladder.
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.error('[Gemini API] All model fallbacks failed. Last error:', lastError);
  throw lastError || new Error('All model fallbacks exhausted without output.');
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Gemini Multi-turn Reflection API Proxy
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    // Defensive payload ingestion with null-safe destructuring
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { category = 'general', mode = 'reflect', userPrompt = '', history = [] } = body;

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A non-empty userPrompt string is required.',
      });
    }

    // System instruction tailored to reflection mode and category
    const systemPrompt = `You are a thoughtful, empathetic, and insightful philosophical reflection partner and personal journal assistant.
Category context: "${category}".
Mode context: "${mode}".

Guidelines:
1. Provide deep, constructive, and articulate reflections.
2. In 'reflect' mode: Validate the user's feelings, offer thoughtful insights, ask 1-2 open-ended reflective questions to foster deeper self-awareness.
3. In 'summarize' mode: Provide a clear synopsis of the journal entry, key themes, and concrete next steps or actionable takeaways.
4. In 'brainstorm' mode: Provide 4-6 diverse, creative perspectives or angles to consider.
5. In 'critique' mode: Respectfully and constructively challenge cognitive biases or unexamined assumptions.
6. In 'action_items' mode: Extract clear, prioritized, practical actions the user can take.

Formatting: Use clean Markdown with headers, bullet points, and gentle emphasis. Keep your tone warm, grounded, and concise without being overly preachy.`;

    // Map conversation history into Gemini format
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg && typeof msg.content === 'string' && msg.content.trim()) {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    const result = await generateContentWithFallback(systemPrompt, contents);

    return res.json({
      success: true,
      reply: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error handling /api/gemini/reflect:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'An unexpected error occurred during AI reflection generation.',
    });
  }
});

// Start server with Vite middleware in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();

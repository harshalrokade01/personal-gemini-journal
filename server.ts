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
    hasGoogleMapsKey: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  });
});

// Secure Server-Side Reverse Geocoding API Proxy
// Protects Google Maps API Key from client exposure and provides seamless fallback
app.post('/api/location/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { latitude, longitude } = body;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        error: 'Valid numeric latitude (-90 to 90) and longitude (-180 to 180) are required.',
      });
    }

    const latFixed = latitude.toFixed(4);
    const lngFixed = longitude.toFixed(4);
    const formattedCoords = `${Math.abs(latitude).toFixed(3)}° ${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(3)}° ${longitude >= 0 ? 'E' : 'W'}`;

    let placeName = formattedCoords;
    let locality = '';
    let country = '';
    let formattedAddress = formattedCoords;

    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

    if (mapsKey) {
      try {
        const mapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${encodeURIComponent(mapsKey)}`;
        const mapsRes = await fetch(mapsUrl, { signal: AbortSignal.timeout(4000) });
        if (mapsRes.ok) {
          const mapsData = await mapsRes.json();
          if (mapsData.status === 'OK' && mapsData.results && mapsData.results.length > 0) {
            const result = mapsData.results[0];
            formattedAddress = result.formatted_address || formattedCoords;

            // Extract locality, state, country
            const components = result.address_components || [];
            let city = '';
            let state = '';
            let cName = '';

            for (const c of components) {
              if (c.types.includes('locality')) city = c.long_name;
              else if (!city && c.types.includes('sublocality')) city = c.long_name;
              else if (!city && c.types.includes('postal_town')) city = c.long_name;
              else if (c.types.includes('administrative_area_level_1')) state = c.short_name;
              else if (c.types.includes('country')) cName = c.long_name;
            }

            locality = city || state || '';
            country = cName || '';

            if (city && (state || cName)) {
              placeName = `${city}, ${state || cName}`;
            } else if (state && cName) {
              placeName = `${state}, ${cName}`;
            } else if (cName) {
              placeName = cName;
            } else {
              placeName = formattedAddress.split(',').slice(0, 2).join(', ').trim() || formattedCoords;
            }

            return res.json({
              success: true,
              latitude,
              longitude,
              placeName,
              locality,
              country,
              formattedAddress,
              source: 'google_maps',
            });
          }
        }
      } catch (mapsErr) {
        console.warn('Google Maps reverse geocoding fallback triggered:', mapsErr);
      }
    }

    // High-availability open geocoding fallback (Nominatim)
    try {
      const openUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
      const openRes = await fetch(openUrl, {
        headers: {
          'User-Agent': 'ReflectAI-Journal/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (openRes.ok) {
        const openData = await openRes.json();
        if (openData && openData.address) {
          const addr = openData.address;
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || '';
          const state = addr.state || addr.region || '';
          const cName = addr.country || '';

          locality = city || state;
          country = cName;

          if (city && (state || cName)) {
            placeName = `${city}, ${state || cName}`;
          } else if (state && cName) {
            placeName = `${state}, ${cName}`;
          } else if (cName) {
            placeName = cName;
          } else if (openData.display_name) {
            placeName = openData.display_name.split(',').slice(0, 2).join(', ').trim();
          }

          formattedAddress = openData.display_name || formattedCoords;

          return res.json({
            success: true,
            latitude,
            longitude,
            placeName: placeName || formattedCoords,
            locality,
            country,
            formattedAddress,
            source: 'open_geocoding',
          });
        }
      }
    } catch (openErr) {
      console.warn('Open geocoding fallback resolved to formatted coordinates:', openErr);
    }

    // Coordinate fallback if network geocoding is unavailable
    return res.json({
      success: true,
      latitude,
      longitude,
      placeName: formattedCoords,
      locality: '',
      country: '',
      formattedAddress: `Coordinates: ${latFixed}, ${lngFixed}`,
      source: 'coordinates_fallback',
    });
  } catch (error: any) {
    console.error('Error handling /api/location/reverse-geocode:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process reverse geocoding request.',
    });
  }
});

// Gemini Multi-turn Reflection API Proxy
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    // Defensive payload ingestion with null-safe destructuring
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { category = 'general', mode = 'reflect', userPrompt = '', history = [], location } = body;

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A non-empty userPrompt string is required.',
      });
    }

    let locationContext = '';
    if (location && typeof location === 'object') {
      if (location.placeName) {
        locationContext = `\nAttached Entry Location: "${location.placeName}". Gently reflect this setting only when natural or relevant to the mood/environment.`;
      } else if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        locationContext = `\nAttached Entry Coordinates: ${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}.`;
      }
    }

    // System instruction tailored to reflection mode, category, and location context
    const systemPrompt = `You are a thoughtful, empathetic, and insightful philosophical reflection partner and personal journal assistant.
Category context: "${category}".
Mode context: "${mode}".${locationContext}

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

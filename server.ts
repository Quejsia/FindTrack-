import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// High limit payload support for high-res base64 photo uploads
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ limit: '12mb', extended: true }));

// Lazy initializer for Gemini client to prevent startup failure if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined in system secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Ensure the server can provide health checks
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * API Route: Analyze Uploaded Image
 * Analyzes items from an image attachment and returns structured lost & found characteristics.
 */
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
       res.status(400).json({ error: 'imageBase64 and mimeType fields are required.' });
       return;
    }

    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };

    const promptString = `Analyze this image of a lost or found item. Extract details to auto-classify it for a Lost & Found tracker app.
Return a structured representation containing:
1. a clean, descriptive title (e.g., "Silver Metal Keychain" or "Red Leather iPhone Case").
2. category (must be one of: "electronics", "keys", "wallet", "documents", "clothing", "jewelry", "bags", "others").
3. a detailed physical description listing colors, distinguishing marks, brand labels, textures, shapes.
4. suggestedLocation (where such an item is commonly lost or found based on visual clues, or default to general guess).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, { text: promptString }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Descriptive title for the item (3-8 words)' },
            category: { 
              type: Type.STRING, 
              description: 'Primary category fits the item',
              enum: ["electronics", "keys", "wallet", "documents", "clothing", "jewelry", "bags", "others"]
            },
            description: { type: Type.STRING, description: 'Exhaustive physical attributes and identifying details' },
            suggestedLocation: { type: Type.STRING, description: 'Inferred location clue from image background if any' }
          },
          required: ['title', 'category', 'description', 'suggestedLocation']
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Gemini API did not return text response.');
    }

    const parsed = JSON.parse(outputText.trim());
    res.json(parsed);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze item image using AI engine.', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

/**
 * API Route: Compare user items with opposite tracking collections using Gemini Flash.
 * Returns a list of matches sorted by confidence levels.
 */
app.post('/api/ai-matchmaker', async (req, res) => {
  try {
    const { itemToMatch, candidates } = req.body;
    if (!itemToMatch || !candidates || !Array.isArray(candidates)) {
       res.status(400).json({ error: 'itemToMatch and candidates array are required.' });
       return;
    }

    if (candidates.length === 0) {
       res.json({ matches: [] });
       return;
    }

    const ai = getGeminiClient();

    const instructionsPrompt = `You are the core intelligence matching engine for the Lost & Found app, FindTrack.
We have a target item that was ${itemToMatch.type === 'lost' ? 'LOST' : 'FOUND'}:
- Title: "${itemToMatch.title}"
- Category: "${itemToMatch.category}"
- Description: "${itemToMatch.description}"
- Location Tracked: "${itemToMatch.location}"
- Date Posted: "${itemToMatch.date}"

Compare this target item against the following candidates of the opposite tracking list:
${JSON.stringify(candidates.map(c => ({ id: c.id, title: c.title, category: c.category, description: c.description, location: c.location, date: c.date })))}

For each candidate, calculate:
1. A confidence score between 0 and 100 based on overlap of physical characteristics, colors, brands, categories (critical!), and logical distance of locations and dates.
2. A matchReason: a friendly explanation (max 2 sentences) describing why they are a likely match, comparing matching features.

Filter and return ONLY matches having a confidence score of 35% or higher. Sort the results with higher confidence scores of matching first.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: instructionsPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemId: { type: Type.STRING, description: 'The unique candidate ID' },
                  confidenceScore: { type: Type.INTEGER, description: 'Percentage probability of match (0-100)' },
                  matchReason: { type: Type.STRING, description: 'Justification for the confidence index' }
                },
                required: ['itemId', 'confidenceScore', 'matchReason']
              }
            }
          },
          required: ['matches']
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Gemini API did not return comparison parameters.');
    }

    const parsed = JSON.parse(outputText.trim());
    res.json(parsed);
  } catch (error) {
    console.error('Error in AI matchmaker:', error);
    res.status(500).json({ 
      error: 'Match reasoning failed.', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Configure Vite or Serve Static build
async function setupViteMiddleware() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Wildcard Route
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupViteMiddleware().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FindTrack Server booting successfully at http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Vite middleware hook failure:', err);
});

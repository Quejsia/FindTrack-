import { GoogleGenAI, Type } from '@google/genai';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp();
}

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
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

const requireAuth = async (req: any, res: any): Promise<boolean> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
    return false;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    await getAuth().verifyIdToken(token);
    return true;
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    return false;
  }
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authenticated = await requireAuth(req, res);
  if (!authenticated) return;

  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
       return res.status(400).json({ error: 'imageBase64 and mimeType fields are required.' });
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: 'Invalid image type.' });
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
      model: 'gemini-2.0-flash',
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
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error analyzing image:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze item image using AI engine.', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}

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
    const { itemToMatch, candidates } = req.body;
    if (!itemToMatch || !candidates || !Array.isArray(candidates)) {
       return res.status(400).json({ error: 'itemToMatch and candidates array are required.' });
    }

    if (candidates.length === 0) {
       return res.status(200).json({ matches: [] });
    }

    const ai = getGeminiClient();

    const instructionsPrompt = `You are the core intelligence matching engine for the Lost & Found app, FindTrack.
We have a target item that was ${itemToMatch.type === 'lost' ? 'LOST' : 'FOUND'}:
- Title: ${JSON.stringify(itemToMatch.title)}
- Category: ${JSON.stringify(itemToMatch.category)}
- Description: ${JSON.stringify(itemToMatch.description)}
- Location Tracked: ${JSON.stringify(itemToMatch.location)}
- Date Posted: ${JSON.stringify(itemToMatch.date)}

Compare this target item against the following candidates of the opposite tracking list:
${JSON.stringify(candidates.map((c: any) => ({ id: c.id, title: c.title, category: c.category, description: c.description, location: c.location, date: c.date })))}

For each candidate, calculate:
1. A confidence score between 0 and 100 based on overlap of physical characteristics, colors, brands, categories (critical!), and logical distance of locations and dates.
2. A matchReason: a friendly explanation (max 2 sentences) describing why they are a likely match, comparing matching features.

Filter and return ONLY matches having a confidence score of 35% or higher. Sort the results with higher confidence scores of matching first.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error in AI matchmaker:', error);
    return res.status(500).json({ 
      error: 'Match reasoning failed.', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}

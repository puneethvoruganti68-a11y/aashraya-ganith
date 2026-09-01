import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { apiRouter } from './backend/routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api/v2', apiRouter);

// Initialize Google GenAI client lazily or safely
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AASHRAYA GANITH Intelligence Engine', timestamp: new Date().toISOString() });
});

// Thermal Simulation & AI Advice Endpoint
app.post('/api/simulate', async (req, res) => {
  try {
    const { target, region, activeRecommendations, parameters } = req.body;
    const ai = getAI();

    // Default mathematical physics solver calculation fallback
    const baseTemp = region?.coreTemp || 38;
    const solarRadiation = region?.solarRadiationValue || 950;
    const recommendationsCount = (activeRecommendations || []).length;
    
    // Physics-based thermal balance calculation
    let calculatedTempDrop = 0;
    if (activeRecommendations && Array.isArray(activeRecommendations)) {
      calculatedTempDrop += activeRecommendations.length * 2.2;
    }
    if (parameters?.wallThickness) {
      calculatedTempDrop += (parameters.wallThickness - 15) * 0.12;
    }
    if (parameters?.eaveOverhang) {
      calculatedTempDrop += parameters.eaveOverhang * 1.5;
    }
    
    calculatedTempDrop = Math.min(Math.max(calculatedTempDrop, 3.5), 14.2);
    const internalPeak = Math.round((baseTemp - calculatedTempDrop) * 10) / 10;
    const calculatedScore = Math.min(Math.round(65 + calculatedTempDrop * 2.6), 98);

    let aiExplanation = '';

    if (ai) {
      try {
        const prompt = `You are AASHRAYA GANITH, an AI Climate-Adaptive Thermal Shelter Intelligence Engine.
Analyze this shelter simulation:
Target: ${target === 'human' ? 'Human Thermal Shelter (Habitation)' : 'Livestock Shelter (Agricultural Enclosure)'}
Climate Region: ${region?.name || 'Thar Desert Region'} (${region?.climateType || 'Arid BWh'}, Ambient ${baseTemp}°C, Solar ${solarRadiation} W/m², Humidity ${region?.humidity || 22}%)
Active Interventions: ${(activeRecommendations || []).join(', ') || 'Standard Baseline Assembly'}
Wall Thickness: ${parameters?.wallThickness || 20}cm
Eave Overhang: ${parameters?.eaveOverhang || 1.2}m
Calculated Internal Peak Temp: ${internalPeak}°C (Delta: -${calculatedTempDrop.toFixed(1)}°C)
Suitability Score: ${calculatedScore}/100

In 3 concise, highly technical bullet points (under 80 words total), synthesize:
1. Microclimate thermal inertia & radiant flux outcome.
2. Diurnal shift damping efficiency.
3. Crucial construction tip for local vernacular materials.
Speak in precise architectural climate-tech terminology.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            temperature: 0.2,
          },
        });

        aiExplanation = response.text || '';
      } catch (geminiErr) {
        console.warn('Gemini inference fallback used:', geminiErr);
      }
    }

    if (!aiExplanation) {
      aiExplanation = `• Thermal mass damping mitigates extreme peak radiative gain between 11:00-16:00, lowering interior operative temperature to ${internalPeak}°C.
• Stack-effect ridge ventilation prevents stratified superheated air buildup, sustaining laminar night air purge.
• Vernacular high-albedo lime treatment combined with deep eaves completely shields external masonry from direct perpendicular solar flux.`;
    }

    return res.json({
      success: true,
      internalPeakTemp: internalPeak,
      tempReduction: Math.round(calculatedTempDrop * 10) / 10,
      overallScore: calculatedScore,
      heatProtectionGrade: calculatedScore >= 88 ? 'A+' : calculatedScore >= 80 ? 'A' : calculatedScore >= 70 ? 'B' : 'C',
      ventilationGrade: (parameters?.ventilationRatio || 25) > 30 ? 'A' : 'B',
      insulationGrade: recommendationsCount >= 3 ? 'A' : 'B',
      thermalDamping: Math.min(Math.round(60 + calculatedTempDrop * 3), 96),
      comfortHoursPerDay: Math.min(Math.round(14 + calculatedTempDrop * 0.8), 24),
      aiExplanation,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error?.message || 'Simulation execution failed' });
  }
});

// Custom Climate Coordinate Diagnostics
app.post('/api/custom-climate', async (req, res) => {
  try {
    const { coordinates, query } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        climateType: 'Arid Desert Microclimate',
        stressTag: 'SOLAR STRESS',
        coreTemp: 39,
        humidity: 20,
        solarRadiation: 960,
        recommendation: 'Deep overhangs and high-albedo roofing essential.',
      });
    }

    const prompt = `As AASHRAYA GANITH climate intelligence, evaluate geographic location/coordinates "${coordinates || query}".
Return a JSON object strictly matching this schema:
{
  "name": "Region Name",
  "climateType": "Köppen Climate Class",
  "stressTag": "SHORT TAG (e.g. ARID STRESS / HUMIDITY PEAK / CYCLONE PRONE)",
  "coreTemp": number,
  "humidity": number,
  "windSpeed": number,
  "windDirection": "NNE/SW/etc",
  "solarRadiationValue": number,
  "keyVulnerability": "Single sentence",
  "optimalVernacularStrategy": "Single sentence"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to analyze climate' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AASHRAYA GANITH Server running on port ${PORT}`);
  });
}

startServer();

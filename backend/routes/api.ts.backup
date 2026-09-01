import { Router } from 'express';
import { calculateThermal } from '../services/thermal.js';
import { estimateCost } from '../services/cost.js';
import { recommendDesign } from '../services/design.js';
import { predictWithML } from '../services/ml.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AASHRAYA GANITH Intelligence Engine', version: '0.2.0' });
});

apiRouter.post('/design/recommend', (req, res) => {
  const input = req.body;
  res.json({ success: true, design: recommendDesign(input) });
});

apiRouter.post('/thermal/analyze', (req, res) => {
  const result = calculateThermal(req.body);
  res.json({ success: true, result });
});

apiRouter.post('/cost/estimate', (req, res) => {
  const result = estimateCost(req.body);
  res.json({ success: true, result });
});

apiRouter.post('/what-if', (req, res) => {
  const { thermal, cost } = req.body;
  const before = calculateThermal(thermal.before);
  const after = calculateThermal(thermal.after);
  const beforeCost = estimateCost(cost.before);
  const afterCost = estimateCost(cost.after);
  res.json({
    success: true,
    before: { thermal: before, cost: beforeCost },
    after: { thermal: after, cost: afterCost },
    delta: {
      score: after.overallScore - before.overallScore,
      temperature: Number((after.internalPeakTemp - before.internalPeakTemp).toFixed(1)),
      cost: afterCost.total - beforeCost.total,
    },
  });
});


apiRouter.post('/ml/predict', async (req, res) => {
  try {
    const result = await predictWithML(req.body);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('ML prediction error:', error);

    res.status(500).json({
      success: false,
      error: error?.message || 'ML prediction failed',
    });
  }
});

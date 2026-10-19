import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { products } from './catalog.js';
import { validateRecommendationRequest } from './validation.js';
import { recommendLocally } from './recommendationEngine.js';
import { recommendWithOpenAI } from './openaiService.js';

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN;
const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

app.disable('x-powered-by');
if (clientOrigin) {
  app.use(cors({
    origin: clientOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }));
}
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', aiConfigured: Boolean(apiKey), timestamp: new Date().toISOString() });
});

app.get('/api/products', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ products });
});

app.post('/api/recommendations', async (req, res) => {
  const validation = validateRecommendationRequest(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });
  const { preferences, productIds } = validation.value;
  const knownIds = new Set(products.map((p) => p.id));
  if (productIds && productIds.some((id) => typeof id !== 'string' || !knownIds.has(id))) {
    return res.status(400).json({ error: 'One or more product IDs are not in the catalog.' });
  }
  const allowedIds = productIds?.length ? [...new Set(productIds)] : undefined;
  if (allowedIds && allowedIds.length === 0) return res.status(400).json({ error: 'Select at least one product to recommend from.' });

  if (apiKey) {
    try {
      const result = await recommendWithOpenAI(preferences, products, allowedIds, apiKey, model);
      return res.json({ mode: 'ai', ...result });
    } catch (error) {
      console.error('[recommendations] AI provider failed; using local fallback:', error.message);
    }
  }
  const result = recommendLocally(preferences, products, allowedIds);
  return res.json({ mode: 'local', ...result });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Invalid JSON request body.' });
  console.error('[api] Unhandled error:', error.message);
  return res.status(500).json({ error: 'Unexpected server error. Please try again.' });
});

export default app;

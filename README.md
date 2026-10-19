# Productly AI — Product Recommendation System

A clean, responsive React + Express app that recommends products from a fixed catalog based on natural-language preferences.

## Features
- Responsive React UI with searchable product catalog and preference prompt.
- AI recommendations via OpenAI's Responses API when `OPENAI_API_KEY` is configured.
- Safe local recommendation fallback when no API key is configured or the AI service is unavailable.
- Recommendations are constrained to catalog product IDs; the server validates returned IDs before sending results.
- Backend owns the API key; it is never exposed to the browser.
- Input validation, timeout, graceful error handling, health endpoint, and clear setup instructions.
- Sample catalog includes phones, laptops, headphones, and smartwatches.

## Requirements
- Node.js 20+ and npm
- Optional: OpenAI API key for live AI recommendations

## Run locally
1. Extract the ZIP and open a terminal in the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `server/.env` and add your API key if you have one. This step is optional.
   - Windows PowerShell: `Copy-Item .env.example server/.env`
   - macOS/Linux: `cp .env.example server/.env`
4. Start the frontend and API:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173`.

The UI works without an API key using the local recommendation engine. To enable OpenAI, set `OPENAI_API_KEY` in `server/.env`, then restart the server.

## API
### `GET /api/health`
Returns service status and whether AI mode is configured.

### `GET /api/products`
Returns the product catalog.

### `POST /api/recommendations`
Request:
```json
{
  "preferences": "I want a phone under $500 with a good camera",
  "productIds": ["phone-001", "phone-002"]
}
```
`productIds` is optional. If provided, recommendations are limited to those IDs.

Response:
```json
{
  "mode": "ai",
  "summary": "These options best match your budget and camera preference.",
  "recommendations": [
    {
      "productId": "phone-001",
      "reason": "Fits the budget and emphasizes camera quality",
      "matchScore": 94
    }
  ]
}
```

## Architecture
- `client/`: Vite + React frontend
- `server/`: Express API, catalog, recommendation service
- `server/src/recommendationEngine.js`: local fallback ranking
- `server/src/openaiService.js`: AI request and output parsing
- `server/src/validation.js`: request validation

## Production notes
Before public deployment, add rate limiting, authentication if needed, centralized logs/monitoring, and hosting-specific CORS/origin configuration. Never commit `.env` or put the OpenAI key in frontend environment variables. The fallback is deterministic and intentionally limited; it is not a substitute for a configured AI model.

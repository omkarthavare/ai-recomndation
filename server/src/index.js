import app from './app.js';

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Productly API listening on http://localhost:${port}`);
  console.log(`AI recommendations: ${process.env.OPENAI_API_KEY?.trim() ? `enabled (${process.env.OPENAI_MODEL || 'gpt-4o-mini'})` : 'disabled; local fallback enabled'}`);
});

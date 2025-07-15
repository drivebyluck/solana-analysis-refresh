import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
app.use(cors());

const COINGLASS_API_KEY = process.env.COINGLASS_API_KEY;
const COINGLASS_ENDPOINT = 'https://open-api.coinglass.com/public/v2/futures/liquidation_chart';
const TARGET_SYMBOL = 'SOL';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Optional: for debugging root route
app.get('/', (req, res) => {
  res.send('Solana Analysis API is live.');
});

app.get('/api/analysis', async (req, res) => {
  try {
    const response = await fetch(`${COINGLASS_ENDPOINT}?symbol=${TARGET_SYMBOL}&interval=60`, {
      headers: {
        'coinglassSecret': COINGLASS_API_KEY
      }
    });

    const data = await response.json();

    if (!data || !data.data || !data.data.longVol || !data.data.shortVol) {
      return res.status(404).json({ error: 'No SOL data available.' });
    }

    const { longVol, shortVol, time } = data.data;

    const formatted = `
      Long Liquidations: ${longVol}
      Short Liquidations: ${shortVol}
      Timestamp: ${new Date(time).toLocaleString()}
    `;

    const gptPrompt = `
      Based on this Solana liquidation data:
      ${formatted}

      Please provide a brief technical analysis summary including which side (long or short) looks riskier, possible support/resistance, and expected move within the next 12 hours.
    `;

    const gptResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a crypto market analyst.' },
        { role: 'user', content: gptPrompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const gptOutput = gptResponse.data.choices[0].message.content;
    res.json({ summary: gptOutput });

  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch Solana analysis.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

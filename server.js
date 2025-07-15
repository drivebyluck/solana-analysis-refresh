import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Solana Analysis API is live.');
});

app.get('/api/analysis', async (req, res) => {
  try {
    const response = await axios.get('https://api.coinglass.com/api/v1/futures/liquidation_chart', {
      headers: {
        'coinglassSecret': process.env.COINGLASS_API_KEY,
      },
      params: {
        symbol: 'SOL',
        interval: '5m',
        time_type: 'hour',
        type: 'longShortAmount',
      },
    });

    const solData = response.data?.data?.find(d => d.symbol === 'SOL');

    if (!solData) {
      return res.status(404).json({ error: 'No SOL data available.' });
    }

    const prompt = `
Based on the following Solana liquidation data, provide a detailed technical analysis for traders. Include a table with trading setup (Bias, Setup, Entry, Trigger, Stop, Target, Leverage), then explain the current market conditions, recent activity, and short- vs long-term trade setups. Give one primary strategy and one backup. Use a direct tone with realistic outlooks.

Data: ${JSON.stringify(solData)}
    `;

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const analysis = completion.data.choices[0].message.content;

    res.json({ analysis });
  } catch (error) {
    console.error('Error fetching or processing analysis:', error.message);
    res.status(500).json({ error: 'Failed to fetch Solana analysis.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

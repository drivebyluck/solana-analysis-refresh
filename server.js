const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

// Fix: Import fetch for compatibility
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());

app.get('/api/analysis', async (req, res) => {
  try {
    // Fetch live SOL price and 24h change
    const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true');
    const priceData = await priceResponse.json();

    const currentPrice = priceData.solana.usd;
    const percentChange = priceData.solana.usd_24h_change.toFixed(2);
    const bias = percentChange > 0 ? 'Bullish' : 'Bearish';
    const setup = bias === 'Bullish' ? 'Breakout long' : 'Pullback short';

    const entry = (bias === 'Bullish'
      ? currentPrice * 1.002
      : currentPrice * 0.998
    ).toFixed(2);

    const trigger = (bias === 'Bullish'
      ? currentPrice * 1.005
      : currentPrice * 0.995
    ).toFixed(2);

    const stop = (bias === 'Bullish'
      ? currentPrice * 0.993
      : currentPrice * 1.007
    ).toFixed(2);

    const target = (bias === 'Bullish'
      ? currentPrice * 1.02
      : currentPrice * 0.98
    ).toFixed(2);

    const suggestedLeverage = bias === 'Bullish' ? '3–5x long' : '3–5x short';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    // Prompt for ChatGPT
    const prompt = `Solana (SOL) is trading at $${currentPrice.toFixed(2)} with a 24h change of ${percentChange}%. 
Bias: ${bias}, Setup: ${setup}, Entry: $${entry}, Trigger: $${trigger}, Stop: $${stop}, Target: $${target}, 
Leverage: ${suggestedLeverage}. Write a concise professional technical analysis of this setup.`;

    const aiResponse = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 250
    });

    const explanation = aiResponse.choices[0].message.content;

    res.json({
      timestamp,
      bias,
      setup,
      currentPrice: `$${currentPrice.toFixed(2)}`,
      percentChange: `${percentChange}%`,
      entry: `$${entry}`,
      trigger: `$${trigger}`,
      stop: `$${stop}`,
      target: `$${target}`,
      suggestedLeverage,
      explanation
    });

  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: 'Analysis generation failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

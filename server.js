// server.js
import express from 'express';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// CoinGlass Hobbyist API key
const COINGLASS_API_KEY = process.env.COINGLASS_API_KEY;

// OpenAI config
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CORS setup
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/analysis', async (req, res) => {
  try {
    // Fetch SOL open interest and volume (no liquidation endpoints used)
    const response = await fetch(
      'https://open-api.coinglass.com/public/v2/open_interest/coin?symbol=SOL&time_type=h4',
      {
        headers: { 'coinglassSecret': COINGLASS_API_KEY }
      }
    );

    const data = await response.json();
    const coinData = data.data?.find(c => c.symbol === 'SOL');

    if (!coinData) {
      return res.status(500).send('Error: No SOL data available.');
    }

    const { openInterestValue, volume24h, longShortRate } = coinData;

    const now = new Date();
    const timeString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });

    const chartTable = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background: #111; color: white;">
            <th style="padding: 8px; border: 1px solid #444;">Metric</th>
            <th style="padding: 8px; border: 1px solid #444;">Value</th>
          </tr>
        </thead>
        <tbody style="text-align: center; background: #000; color: #eee;">
          <tr><td style="padding: 8px; border: 1px solid #444;">Open Interest (USD)</td><td style="padding: 8px; border: 1px solid #444;">$${(+openInterestValue).toLocaleString()}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #444;">24h Volume (USD)</td><td style="padding: 8px; border: 1px solid #444;">$${(+volume24h).toLocaleString()}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #444;">Long/Short Ratio</td><td style="padding: 8px; border: 1px solid #444;">${(+longShortRate).toFixed(2)}</td></tr>
        </tbody>
      </table>
    `;

    // Send data to OpenAI to generate analysis
    const prompt = `
Based on the following real-time CoinGlass metrics for SOL (Solana):

Open Interest: $${(+openInterestValue).toLocaleString()}
24h Volume: $${(+volume24h).toLocaleString()}
Long/Short Ratio: ${(+longShortRate).toFixed(2)}

Generate a short technical analysis summary suitable for crypto traders. Include:
- The directional bias (bullish, bearish, or neutral)
- Long and short setups with entry, stop, and target prices
- One clear recommendation (long or short)
- Use a confident tone

Close with a clear outlook statement in bold.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }]
    });

    const explanation = completion.choices[0].message.content;

    const html = `
      <div style="background-color: black; color: white; padding: 24px; font-family: Arial, sans-serif;">
        <h2 style="text-align: center; margin-top: 0;">Solana Perpetual Analysis</h2>
        <p style="text-align: center; color: #999;">Last updated: ${timeString} EST</p>
        ${chartTable}
        <div style="line-height: 1.6; font-size: 1rem;">${explanation.replace(/\n/g, '<br>')}</div>
      </div>
      <script>
        window.parent.postMessage({ height: document.body.scrollHeight }, '*');
      </script>
    `;

    res.send(html);
  } catch (err) {
    console.error('Error in /api/analysis:', err);
    res.status(500).send('Error generating analysis.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import cron from './cron.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let latestAnalysis = 'Loading Solana analysis...';

app.use(express.static('public'));

app.get('/solana-analysis.html', (req, res) => {
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Solana Perpetual Analysis</title>
        <style>
          body {
            background-color: black;
            color: white;
            font-family: Arial, sans-serif;
            padding: 20px;
            margin: 0;
          }
          h1 {
            color: #e02c2c;
            text-align: center;
            margin-top: 0;
          }
          .label {
            color: #e02c2c;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            text-align: center;
          }
          .content {
            background-color: #111;
            padding: 20px;
            border: 1px solid #e02c2c;
            border-radius: 8px;
            white-space: pre-wrap;
          }
          .timestamp {
            text-align: center;
            margin-top: 15px;
            font-size: 0.9em;
            color: #888;
          }
        </style>
      </head>
      <body>
        <h1>SOLANA PERPETUAL ANALYSIS</h1>
        <div class="label">TECHNICAL ANALYSIS BY JARS</div>
        <div class="content">${latestAnalysis}</div>
        <div class="timestamp">Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</div>
      </body>
    </html>
  `;
  res.send(html);
});

const generateAnalysis = async () => {
  try {
    const coinglassRes = await axios.get(
      'https://open-api.coinglass.com/public/v2/futures/longShortChart?symbol=SOL',
      {
        headers: {
          'accept': 'application/json',
          'coinglassSecret': process.env.COINGLASS_API_KEY
        }
      }
    );

    let ratio = 'N/A';

    if (
      coinglassRes.data &&
      coinglassRes.data.data &&
      typeof coinglassRes.data.data.longShortRatio !== 'undefined'
    ) {
      ratio = coinglassRes.data.data.longShortRatio;
    } else {
      console.warn('⚠️ Warning: longShortRatio not found in CoinGlass response:', coinglassRes.data);
    }

    const prompt = `
You are JARS, a professional Solana trader. Based on current market sentiment and a long/short ratio of ${ratio}, provide a clear technical analysis report for SOL/USDT Perpetuals. Begin with a trading setup table. Then include:

1. Short-term and long-term outlooks
2. Bullish (long) and bearish (short) scenarios with triggers
3. Ideal entry price range, stop loss, and take profit
4. Leverage suggestions for both setups
5. Brief rationale for the preferred direction (bullish or bearish)
6. End with a confidence level (1-10) and reminder to manage risk

Avoid fluff. Use markdown-style formatting (like line breaks, bullet points, headings) and highlight price levels.

Only give me the TA. Do not explain what it is or say “Here’s the analysis.”
`;

    const gptRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    latestAnalysis = gptRes.choices[0].message.content;
    console.log('✅ Analysis updated at', new Date().toLocaleString());
  } catch (err) {
    console.error('❌ Error generating analysis:', err.message || err);
  }
};

// Run immediately on startup
generateAnalysis();

// Refresh every 5.5 hours
setInterval(generateAnalysis, 5.5 * 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

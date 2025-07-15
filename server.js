import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let latestAnalysis = '';

async function fetchCoinGlassData() {
  try {
    const response = await axios.get('https://fapi.coinglass.com/api/futures/longShortChartV3?symbol=SOL');
    const result = response.data?.data?.list ?? [];
    const latestEntry = result[result.length - 1];

    if (!latestEntry || !latestEntry.longShortRatio) {
      throw new Error('Invalid long/short data from CoinGlass');
    }

    const ratio = parseFloat(latestEntry.longShortRatio);
    let trend = ratio > 1 ? 'long' : 'short';

    const prompt = `
      CoinGlass long/short ratio for SOL is ${ratio.toFixed(2)}.
      Based on this data, write a concise trading setup with:
      - A bias toward ${trend}
      - A realistic entry range
      - Stop loss and take profit
      - Include a short backup scenario in case the opposite happens
      Make sure this is specific and formatted for daily crypto traders.
    `;

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    latestAnalysis = gptResponse.choices[0].message.content.trim();
    console.log('✅ Analysis updated at', new Date().toLocaleString());

  } catch (error) {
    console.error('❌ Error generating analysis:', error.message);
    latestAnalysis = 'Error fetching data or generating analysis.';
  }
}

// Run once on startup, then every 4 hours
fetchCoinGlassData();
setInterval(fetchCoinGlassData, 1000 * 60 * 60 * 4); // 4 hours

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Solana Perpetual Analysis</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            background: black;
            color: white;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          h1 {
            color: #e02c2c;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .timestamp {
            color: #017a36;
            margin-bottom: 20px;
          }
          pre {
            background: #111;
            padding: 15px;
            border-radius: 8px;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #ddd;
          }
        </style>
      </head>
      <body>
        <h1>TECHNICAL ANALYSIS BY JARS</h1>
        <div class="timestamp">${new Date().toLocaleString()}</div>
        <pre>${latestAnalysis}</pre>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

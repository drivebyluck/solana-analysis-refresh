import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Enable __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env variables
dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const COINGLASS_API_KEY = process.env.COINGLASS_API_KEY;

async function fetchCoinGlassData(symbol) {
  const headers = { 'coinglassSecret': COINGLASS_API_KEY };

  const endpoints = {
    liquidation: `https://open-api.coinglass.com/public/v2/liquidation_map?symbol=${symbol}&time_type=h1`,
    longShort: `https://open-api.coinglass.com/api/pro/v1/futures/longShortChart?symbol=${symbol}`,
    openInterest: `https://open-api.coinglass.com/public/v2/open_interest_chart?symbol=${symbol}`,
    volume: `https://open-api.coinglass.com/public/v2/volume_chart?symbol=${symbol}`,
    trades: `https://open-api.coinglass.com/public/v2/futures_trade_num_chart?symbol=${symbol}`
  };

  const results = {};
  for (const [key, url] of Object.entries(endpoints)) {
    try {
      const res = await axios.get(url, { headers });
      results[key] = res.data;
    } catch (err) {
      console.error(`❌ Error fetching ${key}:`, err.response?.data || err.message);
      results[key] = null;
    }
  }

  return results;
}

function parseWhiteHouseSchedule(html) {
  const $ = cheerio.load(html);
  const events = [];

  $('.view-content .views-row').each((i, el) => {
    const time = $(el).find('.field-content .datetime').text().trim();
    const desc = $(el).find('.field-content .description').text().trim();
    if (time && desc) {
      events.push(`${time} - ${desc}`);
    }
  });

  return events.join('\n');
}

function generatePrompt(data, scheduleText) {
  return `
Using the following Solana market data and U.S. President's schedule, create a detailed intraday Solana perpetual trading setup. Provide a full table of trading conditions, give two scenarios (one long, one short), and recommend the most likely outcome.

CoinGlass Data:
- Liquidations: ${JSON.stringify(data.liquidation)}
- Long/Short: ${JSON.stringify(data.longShort)}
- Open Interest: ${JSON.stringify(data.openInterest)}
- Volume: ${JSON.stringify(data.volume)}
- Trades: ${JSON.stringify(data.trades)}

President's Public Schedule:
${scheduleText}

Respond in this format:
1. A table with Bias, Setup, Entry, Trigger, Stop, Target, Leverage
2. A short scenario with reasoning
3. A long scenario with reasoning
4. A final call: which scenario is most likely and why
`;
}

app.get('/solana-analysis.html', async (req, res) => {
  try {
    // 1. Get CoinGlass market data
    const symbol = 'SOL';
    const marketData = await fetchCoinGlassData(symbol);

    // 2. Get and parse the White House schedule
    const response = await axios.get('https://www.whitehouse.gov/schedule/');
    const scheduleText = parseWhiteHouseSchedule(response.data);

    // 3. Build prompt and request from OpenAI
    const prompt = generatePrompt(marketData, scheduleText);
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional Solana technical analyst.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = chatCompletion.choices[0].message.content;

    // 4. Style the content and return HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Solana Perpetual Analysis</title>
  <style>
    body {
      background-color: black;
      color: white;
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    h1 {
      color: #e02c2c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    table, th, td {
      border: 1px solid #e02c2c;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #222;
    }
    .long { color: #017a36; }
    .short { color: #e02c2c; }
    .timestamp {
      font-size: 0.85em;
      color: gray;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <h1>Solana Perpetual Analysis</h1>
  <div>${content.replace(/\n/g, '<br>')}</div>
  <div class="timestamp">Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</div>
</body>
</html>
    `;

    res.send(html);
  } catch (err) {
    console.error('❌ Error generating analysis:', err.response?.data || err.message);
    res.status(500).send('Error generating analysis');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

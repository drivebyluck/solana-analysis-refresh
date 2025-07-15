import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// For ES Modules: get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI using the v4 SDK (no Configuration export required)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let latestAnalysis = 'Analysis not yet generated.';

async function fetchCoinGlassData() {
  try {
    // Use the correct CoinGlass endpoint (replace with your paid endpoint if needed)
    const response = await axios.get(
      'https://open-api.coinglass.com/api/pro/v1/futures/longShortChart?symbol=SOL',
      {
        headers: {
          'coinglassSecret': process.env.COINGLASS_API_KEY
        }
      }
    );
    // The expected structure is: response.data.data.list (an array)
    const data = response.data?.data;
    if (!data || !data.list || data.list.length === 0) {
      throw new Error('Missing long/short data');
    }
    const latest = data.list[data.list.length - 1];
    if (!latest.ratio) {
      throw new Error('Missing ratio in latest entry');
    }
    const ratio = parseFloat(latest.ratio);
    const trend = ratio > 1 ? 'long' : 'short';

    const prompt = `
The long/short ratio for Solana (SOL) is ${ratio.toFixed(2)}.
Traders show a bias toward ${trend} positions.
Based on typical market behavior, provide a detailed technical analysis for SOL/USDT Perpetuals that includes:
- A trading setup table with columns: Bias, Setup, Entry, Trigger, Stop, Target, Leverage.
- A clear market breakdown explaining key support/resistance, order blocks, and recent volume.
- Two scenarios: a primary recommendation and a backup plan if the preferred setup fails.
- A short-term and medium-term outlook.
Format your response in clean HTML (using only <h2>, <p>, <table>, etc.) without inline styles.
    `;

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    latestAnalysis = gptResponse.choices[0].message.content.trim();
    console.log('✅ Analysis updated at', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  } catch (error) {
    console.error('❌ Error generating analysis:', error.response?.data || error.message || error);
    latestAnalysis = 'Error fetching data or generating analysis.';
  }
}

// Run immediately on startup, then update every 4 hours
fetchCoinGlassData();
setInterval(fetchCoinGlassData, 1000 * 60 * 60 * 4);

// Serve the analysis in a styled HTML template for your iframe
app.get('/solana-analysis.html', (req, res) => {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Solana Perpetual Analysis</title>
  <style>
    body {
      margin: 0;
      background-color: #000;
      color: #fff;
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    h2 {
      text-align: center;
      color: #017a36;
    }
    .timestamp {
      text-align: center;
      color: #888;
      margin-bottom: 20px;
    }
    .analysis-content {
      background-color: #111;
      padding: 20px;
      border: 1px solid #e02c2c;
      border-radius: 8px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <h2>SOLANA PERPETUAL ANALYSIS</h2>
  <div class="timestamp">Last updated: ${timestamp} EST</div>
  <div class="analysis-content">${latestAnalysis}</div>
  <script>
    window.parent.postMessage({ height: document.body.scrollHeight }, '*');
  </script>
</body>
</html>
  `;
  res.send(html);
});

// Health check route
app.get('/', (req, res) => {
  res.send('Server running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

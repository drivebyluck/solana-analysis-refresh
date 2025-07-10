const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { ChatGPTAPI } = require('chatgpt');
require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static('public'));

const api = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY
});

async function fetchMarketData() {
  try {
    // If CoinGlass is removed, you can skip this and just return an object
    return {
      success: true,
      data: {
        message: "Liquidation chart data removed as requested."
      }
    };
  } catch (error) {
    console.error("❌ CoinGlass API Error:", error.response?.data || error.message || error);
    return { success: false };
  }
}

async function generateAnalysis() {
  try {
    const marketData = await fetchMarketData();

    // Prepare the prompt
    const prompt = `
Use the current Solana market conditions to fill out this chart and provide a daily technical analysis.

CHART:
Bias: Bullish
Setup: Range Breakout
Entry: $142.30
Trigger: 1H candle close above $144.10
Stop: $140.25
Target: $151.70
Leverage: 3x–5x

Write a professional, tactical breakdown explaining this setup. Cover both long and short scenarios. End with a clear recommendation for the day. Make sure the analysis uses crypto trading terminology and current behavior. Format for HTML display, no code blocks.

Use this format:
<h2>Solana Perpetual Setup</h2>
<table>...</table>
<h3>Market Breakdown</h3>
<p>...</p>
<h3>Outlook</h3>
<p>...</p>
    `;

    const res = await api.sendMessage(prompt);

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #000000;
              color: white;
              margin: 0;
              padding: 1rem;
              line-height: 1.6;
            }
            h2 {
              color: #e02c2c;
              font-size: 1.5rem;
              margin-bottom: 0.5rem;
            }
            h3 {
              color: #017a36;
              font-size: 1.2rem;
              margin-top: 1.5rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background-color: #111;
              margin-top: 0.5rem;
            }
            th, td {
              border: 1px solid #444;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #222;
              color: #e02c2c;
            }
            td {
              color: white;
            }
            p {
              color: white;
            }
          </style>
        </head>
        <body>
          ${res.text}
        </body>
      </html>
    `;

    fs.writeFileSync(path.join(__dirname, 'public', 'solana-analysis.html'), htmlContent, 'utf8');
    console.log("✅ Solana analysis updated");
  } catch (error) {
    console.error("❌ OpenAI Error:", error.response?.data || error.message || error);
  }
}

// Refresh every 4 times daily
cron.schedule('0 0,8,12,17 * * *', () => {
  console.log("⏰ Generating scheduled analysis");
  generateAnalysis();
});

// Initial run
generateAnalysis();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cron = require("node-cron");
const { ChatGPTAPI } = require("chatgpt");

const app = express();
const PORT = process.env.PORT || 3000;

const api = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static("public"));

async function fetchMarketData() {
  const cgKey = process.env.COINGLASS_API_KEY;
  const url = `https://open-api.coinglass.com/public/v4/futures/liquidation_chart?symbol=SOL`;

  const response = await axios.get(url, {
    headers: { "coinglassSecret": cgKey }
  });

  return response.data;
}

function generatePrompt(data) {
  const latest = data.data[data.data.length - 1];
  const time = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  return `
You are a seasoned crypto analyst. Use the current Solana market data and technicals to fill out this table and generate a detailed forecast. You must include both long and short scenarios, with a clear bias and why. Use real values based on the chart and data. Current price is approximately $${latest.price}. Always output in the following format using HTML only:

<table>
<tr><th>Bias</th><th>Setup</th><th>Entry</th><th>Trigger</th><th>Stop</th><th>Target</th><th>Leverage</th></tr>
<tr><td>[Bullish or Bearish]</td><td>[Setup]</td><td>[Entry Price]</td><td>[Trigger]</td><td>[Stop Loss]</td><td>[Target]</td><td>[Leverage]</td></tr>
</table>

<h3>Market Breakdown</h3>
<p>[Explain why you think Solana will move the way it will. Use liquidation zones, RSI, MACD, order blocks, OI, volume, recent price action, and other TA tools.]</p>

<h3>Outlook</h3>
<p>[Short-term outlook: bullish or bearish and why. Provide caution or confidence level.]</p>

<p style="font-size: 0.9em; color: #888;">Updated: ${time}</p>
`.trim();
}

async function generateAnalysis() {
  try {
    const marketData = await fetchMarketData();
    const prompt = generatePrompt(marketData);

    const res = await api.sendMessage(prompt);
    const analysis = res.text;

    const styledHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Solana Perpetual Analysis</title>
  <style>
    body {
      margin: 0;
      background-color: #000;
      color: white;
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    th, td {
      border: 1px solid #e02c2c;
      padding: 10px;
      text-align: center;
    }
    th {
      background-color: #111;
      color: #e02c2c;
    }
    td {
      background-color: #111;
    }
    h3 {
      color: #017a36;
      margin-top: 25px;
    }
    p {
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <h2 style="color:#e02c2c;">Solana Perpetual Analysis</h2>
  <div>${analysis}</div>
</body>
</html>`;

    const outputPath = path.join(__dirname, "public", "solana-analysis.html");
    fs.writeFileSync(outputPath, styledHTML, "utf8");
    console.log("✅ Analysis updated");
  } catch (err) {
    console.error("❌ Failed to generate analysis:", err.message);
  }
}

// Run on startup
generateAnalysis();

// Refresh 4x per day
cron.schedule("0 0,8,12,17 * * *", () => {
  console.log("🕐 Running scheduled analysis update");
  generateAnalysis();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

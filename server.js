const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const cron = require("node-cron");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const COINGLASS_API_KEY = process.env.COINGLASS_API_KEY;

async function fetchCoinGlassData() {
  const response = await axios.get("https://open-api.coinglass.com/public/v2/futures/longShortChart", {
    headers: { "coinglassSecret": COINGLASS_API_KEY },
    params: { symbol: "SOL", interval: "h1" }
  });
  return response.data.data;
}

async function generateAnalysisHtml() {
  const coinGlassData = await fetchCoinGlassData();
  const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  const prompt = `
Using the following live data from CoinGlass on Solana (SOL), write a real, up-to-date trading analysis that includes:

1. A filled trading setup table: Bias (Preferred and Backup), Setup (LONG/SHORT), Entry, Trigger, Stop, Target, Leverage.
2. Market Breakdown (including MACD, RSI, trend direction, key support/resistance, order blocks, and liquidations).
3. Timing & Outlook (separated by Near-Term and Medium-Term).

Use only real data to determine whether the best move is LONG or SHORT. The analysis must be realistic and specific with current numbers, clearly explaining price levels and chart behavior.

Here is the raw data:
${JSON.stringify(coinGlassData)}

Respond with only a valid HTML structure. Use this exact format:
- Black background
- White font
- Green text for headers and bullish signals: #017a36
- Red text for bearish signals: #e02c2c
- Keep all section headers the same
- Do NOT add extra spacing or code wrappers
- Remove scroll bars and make the content height auto-fit

Final result should look like it's inside a styled card on a dark crypto site and should show this exact timestamp at the bottom:
${now}
`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4",
  });

  const html = `
    <html style="background-color:#000000; color:#ffffff; font-family:Arial, sans-serif; padding:20px;">
      ${completion.choices[0].message.content.replace(/```html|```/g, "")}
      <p style="color:#666; font-size:12px; text-align:right; margin-top:10px;">
        Updated at ${now}
      </p>
    </html>
  `;

  fs.writeFileSync("public/solana-analysis.html", html, "utf8");
}

cron.schedule("0 0,8,12,17 * * *", () => {
  generateAnalysisHtml().catch(console.error);
});

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

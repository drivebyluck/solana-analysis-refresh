const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/", (req, res) => {
  res.send("Solana Technical Analysis API");
});

app.get("/analysis", async (req, res) => {
  try {
    // Fetch SOL price and 24h change from CoinGecko
    const cgResp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true");
    const cgData = await cgResp.json();
    const solPrice = cgData.solana.usd;
    const percentChange = cgData.solana.usd_24h_change.toFixed(2);
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

    // Construct prompt with injected values
    const systemPrompt = `
You are a technical analyst producing market commentary for Solana (SOL) based on the following values:
- Current Price: $${solPrice}
- 24h % Change: ${percentChange}%

Generate the following fields:
Bias: Bullish or Bearish.
Setup: What type of setup (e.g., Breakout, Reversal, Consolidation).
Entry: An ideal price range to enter based on trend.
Trigger: What confirmation is needed to enter (e.g., break above/below price, volume spike).
Stop: Where should stop-loss be set.
Target: Price target(s).
Leverage: Maximum recommended leverage (1x–10x).
Paragraph: Explain your reasoning using the above values and realistic market behavior. Do NOT leave any field blank.

Use simple, concise language, and respond in a JSON object with this structure:
{
  "bias": "...",
  "setup": "...",
  "entry": "...",
  "trigger": "...",
  "stop": "...",
  "target": "...",
  "leverage": "...",
  "percentChange": "...",
  "currentPrice": "...",
  "timestamp": "...",
  "paragraph": "..."
}
`;

    const aiResponse = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "gpt-4",
    });

    const reply = aiResponse.choices[0].message.content;
    const parsed = JSON.parse(reply);

    // Double-confirm required fields are filled
    const requiredFields = [
      "bias", "setup", "entry", "trigger", "stop",
      "target", "leverage", "percentChange", "currentPrice", "timestamp", "paragraph"
    ];

    for (let field of requiredFields) {
      if (!parsed[field] || parsed[field].trim() === "") {
        throw new Error(`Missing field in AI response: ${field}`);
      }
    }

    res.json(parsed);
  } catch (err) {
    console.error("Analysis generation failed:", err);
    res.status(500).json({ error: "Analysis generation failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

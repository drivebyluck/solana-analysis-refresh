const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const app = express();
const port = 10000;

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/api/analysis", async (req, res) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true");
    const data = await response.json();
    const price = data.solana.usd;
    const change = data.solana.usd_24h_change;

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour12: true
    });

    const prompt = `
You are a crypto trading expert writing technical analysis for TradeWithJars.net.

Here is the live Solana (SOL) data:
- Current Price: $${price.toFixed(2)}
- 24h % Change: ${change.toFixed(2)}%

Write a fully styled HTML block titled "Solana Perpetual Analysis".

STRICT RULES:
- Output must be valid HTML only. No markdown. No backticks.
- Background: black. Text: white. Red (#e02c2c) for bearish. Green (#017a36) for bullish.
- Outer box must have glowing red border using inline styles.
- Include a heading in bold red: "TECHNICAL ANALYSIS BY JARS"
- Display this exact timestamp format under the heading: Updated: ${timestamp}
- Add a table with these exact headers:
  BIAS | SETUP | ENTRY | TRIGGER | STOP | TARGET | LEVERAGE
- Suggested Leverage must always be 5x or greater. Never use ranges like “3–5x”.
- Highlight the 24h % Change and Current Price directly under the table.
- Then write two paragraphs of explanation:
  1. First paragraph explains the market setup and reasoning
  2. Second paragraph gives both long and short scenarios and clearly states which is more likely
- Everything must match the current price level and bias logic. Don’t contradict.

Do not wrap output in backticks or markdown. Output HTML only.
    `.trim();

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that writes HTML for a Solana technical analysis section."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const content = chatResponse.choices[0].message.content;
    res.send(content);
  } catch (error) {
    console.error("Error generating analysis:", error);
    res.status(500).send({
      error: "Analysis generation failed",
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

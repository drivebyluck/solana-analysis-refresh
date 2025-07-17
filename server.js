const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 10000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateAndCacheAnalysis() {
  try {
    const cgResponse = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true"
    );

    const solanaData = cgResponse.data.solana;
    if (!solanaData || solanaData.usd === undefined || solanaData.usd_24h_change === undefined) {
      console.error("Missing price data");
      return;
    }

    const currentPrice = solanaData.usd.toFixed(2);
    const percentChange = solanaData.usd_24h_change.toFixed(2);
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour12: true,
    });

    const gptPrompt = `
      You are a Solana crypto analyst named Jars. Based on the current price of $${currentPrice} and a 24-hour change of ${percentChange}%, and whatever other data you can use, generate a technical analysis for SOL. 
      Provide the following:
      1. Bias (Bullish or Bearish)
      2. Setup (e.g., Pullback, Breakout, Reversal)
      3. Entry price
      4. Trigger price
      5. Stop loss
      6. Target price
      7. Suggested leverage (MUST be 5x or higher)
      8. A 2-paragraph explanation (include long and short scenario, but clearly recommend one as more likely)

      Output as raw HTML only inside a <div> with dark theme styling (black background, red glow border, white/green/red text).
      - Timestamp shown once at the top
      - Title should say "Solana (SOL) Technical Analysis By Jars"
      - Table with BIAS, SETUP, ENTRY, TRIGGER, STOP, TARGET, LEVERAGE
      - 24h % Change and Current Price highlighted
      - Below that, explanation in two paragraphs

      DO NOT include any markdown.
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: gptPrompt }],
      temperature: 0.7,
    });

    const html = completion.data.choices[0].message.content;

    const cleanedHtml = html
      .replace(/Timestamp:\s*{[^}]+}/i, "")
      .replace(/Timestamp:\s*.*?<\/?[^>]*>/i, "");

    const finalHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { background-color: black; color: white; margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .analysis-box { border: 2px solid red; box-shadow: 0 0 15px red; padding: 20px; margin: 20px; background-color: #000; }
          #timestamp { color: white; font-size: 0.9em; margin-bottom: 10px; }
        </style>
        <script> window.onload = function () { parent.postMessage({ height: document.body.scrollHeight }, "*"); }; </script>
      </head>
      <body>
        <div class="analysis-box">
          <div id="timestamp">Updated: ${timestamp}</div>
          ${cleanedHtml}
        </div>
      </body>
      </html>
    `;

    fs.writeFileSync("cached_analysis.html", finalHtml);
    console.log(`[${timestamp}] GPT analysis cached to file.`);
  } catch (error) {
    console.error("Error generating analysis:", error.message);
  }
}

// Only run generation if triggered by cron (Render starts this file directly)
if (require.main === module) {
  generateAndCacheAnalysis();
}

app.get("/api/analysis", (req, res) => {
  try {
    const finalHtml = fs.readFileSync("cached_analysis.html", "utf-8");
    res.send(finalHtml);
  } catch (err) {
    res.status(500).send("Error: Cached file not found.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
app.use(cors());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

let cachedHtml = null;
const cacheFilePath = "analysis_cache.html";

// Load cache from disk if it exists
if (fs.existsSync(cacheFilePath)) {
  cachedHtml = fs.readFileSync(cacheFilePath, "utf8");
}

// Regenerate GPT analysis
async function regenerateAnalysis() {
  try {
    const cgResponse = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true"
    );

    const solanaData = cgResponse.data.solana;
    if (!solanaData || solanaData.usd === undefined || solanaData.usd_24h_change === undefined) return;

    const currentPrice = solanaData.usd.toFixed(2);
    const percentChange = solanaData.usd_24h_change.toFixed(2);
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour12: true });

    const gptPrompt = `
Using the current Solana price of $${currentPrice} and a 24h change of ${percentChange}%, generate a professional crypto technical analysis for today. Fill in this table and write a full analysis with both long and short setups. Timestamp should be shown.

Bias: (Bullish or Bearish)
Setup: (Descending wedge, breakout retest, etc)
Entry: (Price level)
Trigger: (Confirmation signal)
Stop: (Where to place stop loss)
Target: (Profit target)
Leverage: (Recommended leverage)

Respond only in HTML. Use white text on black background, red for bearish, green for bullish. Add “Updated: [timestamp]” at the top. Do not show any disclaimers.
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: gptPrompt }],
      temperature: 0.7,
    });

    const html = completion.data.choices[0].message.content;

    cachedHtml = `
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
        <script>
          window.onload = function () {
            parent.postMessage({ height: document.body.scrollHeight }, "*");
          };
        </script>
      </head>
      <body>
        <div class="analysis-box">
          <div id="timestamp">Updated: ${timestamp}</div>
          ${html}
        </div>
      </body>
      </html>
    `;

    fs.writeFileSync(cacheFilePath, cachedHtml, "utf8");
    console.log("✅ GPT analysis updated:", timestamp);
  } catch (error) {
    console.error("❌ Error during GPT update:", error);
  }
}

// Scheduled runs (12am, 8:30am, 12pm, 5:30pm EST)
cron.schedule("0 0 * * *", regenerateAnalysis);     // 12:00 AM
cron.schedule("30 8 * * *", regenerateAnalysis);    // 8:30 AM
cron.schedule("0 12 * * *", regenerateAnalysis);    // 12:00 PM
cron.schedule("30 17 * * *", regenerateAnalysis);   // 5:30 PM

// Run once on server start
regenerateAnalysis();

// Serve cached output
app.get("/api/analysis", (req, res) => {
  if (cachedHtml) {
    res.send(cachedHtml);
  } else {
    res.status(503).send("Analysis not ready yet. Please try again shortly.");
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

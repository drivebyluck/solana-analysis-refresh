const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const axios = require("axios");

const app = express();
app.use(cors());
const port = 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/api/analysis", async (req, res) => {
  try {
    // Step 1: Fetch live Solana data
    const priceResponse = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
      params: {
        ids: "solana",
        vs_currencies: "usd",
        include_24hr_change: "true",
      },
    });

    const currentPrice = priceResponse.data.solana.usd;
    const percentChange = priceResponse.data.solana.usd_24h_change.toFixed(2);

    // Step 2: Build prompt with live data
    const prompt = `
You are a crypto trading expert and web developer for a site called TradeWithJars.net.

Use the following real Solana data:
- Current Price: $${currentPrice}
- 24h Change: ${percentChange > 0 ? "+" : ""}${percentChange}%

Create a fully styled HTML block for "Solana Perpetual Analysis" using this live data.

Follow these rules:
- Use a black background and white text.
- Use green (#017a36) for bullish values and red (#e02c2c) for bearish ones.
- Put everything inside one <div>.
- Do not use markdown or wrap the HTML in \`\`\`.
- Do not include explanations or summaries outside the HTML.

Your HTML must include:
1. A centered timestamp
2. A bold red headline: "TECHNICAL ANALYSIS BY JARS"
3. A trading setup table with filled values:
   - Bias
   - Setup
   - Entry
   - Trigger
   - Stop
   - Target
   - Leverage
4. 24h % Change and Current Price (using the live data)
5. Two paragraphs:
   - First explains the rationale
   - Second gives both long and short scenarios with the most likely one highlighted

Use inline styles to match the TradeWithJars.net glowing red theme.
    `.trim();

    // Step 3: Ask GPT to generate analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let analysisHTML = completion.choices[0].message.content;

    // Step 4: Remove ```html or ``` if GPT accidentally adds them
    analysisHTML = analysisHTML.replace(/```html|```/g, "").trim();

    res.send(analysisHTML);
  } catch (error) {
    console.error("Error generating analysis:", error);
    res
      .status(500)
      .send(`<div style="color:red;">Error generating analysis: ${error.message}</div>`);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

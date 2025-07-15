const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
const port = 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/api/analysis", async (req, res) => {
  try {
    const prompt = `
You are a crypto trading expert and web developer for a site called TradeWithJars.net.

You must generate a full, styled HTML section matching the dark theme and glowing red boxes of TradeWithJars.net. Use a black background, white text, green (#017a36) for bullish values, and red (#e02c2c) for bearish values.

Create a responsive HTML block for the "Solana Perpetual Analysis" that includes:

1. A centered timestamp of the update.
2. A bold headline: "TECHNICAL ANALYSIS BY JARS"
3. A trading setup table with these fields filled:
- Bias
- Setup
- Entry
- Trigger
- Stop
- Target
- Leverage
4. 24h % Change and Current Price styled clearly
5. Two paragraphs of analysis:
- The first should explain the rationale behind the trade setup
- The second should outline both long and short scenarios, but highlight the more likely one
6. Use readable layout and match the site’s style

Do not use markdown. Output only complete HTML, wrapped in a single <div>. Use inline styles to ensure readability inside a glowing red box.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const analysisHTML = completion.choices[0].message.content;
    res.send(analysisHTML);
  } catch (error) {
    console.error("Error generating analysis:", error);
    res.status(500).send(`<div style="color:red;">Error generating analysis: ${error.message}</div>`);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Solana Analysis API is live.");
});

app.get("/api/analysis", async (req, res) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `
You are a professional crypto trading analyst. Generate a complete daily technical analysis for Solana (SOL) perpetual futures using current market context.

1. Create a strategy table with the following:
- Bias: Bullish or Bearish
- Setup: Consolidation, Breakout, Reversal, etc.
- Entry: Suggested entry price range
- Trigger: Condition for confirmation (e.g., break above resistance)
- Stop: Suggested stop loss
- Target: Profit targets
- Leverage: Reasonable leverage suggestion

2. Explain long and short setups in detail. Include:
- Why each setup could happen
- When to enter and exit
- What confirmations to look for

3. Market context section:
- Volume and open interest summary
- Long/short ratio or trader sentiment (estimation okay)
- Any recent news or catalyst to factor in

4. Outlook:
- Final recommendation: Long or Short, and why
- Timestamp at the bottom

Use HTML for layout. Put the strategy table at the top. Use <br> for spacing. Use green text for bullish levels and red for bearish. Format it so it can be displayed inside a styled box on the website.
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a trading assistant that outputs clear HTML." },
        { role: "user", content: prompt }
      ],
    });

    const response = completion.data.choices[0].message.content;
    res.send(response);
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    res.status(500).send("Failed to generate analysis.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

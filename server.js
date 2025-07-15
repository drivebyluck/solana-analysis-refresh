const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Solana Analysis API is live.");
});

app.get("/api/analysis", async (req, res) => {
  try {
    const gptPrompt = `
You are a Solana technical analyst.
Use the latest market data to complete this table and give a full trading breakdown and price outlook:

Bias: 
Setup:
Entry:
Trigger:
Stop:
Target:
Leverage:

Then write 2 paragraphs:
1. Detailed setup explanation (based on volume, OI, liquidation zones, etc).
2. Final outlook—clearly recommend a long or short and give backup scenario.

Use real values and keep the tone sharp, confident, and concise.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: gptPrompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    res.json({ analysis: content });
  } catch (error) {
    console.error("OpenAI error:", error.message);
    res.status(500).json({ error: "Failed to generate analysis." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
const port = process.env.PORT || 10000;

// Initialize OpenAI properly for v4.x
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/", (req, res) => {
  res.send("Server running");
});

app.get("/api/analysis", async (req, res) => {
  try {
    // Fetch CoinGlass long/short data
    const response = await axios.get(
      "https://open-api.coinglass.com/public/v4/futures/longShortRate?symbol=SOL",
      {
        headers: {
          accept: "application/json",
          coinglassSecret: process.env.COINGLASS_API_KEY,
        },
      }
    );

    const data = response.data.data.Binance;
    const longShortRatio = data.longShortRate;
    const longAccount = data.longAccount;
    const shortAccount = data.shortAccount;

    const prompt = `
Use the following Solana futures long/short data to write a detailed technical analysis. Include a setup table, key support/resistance zones, long and short scenarios, and your recommended play. Match the tone and format of past TradeWithJars.net content. 
Long/Short Ratio: ${longShortRatio}
Long Accounts: ${longAccount}
Short Accounts: ${shortAccount}
`;

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional crypto technical analyst for TradeWithJars.net. Provide structured Solana trading analysis using provided data.",
        },
        { role: "user", content: prompt },
      ],
    });

    const result = gptResponse.choices[0].message.content;
    res.send(result);
  } catch (error) {
    console.error("❌ OpenAI Error:", error.response?.data || error.message || error);
    res.status(500).send("Failed to generate analysis");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

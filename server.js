const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateAnalysis() {
  try {
    const now = new Date();
    const timestamp = now.toLocaleString("en-US", { timeZone: "America/New_York" });

    const prompt = `
You are a professional crypto technical analyst named Jars. Write a detailed Solana (SOL) perpetual futures market analysis based on current market conditions. Include:

1. A table with:
- Bias (Long or Short)
- Setup (What pattern or reason)
- Entry
- Trigger
- Stop Loss
- Target
- Leverage

2. A 3-4 paragraph breakdown of why this setup is valid right now.
3. Provide both long and short scenarios, but clearly recommend one as the better probability setup.
4. Close with a summary outlook in bold.

Format everything in clean HTML using white text, green #017a36 for bullish text, red #e02c2c for bearish text. Use a black background. Start with a headline that says "SOLANA PERPETUAL ANALYSIS" and "TECHNICAL ANALYSIS BY JARS" below it. Include a timestamp in EST.
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              background-color: #000;
              color: #fff;
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            h1 {
              color: #fff;
              text-align: center;
              font-size: 28px;
              margin-bottom: 0;
            }
            h2 {
              text-align: center;
              color: #ccc;
              font-size: 16px;
              margin-top: 5px;
            }
            .timestamp {
              text-align: center;
              color: #888;
              font-size: 14px;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #444;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #111;
              color: #fff;
            }
            .bullish {
              color: #017a36;
            }
            .bearish {
              color: #e02c2c;
            }
            strong {
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <h1>SOLANA PERPETUAL ANALYSIS</h1>
          <h2>TECHNICAL ANALYSIS BY JARS</h2>
          <div class="timestamp">Last updated: ${timestamp} EST</div>
          ${completion.data.choices[0].message.content}
        </body>
      </html>
    `;

    fs.writeFileSync("solana-analysis.html", htmlContent, "utf8");
    return htmlContent;
  } catch (error) {
    console.error("❌ OpenAI Error:", error?.response?.data || error.message || error);
    return `<html><body style="background:black;color:white;padding:20px;"><h1>Error generating analysis</h1><p>${error?.message || "Unknown error"}</p></body></html>`;
  }
}

app.get("/", async (req, res) => {
  const content = await generateAnalysis();
  res.send(content);
});

app.get("/solana-analysis.html", async (req, res) => {
  try {
    if (fs.existsSync("solana-analysis.html")) {
      res.sendFile(__dirname + "/solana-analysis.html");
    } else {
      const content = await generateAnalysis();
      res.send(content);
    }
  } catch (err) {
    res.status(500).send("Error loading analysis.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

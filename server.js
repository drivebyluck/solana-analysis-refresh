const express = require("express");
const axios = require("axios");
const { OpenAIApi, Configuration } = require("openai");
const cors = require("cors");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

app.get("/", (req, res) => {
  res.send("Solana Analysis API is live.");
});

app.get("/api/solana", async (req, res) => {
  try {
    const prompt = `
You are a Solana market analyst. Generate a detailed technical analysis for the current day based on typical market patterns, price action, and common trading setups. Include a clearly formatted trading setup table first (with Bias, Setup, Entry, Trigger, Stop, Target, Leverage). Then write a full explanation of the current Solana market conditions and a prediction of the most likely scenario (long or short), including price zones to watch. Finally, provide a backup scenario with the opposite bias and justification for it. Make it sound like it's coming from a seasoned trader who explains why the trade makes sense. Use natural language and keep it concise but useful.
`;

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a Solana trading analyst and market strategist.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const analysis = response.data.choices[0].message.content;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body {
            background-color: black;
            color: white;
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 1em;
            box-sizing: border-box;
          }
          h2 {
            color: #e02c2c;
            text-align: center;
            margin-bottom: 0.5em;
          }
          .label {
            text-align: center;
            color: #017a36;
            font-size: 1.1em;
            margin-bottom: 1em;
          }
          .timestamp {
            text-align: center;
            color: #888;
            font-size: 0.9em;
            margin-top: 0.25em;
          }
          .content {
            max-width: 900px;
            margin: auto;
            padding: 1em;
            background-color: #111;
            border-radius: 10px;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #111;
            padding: 1em;
            border-left: 4px solid #e02c2c;
            margin-top: 1em;
          }
        </style>
        <script>
          window.addEventListener("load", function () {
            parent.postMessage({ height: document.body.scrollHeight }, "*");
          });
        </script>
      </head>
      <body>
        <div class="content">
          <h2>Solana Perpetual Analysis</h2>
          <div class="label">TECHNICAL ANALYSIS BY JARS</div>
          <div class="timestamp">Last updated: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST</div>
          <pre>${analysis}</pre>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Error generating analysis:", error.message);
    res.status(500).json({ error: "Failed to generate analysis." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

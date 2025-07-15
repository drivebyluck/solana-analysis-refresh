import express from 'express';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.static(path.join(__dirname, 'public')));

async function fetchAndWriteAnalysis() {
  try {
    const coinglassData = await axios.get(
      'https://api.coinglass.com/public/v4/futures/long_short_account_ratio?symbol=SOL'
    );

    const ratio = coinglassData.data.data.longShortRatio || 'N/A';

    const prompt = `
You are a professional Solana trader. Based on current market conditions and the long/short ratio of ${ratio}, generate a detailed technical analysis for Solana (SOL) including a table with the trading setup (Bias, Setup, Entry, Trigger, Stop, Target, Leverage), a paragraph on the current market conditions, and two scenarios: a long scenario and a short scenario. Then, clearly state which is more likely today and why.

Make the output clear, easy to read, and realistic. Use this data: Long/Short Ratio = ${ratio}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const analysisText = completion.choices[0].message.content;

    const wrappedContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Solana Analysis</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: black;
      color: white;
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #e02c2c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table, th, td {
      border: 1px solid #e02c2c;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    .green { color: #017a36; }
    .red { color: #e02c2c; }
  </style>
</head>
<body>
  <h2>TECHNICAL ANALYSIS BY JARS</h2>
  <p>Last Updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
  ${analysisText}
</body>
</html>
    `;

    fs.writeFileSync(path.join(__dirname, 'public', 'solana-analysis.html'), wrappedContent, 'utf8');
    console.log('✅ Analysis updated successfully');
  } catch (error) {
    console.error('❌ Error generating analysis:', error.response?.data || error.message);
  }
}

app.get('/refresh', async (req, res) => {
  await fetchAndWriteAnalysis();
  res.send('✅ Refreshed analysis');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  fetchAndWriteAnalysis();
});

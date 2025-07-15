// server.js
import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const cgKey = process.env.CG_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: openaiKey });

async function getLongShortSOL() {
  const url = 'https://open-api-v4.coinglass.com/api/futures/global-long-short-account-ratio/history?symbol=SOL&interval=4h';

  const resp = await fetch(url, {
    headers: { 'CG-API-KEY': cgKey }
  });

  if (!resp.ok) throw new Error(`CoinGlass error ${resp.status}`);

  const json = await resp.json();
  const data = json.data.slice(-2); // Last two data points

  return data.map(item => ({
    time: new Date(item.time).toLocaleString(),
    longPct: item.global_account_long_percent,
    shortPct: item.global_account_short_percent,
    ratio: item.global_account_long_short_ratio
  }));
}

async function getOpenAISummary(data) {
  const prompt = `You are a Solana crypto analyst. Based on the latest 4h global long/short ratio data for SOL, give a professional yet concise summary and trading outlook. Use the following data:\n` +
    data.map(d => `${d.time}: Long ${d.longPct}%, Short ${d.shortPct}%, Ratio ${d.ratio}`).join('\n') +
    `\nWhich side looks more dominant and what should traders consider over the next 8-12 hours?`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    messages: [
      { role: 'system', content: 'You are a seasoned crypto analyst offering technical summaries.' },
      { role: 'user', content: prompt }
    ]
  });

  return response.choices[0].message.content;
}

app.get('/solana-analysis.html', async (req, res) => {
  try {
    const solData = await getLongShortSOL();
    const summary = await getOpenAISummary(solData);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Solana Perpetual Analysis</title>
        <style>
          body {
            background: black;
            color: white;
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1, h2 { color: #e02c2c; }
          .entry { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>Solana Futures Long/Short Analysis</h1>
        <p>Last updated: ${new Date().toLocaleString()}</p>

        ${solData.map(d => `
          <div class="entry">${d.time}: Long ${d.longPct}%, Short ${d.shortPct}%, Ratio ${d.ratio}</div>
        `).join('')}

        <h2>Summary</h2>
        <p>${summary}</p>

        <script>
          const height = document.body.scrollHeight;
          window.parent.postMessage({ height }, '*');
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<html><body style="background:black;color:white;"><h1>Error</h1><pre>${err.message}</pre></body></html>`);
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server running on port ${port}`));

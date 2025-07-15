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
  const resp = await fetch('https://open-api-v4.coinglass.com/api/futures/global-long-short-account-ratio/history?symbol=SOL&interval=4h', {
    headers: { 'CG-API-KEY': cgKey }
  });
  if (!resp.ok) throw new Error(`CoinGlass ${resp.status}`);
  const json = await resp.json();
  const data = json.data.slice(-2);
  return data.map(x => ({
    time: new Date(x.time).toISOString(),
    longPct: x.global_account_long_percent,
    shortPct: x.global_account_short_percent,
    ratio: x.global_account_long_short_ratio
  }));
}

async function getSummary(solData) {
  const msg = `SOL long/short % over last two points:\n${solData.map(d=>`${d.time}: long ${d.longPct}%, short ${d.shortPct}%, ratio ${d.ratio}`).join('\n')}\nGive me a quick analysis.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a crypto analyst.' },
      { role: 'user', content: msg }
    ],
    temperature: 0.7
  });
  return resp.choices[0].message.content;
}

app.get('/solana-analysis.html', async (req, res) => {
  try {
    const solData = await getLongShortSOL();
    const summary = await getSummary(solData);
    res.send(`
      <!DOCTYPE html><html><body style="color: white; background: black; font-family: sans-serif;">
      <h1>SOL Futures Long/Short Analysis</h1>
      <p>Last updated: ${new Date().toLocaleString()}</p>
      ${solData.map(d=>`<div>${d.time}: Long ${d.longPct}%, Short ${d.shortPct}%, Ratio ${d.ratio}</div>`).join('')}
      <h2>Summary</h2><p>${summary}</p>
      <script>
        const height = document.body.scrollHeight;
        window.parent.postMessage({ height }, '*');
      </script>
      </body></html>`);
  } catch (e) {
    console.error(e);
    res.send(`<html><body><h1>Error</h1><pre>${e.message}</pre></body></html>`);
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server running on port ${port}`));

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());

app.get('/', (req, res) => {
  res.send('✅ Solana Analysis API is running.');
});

app.get('/analysis', async (req, res) => {
  try {
    const { data: html } = await axios.get('https://www.coinglass.com/coin/SOL');
    const $ = cheerio.load(html);

    let longShortRatio = null;
    $('div').each((_, el) => {
      const text = $(el).text();
      if (text.includes('Long/Short')) {
        const match = text.match(/Long\/Short.*?([\d.]+):([\d.]+)/);
        if (match) {
          longShortRatio = `${match[1]} : ${match[2]}`;
        }
      }
    });

    if (!longShortRatio) {
      return res.status(500).json({ error: 'Failed to extract long/short ratio from page.' });
    }

    const prompt = `
You are a crypto market analyst focused on Solana. Based on the long/short ratio ${longShortRatio}, provide a concise technical analysis including bias, entry price zone, stop loss, take profit target, and your best guess on short vs long trade preference today. Use a table format at the top like this:

Bias: [Bullish/Bearish]
Setup: [Scalp / Swing / Trend / Reversal]
Entry: [Example: 142.50 - 143.10]
Trigger: [What must happen first]
Stop: [Example: 140.30]
Target: [Example: 148.50]
Leverage: [Suggested range]

Then write a 3-paragraph analysis in plain English explaining the setup, key levels, and outlook.
    `;

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a crypto market analyst.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    const gptText = gptResponse.choices[0].message.content;

    res.status(200).send(gptText);
  } catch (err) {
    console.error('❌ Error generating analysis:', err.message || err);
    res.status(500).send('Failed to generate analysis.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

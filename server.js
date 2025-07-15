import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 10000;

app.use(cors());
app.use(express.static('public'));

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

app.get('/solana-analysis.html', async (req, res) => {
  try {
    const [longShortData, oiData] = await Promise.all([
      axios.get('https://open-api.coinglass.com/api/pro/v1/futures/longShortAccountRatio?symbol=SOL', {
        headers: { 'coinglassSecret': process.env.COINGLASS_API_KEY }
      }),
      axios.get('https://open-api.coinglass.com/api/pro/v1/futures/openInterestChart?symbol=SOL', {
        headers: { 'coinglassSecret': process.env.COINGLASS_API_KEY }
      })
    ]);

    const longShortRatio = longShortData.data?.data?.list?.at(-1)?.value || 'Unknown';
    const openInterest = oiData.data?.data?.list?.at(-1)?.sumOpenInterest || 'Unknown';

    const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    const prompt = `
You are a crypto analyst. Use this Solana market data:

- Long/Short Ratio: ${longShortRatio}
- Open Interest: ${openInterest}

Write a concise technical analysis and provide:
1. A bullish (long) scenario
2. A bearish (short) scenario
3. A recommended direction (long or short)
4. Entry, Stop, Target, and Leverage in table format.
`;

    const chatResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });

    const analysis = chatResponse.data.choices[0].message.content;
    const $ = cheerio.load('<html><body><div class="section"></div></body></html>');

    $('.section').append(`<h2>SOLANA PERPETUAL ANALYSIS</h2>`);
    $('.section').append(`<p style="color:#aaa;">Last updated: ${now} EST</p>`);
    $('.section').append(`<div style="white-space:pre-wrap;text-align:left;margin:auto;max-width:900px;">${analysis}</div>`);

    const height = 200 + analysis.split('\n').length * 22;
    $('body').append(`<script>window.parent.postMessage({height: ${height}}, "*")</script>`);

    res.send($.html());
  } catch (err) {
    console.error('❌ Error generating analysis:', err.message || err);
    res.send(`
      <html><body><div class="section">
      <h2>SOLANA PERPETUAL ANALYSIS</h2>
      <p style="color:#aaa;">Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST</p>
      <div style="color:red;border:1px solid #e02c2c;padding:10px;margin:10px auto;max-width:600px;">Error fetching data or generating analysis.</div>
      </div></body></html>
    `);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

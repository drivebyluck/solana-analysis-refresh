require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const fs = require('fs');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/solana-analysis', async (req, res) => {
  try {
    // Fetch real-time Solana price
    const priceRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const solPrice = priceRes.data.solana.usd;

    // Create the prompt with current SOL price
    const prompt = `
Provide a detailed technical analysis of Solana (SOL/USDT) with current price at $${solPrice}.
Step 1: Recommend a LONG or SHORT position based on current market conditions, volume, trend, and support/resistance.
Step 2: Provide a backup setup for the opposite case in case the first fails.
Step 3: Use this table format:
- Bias (Preferred/Backup)
- Setup
- Entry
- Trigger
- Stop
- Target
- Leverage
Step 4: End with a Market Breakdown and Timing & Outlook.

Keep colors readable on black background: white text, green (#017a36) for bullish/highlighted, red (#e02c2c) for bearish. Do not use any black or light-colored fonts. All sections must match the theme. Keep layout tight with no large bottom gap. Return only clean HTML.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto technical analyst. Return a full HTML section using only colors that are readable on a black background. Match Jars\' site design with red/green/white fonts. Only use real numbers and data from market. Do not say you are an AI or mention OpenAI.',
        },
        {
          role: 'user',
          content: prompt,
        }
      ]
    });

    const easternTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    let content = response.choices?.[0]?.message?.content || '';

    // Remove ```html and trailing ```
    content = content.replace(/^```html/, '').replace(/```$/, '').trim();

    // Ensure timestamp and credit appear correctly after <h2>
    if (/<p style=".*?">.*?<\/p>/.test(content)) {
      content = content.replace(
        /<p style=".*?">.*?<\/p>/,
        `<p style="font-size:13px;color:#999;margin-top:-10px;">
          Last updated: ${easternTime}<br>
          <em>TECHNICAL ANALYSIS BY JARS</em>
        </p>`
      );
    } else {
      content = content.replace(
        /(<h2[^>]*>Solana Perpetual Analysis<\/h2>)/,
        `$1\n<p style="font-size:13px;color:#999;margin-top:-10px;">
          Last updated: ${easternTime}<br>
          <em>TECHNICAL ANALYSIS BY JARS</em>
        </p>`
      );
    }

    if (!content || content.trim() === '') {
      content = `<div class="section"><h2 style="color:red;">ERROR</h2><p>Failed to generate analysis.</p></div>`;
    }

    fs.writeFileSync('./public/solana-analysis.html', content, 'utf8');
    res.send('✅ Analysis updated');
  } catch (err) {
    console.error('❌ GPT Generation Failed:', err);
    fs.writeFileSync('./public/solana-analysis.html', '<div class="section"><h2 style="color:red;">ERROR</h2><p>Failed to generate analysis.</p></div>', 'utf8');
    res.status(500).send('❌ Failed to generate analysis');
  }
});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

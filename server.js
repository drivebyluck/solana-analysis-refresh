require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/solana-analysis', async (req, res) => {
  try {
    const coinglassData = await fetch('https://open-api.coinglass.com/public/v4/open_interest/coin/detail?symbol=SOL', {
      headers: {
        'coinglassSecret': process.env.COINGLASS_API_KEY
      }
    }).then(r => r.json());

    const oi = coinglassData?.data?.openInterest || 'N/A';
    const volume = coinglassData?.data?.volume || 'N/A';
    const longRate = coinglassData?.data?.longRate || 'N/A';
    const shortRate = coinglassData?.data?.shortRate || 'N/A';

    const marketDataString = `
Open Interest: ${oi}
Volume: ${volume}
Long/Short Ratio: ${longRate}/${shortRate}
    `;

    const prompt = `
Using all of the following data, provide a real-time technical analysis for Solana (SOL/USDT). Incorporate price action, support/resistance, MACD, RSI, order blocks, liquidation zones, and trend behavior. Assume current Solana price is $157. Use the following data:
${marketDataString}

Recommend a LONG or SHORT based on the data and explain why it's more likely.
Also provide a backup plan for the opposite scenario.

Then include a table with:
- Bias (Preferred/Backup)
- Setup
- Entry
- Trigger
- Stop
- Target
- Leverage

End with a Market Breakdown and Timing & Outlook.
Format in clean HTML that fits into a black background with only white (#ffffff), green (#017a36), or red (#e02c2c) fonts.
Always follow the same layout, use tight spacing, and no extra margin or padding at the bottom.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto technical analyst. Return the entire section in HTML format exactly matching Jars\' website design. The section must contain: 1) a table with long and short trading setups for Solana including entry, trigger, stop, target, and suggested leverage (between 10x–75x); 2) a detailed written market breakdown; 3) a short list of near-term and medium-term timing and outlook. Do not mention GPT or OpenAI.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const easternTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    let content = response.choices?.[0]?.message?.content || '';

    // Remove accidental code fences
    content = content.replace(/^```html\s*/i, '').replace(/```$/, '').trim();

    // Apply styling
    content = content
      .replace(/color:\s*#000000/gi, 'color: #ffffff')
      .replace(/color:\s*black/gi, 'color: #ffffff')
      .replace(/background-color:\s*[^;"]+/gi, 'background-color: #000000');

    // Inject forced background and font colors to enforce consistency
    content = `<div style="background-color:#000000; color:#ffffff; padding:10px; font-family:sans-serif;">
${content}
</div>`;

    // Timestamp
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

    // Trim bottom whitespace
    content = content.replace(/\s+<\/div>$/, '</div>');

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

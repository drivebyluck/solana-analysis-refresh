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
    const prompt = `
Provide a clear technical analysis of Solana (SOL/USDT). Recommend either a LONG or SHORT position based on the current trend and support/resistance levels, and explain why it is preferred. 
Then, provide a secondary alternative setup for the opposite direction in case the preferred setup fails. Include a table with:
- Bias (Preferred/Backup)
- Setup
- Entry
- Trigger
- Stop
- Target
- Leverage

End with a Market Breakdown and Timing & Outlook.
Format in simple HTML.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto technical analyst. Return the entire section in HTML format exactly matching Jars\' website design. The section must contain: 1) a table with long and short trading setups for Solana including entry, trigger, stop, target, and suggested leverage (between 10x–75x); 2) a detailed written market breakdown; 3) a short list of near-term and medium-term timing and outlook. Do not mention GPT or OpenAI.',
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const easternTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    let content = response.choices?.[0]?.message?.content || '';

    // Strip ```html or ``` if they appear
    content = content.replace(/^```html\s*/i, '').replace(/```$/, '').trim();

    // Inject custom styling block at the top to force consistent formatting/colors
    const styleBlock = `
<style>
  body { background-color: #000; color: #fff; font-family: 'Trebuchet MS', sans-serif; margin: 0; padding: 0; }
  h1, h2, h3 { color: #017a36; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { padding: 12px; border: 1px solid #444; }
  th { background-color: #111; color: #e02c2c; }
  tr:nth-child(even) { background-color: #111; }
  tr:nth-child(odd) { background-color: #000; }
  p, li { color: #fff; font-size: 16px; line-height: 1.6; }
</style>
`;

    // Prepend style block only once
    if (!content.includes('<style>')) {
      content = styleBlock + '\n' + content;
    }

    // Insert timestamp line below H2
    content = content.replace(
      /(<h2[^>]*>Solana Perpetual Analysis<\/h2>)/,
      `$1\n<p style="font-size:13px;color:#999;margin-top:-10px;">
        Last updated: ${easternTime}<br>
        <em>TECHNICAL ANALYSIS BY JARS</em>
      </p>`
    );

    // Remove trailing whitespace or large gaps
    content = content.replace(/\s+$/g, '');

    if (!content || content.trim() === '') {
      content = `<div class="section"><h2 style="color:red;">ERROR</h2><p>Failed to generate analysis from GPT.</p></div>`;
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

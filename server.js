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
Format in simple HTML using <h2>, <p>, and <table> without inline styles.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto technical analyst. Return the entire section in HTML format. Do NOT use any inline styles. Do NOT use colors or CSS. Only return clean HTML using <h2>, <p>, <table>. Avoid repeated headings. Do not mention GPT or OpenAI.',
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const easternTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    let rawContent = response.choices?.[0]?.message?.content || '';

    // Strip any ``` wrappers
    rawContent = rawContent.replace(/^```html\s*/i, '').replace(/```$/, '').trim();

    // Build the final full HTML content with locked styles
    const wrappedContent = `
<div class="analysis-wrapper">
  <style>
    body { margin: 0; padding: 0; background: black; color: white; font-family: 'Trebuchet MS', sans-serif; }
    .analysis-wrapper { background: black; padding: 20px; color: white; }
    h2 { color: #017a36; margin-bottom: 10px; }
    p { font-size: 16px; line-height: 1.6; color: white; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #111; color: #e02c2c; padding: 10px; border: 1px solid #444; }
    td { background: #000; color: white; padding: 10px; border: 1px solid #444; }
    em { color: #999; }
  </style>
  <h2>Solana Perpetual Analysis</h2>
  <p style="font-size:13px;color:#999;margin-top:-10px;">
    Last updated: ${easternTime}<br>
    <em>TECHNICAL ANALYSIS BY JARS</em>
  </p>
  ${rawContent}
</div>
    `;

    fs.writeFileSync('./public/solana-analysis.html', wrappedContent, 'utf8');
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

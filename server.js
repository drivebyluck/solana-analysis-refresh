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

    // Remove markdown-style code block
    content = content.replace(/^```html\s*/i, '').replace(/```$/, '').trim();

    // Wrap entire content in black background and apply readable font colors
    content = `
<div style="background-color:#000000; color:#ffffff; padding:20px;">
${content}
</div>
`.replace(/color:\s*#000000/gi, 'color: #ffffff') // override any black text
 .replace(/color:\s*red/gi, 'color: #e02c2c')      // ensure red matches site
 .replace(/color:\s*green/gi, 'color: #017a36');   // ensure green matches site

    // Insert timestamp below heading
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

    // Final safety check
    if (!content || content.trim() === '') {
      content = `<div class="section"><h2 style="color:#e02c2c;">ERROR</h2><p>Failed to generate analysis from GPT.</p></div>`;
    }

    fs.writeFileSync('./public/solana-analysis.html', content, 'utf8');
    res.send('✅ Analysis updated');
  } catch (err) {
    console.error('❌ GPT Generation Failed:', err);
    fs.writeFileSync('./public/solana-analysis.html', '<div class="section"><h2 style="color:#e02c2c;">ERROR</h2><p>Failed to generate analysis.</p></div>', 'utf8');
    res.status(500).send('❌ Failed to generate analysis');
  }
});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

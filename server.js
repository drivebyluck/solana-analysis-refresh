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
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto technical analyst. Return the entire section in HTML format exactly matching Jars\' website design. The section must contain: 1) a table with long and short trading setups for Solana including entry, trigger, stop, target, and suggested leverage (between 10x–75x); 2) a detailed written market breakdown; 3) a short list of near-term and medium-term timing and outlook. Do not mention GPT or OpenAI.',
        },
        {
          role: 'user',
          content: 'Generate a fresh Solana Perpetual Analysis section with Eastern Time timestamp. Only the heading "Solana Perpetual Analysis" and the TECHNICAL ANALYSIS BY JARS line stay unchanged. Everything else must be new and updated each time.'
        }
      ]
    });

    const easternTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const finalHtml = response.choices[0].message.content.replace(
      /<p style=".*?">.*?<\/p>/,
      `<p style="font-size:13px;color:#999;margin-top:-10px;">
        Last updated: ${easternTime}<br>
        <em>TECHNICAL ANALYSIS BY JARS</em>
      </p>`
    );

    fs.writeFileSync('./public/solana-analysis.html', finalHtml, 'utf8');
    res.send('✅ Analysis updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Failed to generate analysis');
  }
});

// Serve the HTML file publicly
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a crypto technical analyst. Return the entire section in HTML format exactly matching Jars\' website design. The section must contain: 1) a table with long and short trading setups for Solana including entry, trigger, stop, target, and suggested leverage (between 10x–75x); 2) a detailed written market breakdown; 3) a short list of near-term and medium-term timing and outlook. Do not mention GPT or OpenAI. Recommend long or short clearly, but also explain what to look for if the opposite move happens.',
        },
        {
          role: 'user',
          content: 'Generate a fresh Solana Perpetual Analysis section with Eastern Time timestamp. Only the heading "Solana Perpetual Analysis" and the TECHNICAL ANALYSIS BY JARS line stay unchanged. Everything else must be new and updated each time.'
        }
      ]
    });

    const easternTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    let content = response.choices?.[0]?.message?.content || '';

    // Remove ```html and ``` if present
    content = content.replace(/```html\s*|```/g, '');

    // Insert timestamp under heading or as needed
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

    // Wrap content in styled container matching your site theme
    content = `
    <div style="background:#0d0d0d;color:#ffffff;font-family:'Trebuchet MS',sans-serif;padding:20px;text-align:center;">
      <style>
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 12px;
          border: 1px solid #444;
        }
        th {
          background-color: #222;
          color: #e02c2c;
        }
        tr:nth-child(even) {
          background-color: #111;
        }
        h2 {
          color: #017a36;
        }
        p, td {
          color: #ffffff;
        }
      </style>
      ${content}
    </div>
    <script>
      window.parent.postMessage(
        { height: document.body.scrollHeight },
        "https://tradewithjars.net"
      );
    </script>`;

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

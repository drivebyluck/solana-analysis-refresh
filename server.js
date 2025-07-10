const express = require('express');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const app = express();
const port = 10000;

// ✅ Initialize OpenAI properly
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static(path.join(__dirname, 'public')));

// HTML template for the GPT-generated analysis section
function generateHTML(content) {
  return `
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          background-color: #000;
          color: #fff;
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        .box {
          border: 3px solid red;
          padding: 20px;
          background-color: black;
          color: white;
          box-shadow: 0 0 20px red;
        }
        .green { color: #017a36; }
        .red { color: #e02c2c; }
        .timestamp { font-size: 0.9em; color: gray; margin-bottom: 10px; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #444;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #111;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>SOLANA PERPETUAL ANALYSIS</h2>
        <div class="timestamp">Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST</div>
        ${content}
      </div>
      <script>
        window.parent.postMessage({ height: document.body.scrollHeight }, '*');
      </script>
    </body>
  </html>`;
}

// Route to generate and serve solana-analysis.html
app.get('/generate-analysis', async (req, res) => {
  try {
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: `
You are a crypto technical analyst. Give a full breakdown of the current SOL/USDT Perpetual market using real CoinGlass data (liquidations, open interest, long/short ratios, funding rates). Use real price data and be specific. Provide a short-term outlook in the following format:

1. A trading setup table: Bias, Setup, Entry, Trigger, Stop, Target, Leverage
2. A short paragraph breakdown of recent activity
3. A paragraph for long scenario
4. A paragraph for short scenario
5. Clear call on which direction is more likely today
All HTML must use white text on black background with red/green where appropriate. No chart, just the breakdown. Keep theme exactly like TradeWithJars.net.`
      }],
      temperature: 0.7,
    });

    const htmlContent = generateHTML(gptResponse.choices[0].message.content);
    const filePath = path.join(__dirname, 'public', 'solana-analysis.html');
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    res.send('✅ Analysis updated');
  } catch (error) {
    console.error('❌ OpenAI Error:', error);
    res.status(500).send('GPT request failed');
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Server running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

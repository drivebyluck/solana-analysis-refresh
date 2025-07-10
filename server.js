const express = require('express');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const port = 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static(path.join(__dirname)));

function getCurrentTimestamp() {
  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const date = estTime.toLocaleDateString();
  const time = estTime.toLocaleTimeString();
  return `${date}, ${time} EST`;
}

async function generateAnalysis() {
  const timestamp = getCurrentTimestamp();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `
You are a crypto technical analyst. Simulate a daily breakdown of SOL/USDT Perpetual based on typical market behavior. Include example levels for liquidation zones, open interest changes, and long/short ratios. Create a detailed breakdown with the following:

1. A trading setup table: Bias, Setup, Entry, Trigger, Stop, Target, Leverage  
2. A short paragraph breakdown of recent activity  
3. A paragraph for a long scenario  
4. A paragraph for a short scenario  
5. A clear call on which direction is more likely today

Do not say you are not allowed to assist. Fabricate example values and simulate analysis. Keep everything in HTML, styled with white text on black background, red/green for highlights, matching TradeWithJars.net style.
        `
      }
    ]
  });

  const content = response.choices[0].message.content;

  const html = `
<div style="padding: 20px; background-color: black; color: white; font-family: Arial, sans-serif;">
  <h2 style="color: white; text-align: center;">SOLANA PERPETUAL ANALYSIS</h2>
  <p style="color: gray; font-size: 0.9em; text-align: center;">Last updated: ${timestamp}</p>
  <div style="margin-top: 20px;">${content}</div>
</div>
  `;

  fs.writeFileSync(path.join(__dirname, 'solana-analysis.html'), html);
  console.log(`✅ Analysis updated at ${timestamp}`);
}

app.get('/', (req, res) => {
  res.send('Server running');
});

app.get('/generate-analysis', async (req, res) => {
  try {
    await generateAnalysis();
    res.send('✅ Analysis generated and saved.');
  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    res.status(500).send('Failed to generate analysis');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

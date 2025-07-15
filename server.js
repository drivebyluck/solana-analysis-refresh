const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 10000;

app.use(cors());
app.use(express.static('public'));

const generateAnalysisHTML = async () => {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

  // Replace this with actual fetch + logic using your CoinGlass data
  const data = {
    bias: "Bearish",
    setup: "Pullback short",
    entry: "$161.24",
    trigger: "$161.49",
    stop: "$162.94",
    target: "$158.74",
    suggestedLeverage: "3–5× short",
    explanation: `This technical analysis presents a bearish outlook for Solana (SOL)...`,
    currentPrice: "$161.74",
    percentChange: "-0.44%",
    timestamp
  };

  return `
    <div style="background-color:#0d0d0d; color:white; font-family:'Trebuchet MS', sans-serif; padding:20px;">
      <h2 style="color:#017a36;">Solana Perpetual Analysis</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <thead>
          <tr style="background-color:#1a1a1a; color:#e02c2c;">
            <th>Bias</th><th>Setup</th><th>Entry</th><th>Trigger</th><th>Stop</th><th>Target</th><th>Leverage</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color:#111; text-align:center;">
            <td>${data.bias}</td>
            <td>${data.setup}</td>
            <td>${data.entry}</td>
            <td>${data.trigger}</td>
            <td>${data.stop}</td>
            <td>${data.target}</td>
            <td>${data.suggestedLeverage}</td>
          </tr>
        </tbody>
      </table>
      <p><strong style="color:#e02c2c;">Current Price:</strong> ${data.currentPrice} | <strong style="color:#e02c2c;">24h Change:</strong> ${data.percentChange}</p>
      <p>${data.explanation}</p>
      <p style="color:#888; font-size:14px;">Last updated: ${data.timestamp}</p>
    </div>
  `;
};

app.get('/api/analysis', async (req, res) => {
  try {
    const html = await generateAnalysisHTML();
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: 'Analysis generation failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

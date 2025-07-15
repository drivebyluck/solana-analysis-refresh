const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Solana Analysis API is live.');
});

app.get('/api/analysis', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true');
    const data = await response.json();

    const price = data.solana.usd;
    const change = data.solana.usd_24h_change;
    const bias = change > 0 ? 'Bullish' : 'Bearish';
    const setup = change > 0 ? 'Breakout Long' : 'Pullback Short';
    const leverage = '2x–5x';

    const entry = price.toFixed(2);
    const trigger = (change > 0 ? price * 1.015 : price * 0.985).toFixed(2);
    const stop = (change > 0 ? price * 0.975 : price * 1.025).toFixed(2);
    const target = (change > 0 ? price * 1.05 : price * 0.95).toFixed(2);

    const color = change > 0 ? '#017a36' : '#e02c2c';
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });

    const html = `
      <div style="color: white; font-family: Arial, sans-serif; background-color: #000; padding: 20px;">
        <h3 style="color: ${color}; margin-top: 0;">Solana Perpetual Analysis</h3>
        <p><strong style="color: white;">Updated:</strong> ${timestamp} EST</p>
        <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
          <tr><td><strong style="color: white;">Bias:</strong></td><td style="color: ${color};">${bias}</td></tr>
          <tr><td><strong style="color: white;">Setup:</strong></td><td>${setup}</td></tr>
          <tr><td><strong style="color: white;">Current Price:</strong></td><td>$${entry}</td></tr>
          <tr><td><strong style="color: white;">24h Change:</strong></td><td style="color: ${color};">${change.toFixed(2)}%</td></tr>
          <tr><td><strong style="color: white;">Entry:</strong></td><td>$${entry}</td></tr>
          <tr><td><strong style="color: white;">Trigger:</strong></td><td>$${trigger}</td></tr>
          <tr><td><strong style="color: white;">Stop:</strong></td><td>$${stop}</td></tr>
          <tr><td><strong style="color: white;">Target:</strong></td><td>$${target}</td></tr>
          <tr><td><strong style="color: white;">Suggested Leverage:</strong></td><td>${leverage}</td></tr>
        </table>
        <p style="line-height: 1.6;">
          Given Solana's ${change.toFixed(2)}% move over the past 24 hours, current momentum suggests a <span style="color: ${color}; font-weight: bold;">${bias.toLowerCase()}</span> trend.
          Traders could consider a <strong>${setup.toLowerCase()}</strong> setup with proper risk controls. Monitor volume and liquidation zones for confirmation.
          Be prepared for the opposite scenario and use a tight stop loss if invalidated.
        </p>
        <p style="margin-top: 20px; font-size: 0.9em; color: #aaa;">
          Technical Analysis by JARS. This is for informational purposes only and not financial advice.
        </p>
      </div>
    `;

    res.send(html);
  } catch (error) {
    console.error('Analysis generation failed:', error);
    res.status(500).send(`<div style="color: red; background: black; padding: 20px;">Failed to generate analysis.</div>`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// server.js

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

// Example: GET route to serve analysis HTML
app.get('/api/analysis', async (req, res) => {
  try {
    // Optionally fetch data here (CoinGlass, etc.) and use it in the output
    // For now, hardcoded for demonstration
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              background-color: #000000;
              color: #ffffff;
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .box {
              border: 2px solid #e02c2c;
              border-radius: 10px;
              padding: 20px;
              background-color: #111111;
              max-width: 800px;
              margin: auto;
            }
            h2 {
              color: #28a745;
            }
            p {
              line-height: 1.6;
            }
          </style>
          <title>Solana Analysis</title>
        </head>
        <body>
          <div class="box">
            <h2>SOLANA PERPETUAL ANALYSIS</h2>
            <p><strong>Bias:</strong> Long</p>
            <p><strong>Setup:</strong> Bull Flag Breakout</p>
            <p><strong>Entry:</strong> $153.20</p>
            <p><strong>Trigger:</strong> 15m candle close above $154.00</p>
            <p><strong>Stop:</strong> $149.90</p>
            <p><strong>Target:</strong> $159.00</p>
            <p><strong>Leverage:</strong> 5-10x</p>
            <p style="color:#aaa;"><small>Updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</small></p>
          </div>
        </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating analysis');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

import express from 'express';

const app = express();
const port = process.env.PORT || 10000;

// Serve dynamic HTML on /solana-analysis.html
app.get('/solana-analysis.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Solana Analysis</title>
      <style>
        body {
          background-color: black;
          color: white;
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #e02c2c;
        }
        .green { color: #017a36; }
        .red { color: #e02c2c; }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #666;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #222;
        }
        iframe {
          width: 100%;
          border: none;
        }
      </style>
    </head>
    <body>
      <h1>SOLANA PERPETUAL ANALYSIS</h1>
      <p>📅 Last updated: <span id="timestamp"></span></p>
      <table>
        <tr><th>Bias</th><th>Setup</th><th>Entry</th><th>Trigger</th><th>Stop</th><th>Target</th><th>Leverage</th></tr>
        <tr><td>Long</td><td>Breakout</td><td>$140</td><td>$142</td><td>$138</td><td>$150</td><td>5x</td></tr>
      </table>
      <p><span class="green">Long Scenario:</span> If SOL breaks above $142, expect momentum to carry toward $150.</p>
      <p><span class="red">Short Scenario:</span> If it rejects and drops under $138, $132 becomes a realistic downside target.</p>
      <script>
        const now = new Date();
        document.getElementById("timestamp").textContent = now.toLocaleString();
      </script>
    </body>
    </html>
  `);
});

// Root path message
app.get('/', (req, res) => {
  res.send('<h2>✅ Solana Analysis API is running.</h2>');
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});

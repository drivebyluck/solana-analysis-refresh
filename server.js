import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 10000;

app.use(cors());

const COINGLASS_API_KEY = '3c232344442e4f269a96856cd4268936'; // your real key

app.get('/', (req, res) => {
  res.send('Solana Analysis API is live.');
});

app.get('/api/solana', async (req, res) => {
  try {
    const response = await fetch('https://open-api.coinglass.com/public/v2/open_interest/coin/detail?symbol=SOL', {
      headers: {
        'coinglassSecret': COINGLASS_API_KEY
      }
    });

    const data = await response.json();

    if (!data.success || !data.data) {
      return res.status(500).json({ error: 'Failed to fetch SOL data from CoinGlass.' });
    }

    const coinData = data.data;

    const result = {
      symbol: coinData.symbol,
      openInterest: coinData.openInterest,
      openInterestValue: coinData.openInterestValue,
      volume24h: coinData.volume24h,
      longShortRatio: coinData.longShortRate,
      timestamp: new Date().toISOString()
    };

    res.json(result);
  } catch (error) {
    console.error('API error:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

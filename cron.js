require('dotenv').config();
const fetch = require('node-fetch');

const runJob = async () => {
  try {
    const res = await fetch('https://solana-analysis-refresh.onrender.com/solana-analysis');
    const text = await res.text();
    console.log(`[${new Date().toISOString()}] Refresh Result:`, text);
  } catch (err) {
    console.error('Refresh Failed:', err);
  }
};

runJob();

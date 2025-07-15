import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let latestAnalysis = 'Analysis not yet generated.';

async function fetchCoinGlassData() {
  try {
    const response = await axios.get('https://open-api.coinglass.com/public/v2/long-short-ratio?symbol=SOL', {
      headers: {
        'coinglassSecret': process.env.COINGLASS_API_KEY
      }
    });

    const result = response.data?.data?.longShortRatioList;
    const latestEntry = result?.[result.length - 1];

    if (!latestEntry || !latestEntry.ratio) {
      throw new Error('Invalid long/short data from CoinGlass');
    }

    const ratio = parseFloat(latestEntry.ratio);
    let trend = ratio > 1 ? 'long' : 'short';

    const prompt = `
      CoinGlass long/short ratio for SOL is ${ratio.toFixed(2)}.
      Based on this data, write a concise trading setup with:
      - A bias toward ${trend}
      - A realistic entry range
      - Stop loss and take profit
      - Include a short backup scenario in case the opposite happens
      Make sure this is specific and formatted for daily crypto traders.
    `;

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    latestAnalysis = gptResponse.choices[0].message.content.trim();
    console.log('✅ Analysis updated at', new Date().toLocaleString());

  } catch (error) {
    console.error('❌ Error generating analysis:', error.message);
    latestAnalysis = 'Error fetching data or generating analysis.';
  }
}

setInterval(fetchCoinGlassData, 1000 * 60 * 60); // every hour
fetchCoinGlassData(); // initial fetch

app.get('/', (req, res) => {
  res.send(latestAnalysis);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

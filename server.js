const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
const PORT = 10000;

app.use(cors());

app.get('/api/analysis', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true');
    const data = await response.json();

    const currentPrice = data.solana.usd;
    const percentChange = data.solana.usd_24h_change.toFixed(2) + '%';

    const bias = currentPrice > 160 ? 'Bearish' : 'Bullish';
    const setup = bias === 'Bearish' ? 'Pullback short' : 'Breakout long';
    const entry = bias === 'Bearish' ? (currentPrice - 0.5).toFixed(2) : (currentPrice + 0.5).toFixed(2);
    const trigger = bias === 'Bearish' ? (currentPrice - 0.25).toFixed(2) : (currentPrice + 0.25).toFixed(2);
    const stop = bias === 'Bearish' ? (currentPrice + 1.2).toFixed(2) : (currentPrice - 1.2).toFixed(2);
    const target = bias === 'Bearish' ? (currentPrice - 3).toFixed(2) : (currentPrice + 3).toFixed(2);
    const suggestedLeverage = bias === 'Bearish' ? '3–5x short' : '3–5x long';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    const explanation = `This technical analysis presents a ${bias.toLowerCase()} outlook for Solana (SOL) with a ${setup.toLowerCase()} setup. The entry point for this trade is at $${entry}, which is ${
      bias === 'Bearish' ? 'slightly below' : 'slightly above'
    } its current trading price of $${currentPrice}. The trigger point is set at $${trigger}, which is the price level that, if reached, would activate the ${bias.toLowerCase()} position.

The stop is set at $${stop}, ${
      bias === 'Bearish' ? 'above' : 'below'
    } the current trading price, to limit potential losses if the price unexpectedly ${
      bias === 'Bearish' ? 'rises' : 'drops'
    }. The target of this setup is $${target}, meaning the anticipated price that SOL will ${
      bias === 'Bearish' ? 'drop to' : 'rise to'
    }.

The suggested leverage for this trade is ${suggestedLeverage}, suggesting a high degree of confidence in the predicted price ${
      bias === 'Bearish' ? 'drop' : 'rise'
    }. However, as with all leveraged trades, there is a higher risk associated with this setup, and traders should ensure they are comfortable with the potential losses before proceeding.

Overall, this setup suggests that SOL’s price will continue to ${
      bias === 'Bearish' ? 'fall' : 'rise'
    } in the short term, presenting an opportunity for traders to profit from a ${bias.toLowerCase()} position. However, the ${bias.toLowerCase()} bias is based on the current market conditions and could change quickly if new information comes to light. Therefore, use caution.`;

    res.json({
      timestamp,
      bias,
      setup,
      currentPrice: `$${currentPrice}`,
      percentChange,
      entry: `$${entry}`,
      trigger: `$${trigger}`,
      stop: `$${stop}`,
      target: `$${target}`,
      suggestedLeverage,
      explanation,
    });
  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: 'Analysis generation failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

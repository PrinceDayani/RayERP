import express from 'express';
import { Currency, ExchangeRate } from '../models/Currency';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Get all currencies
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currencies = await Currency.find().sort({ isBaseCurrency: -1, code: 1 });
    res.json(currencies);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ message: 'Failed to fetch currencies' });
  }
});

// Get base currency
router.get('/base', authenticateToken, async (req, res) => {
  try {
    const baseCurrency = await Currency.findOne({ isBaseCurrency: true });
    res.json(baseCurrency || { code: 'USD', name: 'US Dollar', symbol: '$' });
  } catch (error) {
    console.error('Error fetching base currency:', error);
    res.status(500).json({ message: 'Failed to fetch base currency' });
  }
});

// Get exchange rates
router.get('/rates', authenticateToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = {};
    
    if (from) query = { ...query, fromCurrency: from };
    if (to) query = { ...query, toCurrency: to };
    
    const rates = await ExchangeRate.find(query).sort({ date: -1 }).limit(100);
    res.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rates' });
  }
});

export default router;


// User Currency Settings
import UserCurrencySettings from '../models/UserCurrencySettings';
import { profileUpdateRateLimiter } from '../middleware/rateLimiter.middleware';

router.get('/user-settings', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    let settings = await UserCurrencySettings.findOne({ user: userId });
    
    if (!settings) {
      settings = await UserCurrencySettings.create({ user: userId });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching user currency settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch currency settings' });
  }
});

router.put('/user-settings', authenticateToken, profileUpdateRateLimiter, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { preferredCurrency, numberFormat } = req.body;
    
    if (numberFormat && !['indian', 'international', 'auto'].includes(numberFormat)) {
      return res.status(400).json({ success: false, message: 'Invalid numberFormat value' });
    }
    
    let settings = await UserCurrencySettings.findOne({ user: userId });
    
    if (!settings) {
      settings = await UserCurrencySettings.create({ user: userId, preferredCurrency, numberFormat });
    } else {
      if (preferredCurrency !== undefined) settings.preferredCurrency = preferredCurrency;
      if (numberFormat !== undefined) settings.numberFormat = numberFormat;
      await settings.save();
    }

    res.json({ success: true, settings, message: 'Currency settings updated successfully' });
  } catch (error) {
    console.error('Error updating user currency settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update currency settings' });
  }
});

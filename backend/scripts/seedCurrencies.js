const mongoose = require('mongoose');
require('dotenv').config();

const currencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  isBaseCurrency: { type: Boolean, default: false }
}, { timestamps: true });

const exchangeRateSchema = new mongoose.Schema({
  fromCurrency: { type: String, required: true },
  toCurrency: { type: String, required: true },
  rate: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

const Currency = mongoose.model('Currency', currencySchema);
const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

const currencies = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', isBaseCurrency: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', isBaseCurrency: false },
  { code: 'EUR', name: 'Euro', symbol: '€', isBaseCurrency: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', isBaseCurrency: false },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', isBaseCurrency: false },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', isBaseCurrency: false },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', isBaseCurrency: false },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isBaseCurrency: false },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', isBaseCurrency: false },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', isBaseCurrency: false },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', isBaseCurrency: false },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', isBaseCurrency: false },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', isBaseCurrency: false },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', isBaseCurrency: false },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', isBaseCurrency: false },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', isBaseCurrency: false },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', isBaseCurrency: false }
];

const exchangeRates = [
  // USD to other currencies
  { fromCurrency: 'USD', toCurrency: 'INR', rate: 83.12 },
  { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
  { fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79 },
  { fromCurrency: 'USD', toCurrency: 'JPY', rate: 149.50 },
  { fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.36 },
  { fromCurrency: 'USD', toCurrency: 'AUD', rate: 1.53 },
  { fromCurrency: 'USD', toCurrency: 'CHF', rate: 0.88 },
  { fromCurrency: 'USD', toCurrency: 'AED', rate: 3.67 },
  { fromCurrency: 'USD', toCurrency: 'SAR', rate: 3.75 },
  { fromCurrency: 'USD', toCurrency: 'QAR', rate: 3.64 },
  { fromCurrency: 'USD', toCurrency: 'KWD', rate: 0.31 },
  { fromCurrency: 'USD', toCurrency: 'BHD', rate: 0.38 },
  { fromCurrency: 'USD', toCurrency: 'OMR', rate: 0.38 },
  { fromCurrency: 'USD', toCurrency: 'JOD', rate: 0.71 },
  { fromCurrency: 'USD', toCurrency: 'ILS', rate: 3.65 },
  { fromCurrency: 'USD', toCurrency: 'TRY', rate: 28.50 },
  
  // INR to other currencies
  { fromCurrency: 'INR', toCurrency: 'USD', rate: 0.012 },
  { fromCurrency: 'INR', toCurrency: 'EUR', rate: 0.011 },
  { fromCurrency: 'INR', toCurrency: 'GBP', rate: 0.0095 },
  { fromCurrency: 'INR', toCurrency: 'AED', rate: 0.044 },
  { fromCurrency: 'INR', toCurrency: 'SAR', rate: 0.045 }
];

async function seedCurrencies() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Currency.deleteMany({});
    await ExchangeRate.deleteMany({});
    console.log('Cleared existing currencies and exchange rates');

    // Insert currencies
    const insertedCurrencies = await Currency.insertMany(currencies);
    console.log(`Inserted ${insertedCurrencies.length} currencies`);

    // Insert exchange rates
    const insertedRates = await ExchangeRate.insertMany(exchangeRates);
    console.log(`Inserted ${insertedRates.length} exchange rates`);

    console.log('Currency seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding currencies:', error);
    process.exit(1);
  }
}

seedCurrencies();

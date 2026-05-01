require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const traderRoutes = require('./routes/traders');
const generalRoutes = require('./routes/general');
const stockRoutes = require('./routes/stock');
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scooter_db';

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
};

// Connect before handling any request (MUST be before routes for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running!', db: isConnected ? 'connected' : 'disconnected' });
});

// Routes (AFTER DB middleware)
app.use('/api/traders', traderRoutes);
app.use('/api/general', generalRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/auth', authRoutes);

// Dashboard
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const Trader = require('./models/Trader');
    const GeneralTransaction = require('./models/GeneralTransaction');
    const TraderTransaction = require('./models/TraderTransaction');

    const tradersAgg = await Trader.aggregate([
      { $group: { _id: null, totalBalance: { $sum: "$balance" } } }
    ]);
    const totalOwedByTraders = tradersAgg.length > 0 ? tradersAgg[0].totalBalance : 0;

    const generalAgg = await GeneralTransaction.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalAlena = generalAgg.length > 0 ? generalAgg[0].total : 0;

    const paymentsAgg = await TraderTransaction.aggregate([
      { $match: { type: 'payment' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalCollected = paymentsAgg.length > 0 ? paymentsAgg[0].total : 0;

    res.json({
      totalOwedByTraders,
      totalAlena,
      totalCollected,
      netBalance: totalOwedByTraders - totalAlena
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

// Export for Vercel
module.exports = app;

const express = require('express');
const router = express.Router();
const Trader = require('../models/Trader');
const TraderTransaction = require('../models/TraderTransaction');

// Get all traders
router.get('/', async (req, res) => {
  try {
    const traders = await Trader.find().sort({ createdAt: -1 });
    res.json(traders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single trader and their transactions
router.get('/:id', async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.id);
    if (!trader) return res.status(404).json({ message: 'Trader not found' });
    
    const transactions = await TraderTransaction.find({ traderId: req.params.id }).sort({ date: -1 });
    res.json({ trader, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new trader
router.post('/', async (req, res) => {
  const trader = new Trader(req.body);
  try {
    const newTrader = await trader.save();
    res.status(201).json(newTrader);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a transaction for a trader (purchase or payment)
router.post('/:id/transactions', async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.id);
    if (!trader) return res.status(404).json({ message: 'Trader not found' });

    const { type, amount, scooterModel, notes } = req.body;
    
    const transaction = new TraderTransaction({
      traderId: trader._id,
      type,
      amount: Number(amount),
      scooterModel,
      notes
    });

    await transaction.save();

    // Update trader balance
    if (type === 'purchase') {
      trader.balance += Number(amount); // Debt increases
    } else if (type === 'payment') {
      trader.balance -= Number(amount); // Debt decreases
    }
    
    await trader.save();
    res.status(201).json({ transaction, newBalance: trader.balance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Trader = require('../models/Trader');
const TraderTransaction = require('../models/TraderTransaction');
const auth = require('../middleware/auth');

// Get all traders
router.get('/', auth, async (req, res) => {
  try {
    const traders = await Trader.find().sort({ createdAt: -1 });
    res.json(traders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single trader and their transactions
router.get('/:id', auth, async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.id);
    if (!trader) return res.status(404).json({ message: 'Trader not found' });
    
    // Sort transactions by date ascending (oldest first) so the ledger flows naturally
    const transactions = await TraderTransaction.find({ traderId: req.params.id }).sort({ date: 1 });
    res.json({ trader, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new trader
router.post('/', auth, async (req, res) => {
  const trader = new Trader(req.body);
  try {
    const newTrader = await trader.save();
    res.status(201).json(newTrader);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update trader details (name, phone)
router.put('/:id', auth, async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.id);
    if (!trader) return res.status(404).json({ message: 'Trader not found' });

    const { name, phone } = req.body;
    if (name) trader.name = name;
    if (phone) trader.phone = phone;

    await trader.save();
    res.json(trader);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a transaction for a trader (purchase or payment)
router.post('/:id/transactions', auth, async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.id);
    if (!trader) return res.status(404).json({ message: 'Trader not found' });

    const { type, amount, scooterModel, notes, date, attachment } = req.body;
    
    const transaction = new TraderTransaction({
      traderId: trader._id,
      type,
      amount: Number(amount),
      scooterModel,
      notes,
      date: date ? new Date(date) : Date.now(),
      attachment
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

// Toggle invoice status
router.patch('/:traderId/transactions/:txId/toggle-invoice', auth, async (req, res) => {
  try {
    const transaction = await TraderTransaction.findById(req.params.txId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    transaction.isInvoiced = !transaction.isInvoiced;
    await transaction.save();
    
    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit a transaction
router.put('/:traderId/transactions/:txId', auth, async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.traderId);
    if (!trader) return res.status(404).json({ message: 'Trader not found' });

    const transaction = await TraderTransaction.findById(req.params.txId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.traderId.toString() !== trader._id.toString()) {
      return res.status(400).json({ message: 'Transaction does not belong to this trader' });
    }

    const { type, amount, scooterModel, notes, date, attachment, isInvoiced } = req.body;

    // Revert old transaction effect on balance
    if (transaction.type === 'purchase') {
      trader.balance -= transaction.amount;
    } else if (transaction.type === 'payment') {
      trader.balance += transaction.amount;
    }

    // Apply new transaction effect on balance
    const newAmount = Number(amount);
    if (type === 'purchase') {
      trader.balance += newAmount;
    } else if (type === 'payment') {
      trader.balance -= newAmount;
    }

    // Update transaction fields
    transaction.type = type;
    transaction.amount = newAmount;
    transaction.scooterModel = type === 'purchase' ? scooterModel : '';
    transaction.notes = notes;
    if (attachment !== undefined) {
      transaction.attachment = attachment;
    }
    if (date) {
      transaction.date = new Date(date);
    }
    if (isInvoiced !== undefined) {
      transaction.isInvoiced = isInvoiced;
    }

    await transaction.save();
    await trader.save();

    res.json({ transaction, newBalance: trader.balance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a transaction
router.delete('/:traderId/transactions/:txId', auth, async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.traderId);
    if (!trader) return res.status(404).json({ message: 'Trader not found' });

    const transaction = await TraderTransaction.findById(req.params.txId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.traderId.toString() !== trader._id.toString()) {
      return res.status(400).json({ message: 'Transaction does not belong to this trader' });
    }

    // Revert transaction effect on balance
    if (transaction.type === 'purchase') {
      trader.balance -= transaction.amount;
    } else if (transaction.type === 'payment') {
      trader.balance += transaction.amount;
    }

    // If this transaction was linked to a stock item, restore it back to consignment status
    if (transaction.stockItemId) {
      const Stock = require('../models/Stock');
      await Stock.findByIdAndUpdate(transaction.stockItemId, { status: 'consignment' });
    }

    await TraderTransaction.findByIdAndDelete(req.params.txId);
    await trader.save();

    res.json({ message: 'Transaction deleted successfully', newBalance: trader.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a trader and all their transactions
router.delete('/:id', auth, async (req, res) => {
  try {
    const trader = await Trader.findById(req.params.id);
    if (!trader) return res.status(404).json({ message: 'Trader not found' });

    // Delete all transactions associated with this trader
    await TraderTransaction.deleteMany({ traderId: trader._id });
    
    // Delete the trader
    await Trader.findByIdAndDelete(req.params.id);

    res.json({ message: 'Trader and all associated transactions deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

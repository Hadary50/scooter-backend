const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

const Trader = require('../models/Trader');
const TraderTransaction = require('../models/TraderTransaction');

// Get all stock items
router.get('/', async (req, res) => {
  try {
    const { showroomName, status } = req.query;
    let query = {};
    if (showroomName) query.showroomName = showroomName;
    if (status) query.status = status;
    
    const stock = await Stock.find(query).sort({ createdAt: -1 });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Invoice a stock item (consignment -> sold) and record a trader transaction
router.post('/:id/invoice', auth, async (req, res) => {
  try {
    const stockItem = await Stock.findById(req.params.id);
    if (!stockItem) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    if (stockItem.status !== 'consignment') {
      return res.status(400).json({ message: 'Stock item is already sold or not in consignment' });
    }

    const { traderId, amount, date, notes, attachment } = req.body;
    if (!traderId || !amount) {
      return res.status(400).json({ message: 'Trader ID and amount are required' });
    }

    const trader = await Trader.findById(traderId);
    if (!trader) {
      return res.status(404).json({ message: 'Trader not found' });
    }

    // 1. Update Stock status to sold
    stockItem.status = 'sold';
    if (notes) {
      stockItem.notes = stockItem.notes ? `${stockItem.notes} | ${notes}` : notes;
    }
    await stockItem.save();

    // 2. Create TraderTransaction
    const scooterDetails = `${stockItem.model} (لون: ${stockItem.color || 'غير محدد'}, شاسيه: ${stockItem.chassisNumber}, ماتور: ${stockItem.engineNumber})`;
    const transaction = new TraderTransaction({
      traderId: trader._id,
      type: 'purchase',
      scooterModel: scooterDetails,
      amount: Number(amount),
      date: date ? new Date(date) : Date.now(),
      notes: notes || 'تم تحويل من مخزون الأمانة بفاتورة',
      attachment,
      isInvoiced: true
    });
    await transaction.save();

    // 3. Update Trader Balance (debt increases by amount)
    trader.balance += Number(amount);
    await trader.save();

    res.status(200).json({
      message: 'Stock item invoiced successfully',
      stockItem,
      transaction,
      newBalance: trader.balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Add a new stock item
router.post('/', auth, async (req, res) => {
  const stock = new Stock(req.body);
  try {
    const newStock = await stock.save();
    res.status(201).json(newStock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a stock item
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedStock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStock) return res.status(404).json({ message: 'Stock item not found' });
    res.json(updatedStock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a stock item
router.delete('/:id', auth, async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock item not found' });
    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

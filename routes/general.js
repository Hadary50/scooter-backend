const express = require('express');
const router = express.Router();
const GeneralTransaction = require('../models/GeneralTransaction');
const auth = require('../middleware/auth');

// Get all general transactions
router.get('/', async (req, res) => {
  try {
    const tx = await GeneralTransaction.find().sort({ date: -1 });
    res.json(tx);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a general transaction (مصروفات أو موردين - علينا)
router.post('/', auth, async (req, res) => {
  const tx = new GeneralTransaction(req.body);
  try {
    const newTx = await tx.save();
    res.status(201).json(newTx);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a general transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    await GeneralTransaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

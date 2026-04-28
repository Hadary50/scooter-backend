const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a sale
router.post('/', async (req, res) => {
  const sale = new Sale(req.body);
  try {
    // Calculations:
    sale.remainingAmount = sale.totalPrice - sale.paidAmount;
    if (sale.paymentType === 'installment' && sale.months > 0) {
      sale.monthlyAmount = sale.remainingAmount / sale.months;
    } else {
      sale.monthlyAmount = 0;
      sale.months = 0;
      sale.nextPaymentDate = null;
    }
    
    const newSale = await sale.save();
    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add payment to a sale (update paidAmount and remainingAmount)
router.put('/:id/pay', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    
    const { paymentAmount } = req.body;
    sale.paidAmount += Number(paymentAmount);
    sale.remainingAmount = sale.totalPrice - sale.paidAmount;
    
    // Update next payment date (e.g., add 1 month)
    if (sale.nextPaymentDate) {
      const nextDate = new Date(sale.nextPaymentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      sale.nextPaymentDate = nextDate;
    }

    const updatedSale = await sale.save();
    res.json(updatedSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a sale
router.delete('/:id', async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

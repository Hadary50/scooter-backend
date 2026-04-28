const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  scooterModel: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  paymentType: { type: String, enum: ['cash', 'installment'], required: true },
  months: { type: Number, default: 0 },
  monthlyAmount: { type: Number, default: 0 },
  nextPaymentDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', saleSchema);

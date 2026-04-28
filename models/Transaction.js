const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['لينا', 'علينا'], required: true },
  amount: { type: Number, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);

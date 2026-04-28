const mongoose = require('mongoose');

const traderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  balance: { type: Number, default: 0 }, // Positive means they owe us (مديونية لينا)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trader', traderSchema);

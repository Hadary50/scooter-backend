const mongoose = require('mongoose');

// This is for external expenses or suppliers (علينا)
const generalTransactionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // To whom we owe/paid
  amount: { type: Number, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GeneralTransaction', generalTransactionSchema);

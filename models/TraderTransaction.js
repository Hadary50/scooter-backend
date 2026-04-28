const mongoose = require('mongoose');

const traderTransactionSchema = new mongoose.Schema({
  traderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trader', required: true },
  type: { type: String, enum: ['purchase', 'payment'], required: true }, // purchase = سحب سكوتر, payment = دفعة نقدية
  scooterModel: { type: String }, // Only required if type is purchase
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String }
});

module.exports = mongoose.model('TraderTransaction', traderTransactionSchema);

const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  model: { type: String, required: true },
  color: { type: String },
  chassisNumber: { type: String, required: true, unique: true },
  engineNumber: { type: String, required: true, unique: true },
  showroomName: { type: String, required: true },
  status: { type: String, enum: ['consignment', 'sold'], default: 'consignment' }, // consignment = أمانة, sold = مباع
  price: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stock', stockSchema);

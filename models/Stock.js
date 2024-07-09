const mongoose = require('mongoose');
const stockSchema = new mongoose.Schema({
  machine_id: { type: String, required: true },
  Stock_Available: { type: Number, required: true },
  Upi_Sold: { type: Number, required: true },
  Coin_Sold: { type: Number, required: true },
  lastUpdated: { type: String, required: true },
  location: { type: String } ,
});

module.exports = mongoose.model('vendingmachinestockL_', stockSchema);

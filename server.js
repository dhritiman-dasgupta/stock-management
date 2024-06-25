// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const moment = require('moment-timezone');

// Load environment variables
dotenv.config();

const Stock = require('./models/Stock');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

// Route to handle GET requests to add new stock
app.get('/addStock', async (req, res) => {
  const { machine_id, Stock_Available, Upi_Sold, Coin_Sold } = req.query;

  if (!machine_id || Stock_Available == null || Upi_Sold == null || Coin_Sold == null) {
    return res.status(400).send('All fields are required');
  }

  try {
    let existingStock = await Stock.findOne({ machine_id });

    if (existingStock) {
      // Update existing document
      existingStock.Stock_Available = Number(Stock_Available);
      existingStock.Upi_Sold = Number(Upi_Sold);
      existingStock.Coin_Sold = Number(Coin_Sold);
      existingStock.lastUpdated = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

      await existingStock.save();
      res.status(200).send('Stock updated successfully');
    } else {
      // Create new document
      const newStock = new Stock({
        machine_id,
        Stock_Available: Number(Stock_Available),
        Upi_Sold: Number(Upi_Sold),
        Coin_Sold: Number(Coin_Sold),
        lastUpdated: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
      });

      await newStock.save();
      res.status(201).send('Stock added successfully');
    }
  } catch (err) {
    res.status(500).send('Failed to add/update stock');
  }
});

// Route to handle GET requests to fetch stock data by machine_id
app.get('/getStock', async (req, res) => {
  const { machine_id } = req.query;

  if (!machine_id) {
    return res.status(400).send('machine_id is required');
  }

  try {
    const stockData = await Stock.find({ machine_id });
    res.status(200).json(stockData);
  } catch (err) {
    res.status(500).send('Failed to fetch stock data');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

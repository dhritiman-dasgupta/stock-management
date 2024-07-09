const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const moment = require('moment-timezone');
const cors = require('cors');

// Load environment variables
dotenv.config();

const Stock = require('./models/Stock');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

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
  const { machine_id, Stock_Available, Upi_Sold, Coin_Sold, mac_id, location } = req.query;

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
      const response = 'Stock updated successfully ' + existingStock.lastUpdated + ' for ' + mac_id + ":";
      await existingStock.save();
      res.status(200).send(response);
    } else {
      // Create new document
      const newStock = new Stock({
        machine_id,
        Stock_Available: Number(Stock_Available),
        Upi_Sold: Number(Upi_Sold),
        Coin_Sold: Number(Coin_Sold),
        lastUpdated: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
        location: Number(location),
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

// Route to fetch information of all available devices
app.get('/getAllDevices', async (req, res) => {
  try {
    const allDevices = await Stock.find(); // Fetch all documents from Stock collection
    res.status(200).json(allDevices);
  } catch (err) {
    res.status(500).send('Failed to fetch devices');
  }
});

// Route to handle GET requests to delete stock data by machine_id
// app.get('/deleteStock', async (req, res) => {
//   const { machine_id } = req.query;

//   if (!machine_id) {
//     return res.status(400).send('machine_id is required');
//   }

//   try {
//     const result = await Stock.deleteOne({ machine_id });
//     if (result.deletedCount === 0) {
//       return res.status(404).send('No stock found with the specified machine_id');
//     }
//     res.status(200).send('Stock deleted successfully');
//   } catch (err) {
//     res.status(500).send('Failed to delete stock');
//   }
// });

// Route to handle GET requests to fetch stock data for today
// Route to handle GET requests to fetch stock data for today
app.get('/getStockToday', async (req, res) => {
  const today = moment().format('YYYY-MM-DD');

  try {
    // Fetch all stock data for today
    const stockData = await Stock.find({
      lastUpdated: {
        $regex: new RegExp(today)
      }
    });

    // Calculate the count of stock entries for today
    const stockCount = stockData.length;

    // Find the machine with the lowest stock available
    let lowestStockMachine = null;
    let lowestStock = Infinity;

    stockData.forEach(stock => {
      if (stock.Stock_Available < lowestStock) {
        lowestStock = stock.Stock_Available;
        lowestStockMachine = stock.machine_id;
      }
    });

    // Prepare the response JSON object
    const response = {
      count: stockCount,
      lowestStockMachine: lowestStockMachine,
      stockData: stockData
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Failed to fetch stock data:', err);
    res.status(500).send('Failed to fetch stock data');
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

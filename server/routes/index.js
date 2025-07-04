const express = require('express');
const AnalyticsService = require('../services/analyticsService');
const TransactionService = require('../services/transactionService');
const { requireUser } = require('./middleware/auth');

const router = express.Router();

// Root path response
router.get("/", (req, res) => {
  res.status(200).send("Welcome to Your Website!");
});

router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

module.exports = router;
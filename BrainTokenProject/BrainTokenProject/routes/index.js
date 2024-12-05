const express = require('express');
const { getTokenData, gettokenhistory,getpriceCompair } = require('../controllers/tokenController');

const router = express.Router();

router.get('/token-data', getTokenData);
router.get('/get-token-history', gettokenhistory)
router.get('/get-token-price-compair-history', getpriceCompair)

module.exports = router;

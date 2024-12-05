const axios = require('axios');
const { DEXTOOLS_API_URL } = require('../config/contract.json');
const { API_KEY } = require('../config/dexApi.json');

const headers = {
  'accept': 'application/json',
  'x-api-key': API_KEY
};

async function fetchTokenInfo(address) {
  try {
    const response = await axios.get(`${DEXTOOLS_API_URL}/token/ether/${address}/info`, { headers });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

async function getTokenPriceFromPool(poolAddress) {
  try {
    const response = await axios.get(`${DEXTOOLS_API_URL}/pool/ether/${poolAddress}/price`, { headers });
    console.log('Price info at line ', response.data.data);
    return response.data.data.price;
  } catch (error) {
    console.error('Error fetching price from pool:', error);
    return null;
  }
}

module.exports = { fetchTokenInfo, getTokenPriceFromPool };

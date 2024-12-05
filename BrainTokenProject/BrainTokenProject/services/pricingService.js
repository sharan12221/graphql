const { fetchTokenInfo, getTokenPriceFromPool } = require('./dexApiService');
const axios = require('axios');
const { DEXTOOLS_API_URL , PEPCOIN_ADDRESS } = require('../config/contract.json');
const { API_KEY } = require('../config/dexApi.json');
const PEPECOIN_AMOUNT = 100000;

const headers = {
    'accept': 'application/json',
    'x-api-key': API_KEY
  };

  async function fetchDataForAddresses(addresses) {
    const data = [];
    for (const add of addresses) {
      try {
        const tokenInfo = await fetchTokenInfo(add.address);
        console.log('Token info at lin 17 is', tokenInfo);
        const poolsResponse = await axios.get(`${DEXTOOLS_API_URL}/token/ether/${add.address}/pools?sort=creationTime&order=asc&from=2023-08-01&to=2024-09-12`, { headers });
        const poolAddresses = poolsResponse.data.data.results.length > 0 ? [poolsResponse.data.data.results[0].address] : [];
        
        if (!poolAddresses || poolAddresses.length === 0) {
          console.log('No pools found for token:', poolAddresses);
          continue;
        }
  
        let totalPrice = 0;
        let validPricesCount = 0;
  
        for (const poolAddress of poolAddresses) {
          const price = await getTokenPriceFromPool(poolAddress);
          
          if (price !== null) {
            totalPrice += add.address.toLowerCase() === PEPCOIN_ADDRESS.toLowerCase()
                    ? PEPECOIN_AMOUNT * price
                    : (price !== null ? price : 0);
                
                validPricesCount += add.address.toLowerCase() === PEPCOIN_ADDRESS.toLowerCase()
                    ? 1 
                    : (price !== null ? 1 : 0);
          }
        }
  
        if (validPricesCount > 0) {
          const averagePrice = totalPrice / validPricesCount;
  
          // Convert BigInt values to strings
          const circulatingSupply = tokenInfo.circulatingSupply ? String(tokenInfo.circulatingSupply) : undefined;
          const totalSupply = tokenInfo.totalSupply ? String(tokenInfo.totalSupply) : undefined;
          const mcap = tokenInfo.mcap ? String(tokenInfo.mcap) : undefined;
  
          data.push({
            address: add.address,
            nftId: add.nftId,
            averagePrice,
            circulatingSupply,
            totalSupply,
            mcap
          });
        } else {
          console.log('No valid prices found for token:', poolAddresses);
        }
      } catch (error) {
        console.error(`Error fetching data for address ${add.address}:`, error);
      }
    }
    return data;
  }

module.exports = { fetchDataForAddresses };

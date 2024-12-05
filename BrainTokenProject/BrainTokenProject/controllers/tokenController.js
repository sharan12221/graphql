const { getPastEvents, getLatestBlockNumber, getCurrentTimeStamp } = require('../services/web3Service');
const { fetchDataForAddresses } = require('../services/pricingService');
const { convertBigIntToString } = require('../utils/bigIntSerialize');
const { fetchTokenInfo, getTokenPriceFromPool } = require('../services/dexApiService');


const { request, gql } =require ('graphql-request');
const dotenv = require ("dotenv");
const { errors } = require('web3');
dotenv.config();

const apiKey = process.env.subgraphsAPIKey;
const uniswapV2Poolgraph = `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/A3Np3RQbaBA6oKJgiwDJeo5T3zrYfGHPWFYayMwtNDum`;

async function getTokenData(req, res) {
  try {
    let latest_block = await getLatestBlockNumber();
    latest_block = Number(latest_block);
    let historical_block = latest_block - 10678633;
    const toBlock = 'latest';

    // Fetch events
    const mintedEvents = await getPastEvents('BrainMinted', historical_block, toBlock);
    const activatedEvents = await getPastEvents('BrainTokenActivated', historical_block, toBlock);

    const mintedAddresses = mintedEvents.map(event => event.brainFather);
    const activatedAddresses = activatedEvents.map(event => event.brainTokenAddress);

    const addressesWithIds = [
      ...mintedEvents.map(event => ({ address: '0x42aa9abd9f5f3cde0ed2f2551ab1399dc48fea09', nftId: event.nftId })),
      ...activatedEvents.map(event => ({ address: event.brainTokenAddress, nftId: event.nftId }))
    ];
    console.log('Minted events are ', activatedEvents);
    const data = await fetchDataForAddresses(addressesWithIds);
    const serializedData = convertBigIntToString(data);

    res.status(200).json(serializedData);
  } catch (error) {
    console.error('Error in getTokenData:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function gettokenhistory(req, res) {
  try {
    //const { tokenAddress, fromTimeStamp, toTimeStamp } = req.body;
    const { tokenAddress, days } = req.body;

    if (!tokenAddress || !days) {
      return res.status(400).json({ error: "Missing parameters: tokenAddress and days are required" });
    }

    console.log(`Calling api with ::${tokenAddress} and ${days}`);
    // if (!tokenAddress || !fromTimeStamp || !toTimeStamp) {
    //   return res.status(400).json({ error: "Missing parameters: tokenAddress, fromTimeStamp, and toTimeStamp are required" });
    // }

    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const fromTimeStamp = currentTimestamp - (days * 24 * 60 * 60); // Subtract days in seconds
    const toTimeStamp = currentTimestamp; // Current time
    const query = `{
      token(id: "${tokenAddress}") {
        id
        symbol
        name
        derivedETH
        totalLiquidity
        tradeVolume
    		decimals
    		totalSupply
        tokenDayData(first: 1000, orderBy: date, orderDirection: asc, where: {date_gte: ${fromTimeStamp}, date_lte: ${toTimeStamp}}) {
          date
          priceUSD
        }
      }    
    }`;

    const data = await request(uniswapV2Poolgraph, query);
    console.log(`Data at line 77 is :::::::::${JSON.stringify(data)}`);
   
    const formattedTokenDayData = data.token.tokenDayData.map(dayData => ({
      date: new Date(dayData.date * 1000).toISOString().split('T')[0], // Format to YYYY-MM-DD
      priceUSD: dayData.priceUSD
    }));
    console.log(`Data at line 77 is :::::::::${JSON.stringify(formattedTokenDayData)}`);
    data.token.tokenDayData = formattedTokenDayData;
    res.status(200).json(data);

  } catch (error) {
    console.error('Error in gettokenhistory:', error);
    if (error.response) {
      res.status(500).json({ error: error.response.errors || 'Internal Server Error' });
    } else if (error.request) {
      res.status(500).json({ error: 'No response received from the API' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
}

async function getpriceCompair(req, res) {

  try {
    const { tokenAddress } = req.body;

    if (!tokenAddress) {
      return res.status(400).json({ error: "Missing parameters: tokenAddress required" });
    }
    let latest_block = await getCurrentTimeStamp();
    latest_block = Number(latest_block);
    console.log("🚀 ~ getpriceCompair ~ latest_block:", latest_block)

    const dayTimestamp = latest_block-86400;
    const weekTimestamp = latest_block-604800;
    const monthTimestamp = latest_block-2629743;
    const yearTimestamp = latest_block-31556926;
  
    function query(tokenAddress, toTimestamp){
      const query = `{
        token(id: "${tokenAddress}") {
          id
          symbol
          name
          derivedETH
          totalLiquidity
          tradeVolume
          decimals
          totalSupply
          tokenDayData(first: 1, orderBy: date, orderDirection: asc, where: {date_gte: ${toTimestamp}, date_lte: ${latest_block}}) {
            date
            priceUSD
          }
        }    
      }`;

      return query;
    }

    const priceOf24Hour = await request(uniswapV2Poolgraph, query(tokenAddress, dayTimestamp));
    const priceOf1Week = await request(uniswapV2Poolgraph, query(tokenAddress, weekTimestamp));
    const priceOf1Month = await request(uniswapV2Poolgraph, query(tokenAddress, monthTimestamp));
    const priceOf1Year = await request(uniswapV2Poolgraph, query(tokenAddress, yearTimestamp));

    const resp = {
      token: {
        address: priceOf24Hour?.token?.id || null,
        decimals: priceOf24Hour?.token?.decimals || null,
        name: priceOf24Hour?.token?.name || null,
        symbol: priceOf24Hour?.token?.symbol || null,
        totalLiquidity: priceOf24Hour?.token?.totalLiquidity || null,
        totalSupply: priceOf24Hour?.token?.totalSupply || null,
        tradeVolume: priceOf24Hour?.token?.tradeVolume || null,
        priceDifference: {
          priceBetween24h: priceOf24Hour?.token?.tokenDayData?.[0]?.priceUSD || null,
          PriceOneWeekBefore: priceOf1Week?.token?.tokenDayData?.[0]?.priceUSD || null,
          priceOneMonthBefore: priceOf1Month?.token?.tokenDayData?.[0]?.priceUSD || null,
          priceOneYearBefore: priceOf1Year?.token?.tokenDayData?.[0]?.priceUSD || null
        }
      }
    };
    res.status(200).json(resp);

  } catch (error) {
    console.error('Error in gettokenhistory:', error);
    if (error.response) {
      res.status(500).json({ error: error.response.errors || 'Internal Server Error' });
    } else if (error.request) {
      res.status(500).json({ error: 'No response received from the API' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
}



module.exports = { getTokenData, gettokenhistory, getpriceCompair };

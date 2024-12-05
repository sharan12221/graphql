const {Web3} = require('web3');
const { CONTRACT_ADDRESS, INFURA_URL } = require('../config/contract.json');
const ABI = require('../config/abi.json');

const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

async function getPastEvents(eventName, fromBlock, toBlock) {
  try {
    const events = await contract.getPastEvents(eventName, { fromBlock, toBlock });
    return events.map(event => event.returnValues);
  } catch (error) {
    console.error(`Error fetching ${eventName} events:`, error);
    return [];
  }
}

async function getLatestBlockNumber() {
    try {
      const blockNumber = await web3.eth.getBlockNumber();
      return blockNumber;
    } catch (error) {
      console.error(`Error fetching block number:`, error);
      return [];
    }
  }

  async function getCurrentTimeStamp() {
    const latestBlock = await web3.eth.getBlock('latest');
    const currentTimestamp = latestBlock.timestamp;
    return currentTimestamp;
  }

module.exports = { getPastEvents, getLatestBlockNumber,getCurrentTimeStamp };

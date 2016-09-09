import BigNumber from 'bignumber.js';
import Promise from 'bluebird';
import gnosis from '../../../src';

global.Promise = Promise;  // Use bluebird for better error logging during development.

const marketMakerHash = '0xd8e5a8116dc33e9977d31127cf8018b4555505e91ad3f3fc447f0fb9196ae3d8';
const outcomeIndex = 0;
const initialFunding = new BigNumber('1e19');

const tradePromise = gnosis.config.initializeHunchGame().then((config) => {
  // The minimum purchase is 1/10,000th of the initial funding. See
  // LMSRMarketMaker.calcC.
  const shares = initialFunding.div(10000);
  console.log(`Buying ${shares} shares of outcome ${outcomeIndex}`);
  return gnosis.hunchGame.actions.buy(
    marketMakerHash,
    outcomeIndex,
    shares,
    shares,
    config);
});

tradePromise
  .then(result => console.log('Trade result: ', result))
  .catch(error => { throw error; });

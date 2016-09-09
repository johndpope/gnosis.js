import Promise from 'bluebird';
import gnosis from '../../../src';

global.Promise = Promise;  // Use bluebird for better error logging during development.

const marketMakerHash = '0x32c87f51c109832f32a3a1b85196ac9b26b55cb883dfa7322733e0edff59c213';
const eventHash = '0x345410d90167812594f41986467722fb402cae4f5021d4ba125fc116c1b0d2c7';
const outcomeIndex = 0;

const tradePromise = gnosis.config.initializeHunchGame().then((config) => {
  return gnosis.state.stream(config).first().flatMap((state) => {
    // Sell half of the currently held shares.
    // The minimum trade is 1/10,000th of the initial funding. See
    // LMSRMarketMaker.calcC.
    const shares = gnosis.state.getSharesHeld(state, eventHash, outcomeIndex);
    const sharesToTrade = shares.div(2).floor();
    console.log(`Selling ${sharesToTrade} out of ${shares} shares of outcome ${outcomeIndex}`);
    return gnosis.hunchGame.actions.sell(
      marketMakerHash, eventHash, outcomeIndex, sharesToTrade, 0, config);
  }).toPromise();
});

tradePromise
  .then(result => console.log('Trade result: ', result))
  .catch(error => { throw error; });

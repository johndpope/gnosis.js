import Promise from 'bluebird';
import gnosis from '../../../src';

global.Promise = Promise;  // Use bluebird for better error logging during development.

const marketMakerHash = '0xd8e5a8116dc33e9977d31127cf8018b4555505e91ad3f3fc447f0fb9196ae3d8';
const eventHash = '0x299fda4d51d470af24e1ceb7c7a5f6ccfd29ed408bc58dd9157949b50dcd4f7b';
const outcomeIndex = 0;

const tradePromise = gnosis.config.initializeHunchGame().then((config) => {
  return gnosis.state.stream(config).first().flatMap((state) => {
    const shares = gnosis.state.getSharesHeld(state, eventHash, outcomeIndex);
    console.log(`Buying ${shares} shares of outcome ${outcomeIndex}`);
    return gnosis.hunchGame.actions.buy(
      marketMakerHash,
      outcomeIndex,
      shares,
      shares,
      config);
  }).toPromise();
});

tradePromise
  .then(result => console.log('Trade result: ', result))
  .catch(error => { throw error; });

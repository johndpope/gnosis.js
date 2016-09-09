import Promise from 'bluebird';
import gnosis from '../../../src';

global.Promise = Promise;  // Use bluebird for better error logging during development.

const eventHash = '0x345410d90167812594f41986467722fb402cae4f5021d4ba125fc116c1b0d2c7';

const redeemPromise = gnosis.config.initializeHunchGame().then((config) => {
  return gnosis.actions.redeemWinnings(eventHash, config);
});

redeemPromise
  .then(result => console.log('Redeem result: ', result))
  .catch(error => { throw error; });

import Promise from 'bluebird';
import gnosis from '../../../src';

global.Promise = Promise;  // Use bluebird for better error logging during development.

gnosis.config.initializeHunchGame()
  .then((config) => {
    return gnosis.actions.approveEventTokenPermanently(config.addresses.Market, config);
  })
  .then(result => console.log('Result: ', result))
  .catch(error => { throw error; });

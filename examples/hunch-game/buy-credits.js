/**
 * 1. If your contracts and factserver aren't loaded with data yet, use
 *    examples/create.js to load some.
 * 2. Run this script with babel-node-debug. Use -c to stop it from opening a new
 *    browser window.
 *    $ babel-node-debug -c examples/hunch-game/buy-credits.js
 */

import Promise from 'bluebird';
import BigNumber from 'bignumber.js';
import gnosis from '../../src';
import {promiseCallback} from '../../src/lib/callbacks';
import {waitForReceipt} from '../../src/lib/transactions';

global.Promise = Promise;  // Use bluebird for better error logging during development.

// Buy half of the amount that can be claimed for free twice daily.
const weiToSpend = new BigNumber('500').times('1e18').div('10000');

gnosis.config.initializeHunchGame().then((config) => {
  return new Promise((resolve, reject) => {
    // Determine the current number of tokens.
    config.batcher.add(
      gnosis.hunchGame.requests.tokenBalance(
        config.account,
        config,
        promiseCallback(resolve, reject)));
  }).then((balance) => {
    console.log('Current HunchGameToken balance: ', balance.toString());
    // Buy more tokens.
    return gnosis.hunchGame.actions.buyCredits(weiToSpend, config)
      .then((result) => {
        console.log('Credit purchased? ', result);
        return waitForReceipt(result.txhash, config);
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          config.batcher.add(
            gnosis.hunchGame.requests.tokenBalance(
              config.account,
              config,
              promiseCallback(resolve, reject)));
        });
      }).then((newBalance) => {
        console.log('New HunchGameToken balance: ', newBalance.toString());
        console.log(`Added ${newBalance.sub(balance).toString()} tokens.`);
      });
  });
});

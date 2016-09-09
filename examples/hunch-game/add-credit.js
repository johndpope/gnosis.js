/**
 * 1. If your contracts and factserver aren't loaded with data yet, use
 *    examples/create.js to load some.
 * 2. Run this script with babel-node-debug. Use -c to stop it from opening a new
 *    browser window.
 *    $ babel-node-debug -c examples/hunch-game/add-credit.js
 */

import Promise from 'bluebird';
import gnosis from '../../src';
import {promiseCallback} from '../../src/lib/callbacks';
import {waitForReceipt} from '../../src/lib/transactions';

global.Promise = Promise;  // Use bluebird for better error logging during development.

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
    // Claim more tokens.
    return gnosis.hunchGame.actions.addCredit(config)
      .then((result) => {
        console.log('Credit added? ', result);
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

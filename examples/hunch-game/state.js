/**
 * 1. If your contracts and factserver aren't loaded with data yet, use
 *    examples/create.js to load some.
 * 2. Run this script with babel-node-debug. Use -c to stop it from opening a new
 *    browser window.
 *    $ babel-node-debug -c examples/state.js
 */

import Promise from 'bluebird';
import gnosis from '../../src';

global.Promise = Promise;  // Use bluebird for better error logging during development.


const users = {
  '0x926980393317bb1813f759a15410682cf57e4d55': {
    address: '0x926980393317bb1813f759a15410682cf57e4d55',
    name: 'Niran',
  },
};

const states = [];
gnosis.config.initializeHunchGame({users}).then((config) => {
  global.subscription = gnosis.hunchGame.state.stream(config).subscribe(
    (state) => {
      states.push(state);
      console.log(state);
    },
    (err) => { throw err; },
    () => console.log('States completed')
  );
});

global.states = states;
global.gnosis = gnosis;

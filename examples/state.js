/**
 * 1. Events are taken from mainnet version. Change ethereumNodeURL and API to
 *    get your local events.
 * 2. Run this script with babel dependencies:
 *    $ node --require babel-register --require babel-polyfill examples/state.js
 */

import gnosis from '../src';
import * as util from 'util';
import Web3 from 'web3';

const states = [];
gnosis.config.initialize({}).then((config) => {
    console.log(new Date().getTime());
    gnosis.state.buildState(config).then((state) => {
        console.log("state");
        console.log(util.inspect(state, {showHidden: false, depth: null}));
        console.log(new Date().getTime());
        process.exit();
    }).catch(console.log);
});

global.states = states;
global.gnosis = gnosis;

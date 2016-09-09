/**
 * 1. If your contracts and factserver aren't loaded with data yet, use
 *    examples/create.js to load some.
 * 2. Run this script with babel-node-debug. Use -c to stop it from opening a new
 *    browser window.
 *    $ babel-node-debug -c examples/state.js
 */

import gnosis from '../src';
import * as util from 'util';
import Web3 from 'web3';

const states = [];
gnosis.config.initialize({
    //web3: new Web3(new Web3.providers.HttpProvider("https://consensysnet.infura.io/")),
    // Consensys TestNet
    addresses: {
      // optional: Allows to do market operations without passing the market address
      defaultMarket: '0x0634e653ee7cc2a01efca45a6b5365d7c2911f31',

      // optional: Allows calculating of share prices without passing the maker address
      defaultMarketMaker: '0x1ec884fd25e73edd024153e5ced3051738c8fd63',

      // obligatory
      etherToken: '0x1912f977d4ed325f145644a7151f410aed75c85b',

      // obligatory
      events: '0x4f4c243aa1a7f9ffb12cec09d9d6cb8b0130a8ae',

      // obligatory
      eventToken: '0xa034436e0142d396cd4568e20fa7bb62ce1621d3',
      // optional
      ultimateResolver: '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',
      // optional
      lmsrMarketMaker: '0x1ec884fd25e73edd024153e5ced3051738c8fd63',

      marketSol: '0x31fd8a27f4abdbb74ad92539948cd69ef9fb88a7'
    },
    addressFiltersPostLoad: {
      marketMakers: ['0x1ec884fd25e73edd024153e5ced3051738c8fd63'],
      resolvers: ['0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a'],
      currencies: ['0x0634e653ee7cc2a01efca45a6b5365d7c2911f31', '0x1912f977d4ed325f145644a7151f410aed75c85b'],
    },

    addressFilters: {
      // optional: Only loads events from blockchain, which are resolved by given resolver
      resolver: '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',
      // optional: Only loads markets from blockchain, which are created by given investor
      investor: null,
    },
    gnosisServiceURL: 'http://127.0.0.1:8050/api/',
    ethereumNodeURL: 'http://127.0.0.1:8545',
}).then((config) => {
    console.log(new Date().getTime());    
    gnosis.state.buildState(config).then((state) => {
        console.log("state");
        console.log(util.inspect(state, {showHidden: false, depth: null}));
        console.log(new Date().getTime());
        for (let marketHash in state.markets[config.addresses.defaultMarket]) {
            console.dir(state.markets[config.addresses.defaultMarket][marketHash].getTrend());
        }

        // for(let eventHash in state.events) {
        // 	console.log(eventHash);
        // 	console.dir(state.events[eventHash].getMarkets());
        // 	console.dir(state.events[eventHash].getEventDescription().getEvents());
        // }
        // process.exit();

        // console.log(util.inspect(state, {showHidden: false, depth: null}));
        process.exit();
    }).catch(console.log);
});

global.states = states;
global.gnosis = gnosis;

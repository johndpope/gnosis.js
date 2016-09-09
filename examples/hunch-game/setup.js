/**
 * 1. Run the factserver with Vagrant.
 * 2. Prepare the database. If it's empty, you'll need to create the Site, Tag,
 *    and category records used in the data below. If you've run this script before,
 *    you'll need to delete the events so they can be created again.
 *    > OffChainDiscreteEvent.objects.delete()
 *    > OffChainRangedEvent.objects.delete()
 * 3. Run ethereumjs/testrpc.
 * 4. Deploy the contracts.
 *    $ cd gnosis/contracts
 *    $ python deploy.py -f deploy.txt
 * 5. Copy the deployed EventToken and Market addresses into the Config arguments below.
 * 6. Copy the deployed UltimateResolver and MarketMakerLMSR addresses into the constants below.
 * 7. Run this script with babel-node-debug. Use -c to stop it from opening a new
 *    browser window.
 *    $ babel-node-debug -c examples/hunch-game/setup.js
 */

import BigNumber from 'bignumber.js';
import {ec as EC} from 'elliptic';
import Promise from 'bluebird';
import gnosis from '../../src';
import * as hex from '../../src/lib/hex';
import faker from 'faker';

global.Promise = Promise;  // Use bluebird for better error logging during development.

const ec = new EC('secp256k1');

const events = [
  {
    'kind': 'discrete',
    'factserver': {
      'category_slugs': ['gossip'],
      'tag_slugs': ['kanye-west', 'kim-kardashian'],
      'title': faker.Lorem.sentence(),
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://gawker.com/',
      'resolution_date': '2016-11-02T08:30:30Z',
      'outcomes': ['Yes', 'No'],
    },
    'event_token': {
      'fee': new BigNumber('5e17'), // 0.5 ether
      'outcome_count': 2,
      'resolver_address': gnosis.config.defaultConfig.addresses.UltimateResolver,
      'currency_address': gnosis.config.defaultConfig.addresses.HunchGameToken,
      'currency_hash': hex.encode(0, 256),
    },
    'market': {
      'fee': new BigNumber('20'),
      'initial_funding': new BigNumber('1e19'), // Minimum allowed funding is 1e19 tokens.
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    },
  },
];

// This key is for account 0xe0931803cd14986c8017aad70618bd5f0b58965a.
const keypair = ec.keyFromPrivate('29e228e7a7312cdd1ab98da15bb21ec0f6cd3f0a5a87ea8ab38a14760082d0e8');
gnosis.config.initializeHunchGame().then((config) => {
  gnosis.actions.storeEventsAsNewOracle(
    events, keypair, 'Andy Cohen', 'andy.cohen@example.com', config)
  .then((hashes) => console.log('Event created', hashes));
});

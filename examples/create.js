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
 *    $ babel-node-debug -c examples/create.js
 */

import BigNumber from 'bignumber.js';
import {
  ec as EC
}
from 'elliptic';
import Promise from 'bluebird';
import gnosis from '../src';
import * as hex from '../src/lib/hex';
import faker from 'faker';

global.Promise = Promise; // Use bluebird for better error logging during development.

const ec = new EC('secp256k1');

const events = [{
    'kind': 'discrete',
    'factserver': {
      'category_slugs': ['crypto-world'],
      'tag_slugs': ['ethereum'],
      //'title': 'What fee will BTC-relay take?',
      'title': faker.Lorem.sentence(),
      //'description': 'What will be the fee for proving the existence of one Bitcoin transaction using the BTC-relay contracts?',
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://frontier.ether.camp/',
      'resolution_date': '2016-04-20T08:30:30Z',
      'outcomes': ['< 10 Finney', '10-100 Finney', '> 100 Finney'],
    },
    'event_token': {
      'fee': new BigNumber('5e17'), // 0.5 ether
      'outcome_count': 3,
      'resolver_address': gnosis.config.defaultConfig.addresses.UltimateResolver,
      'currency_address': gnosis.config.defaultConfig.addresses.HunchGameToken,
      'currency_hash': hex.encode(0, 256),
    },
    'market': {
      'fee': new BigNumber('0.1'),
      'initial_funding': new BigNumber('1e19'),
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    },
  }, {
    'kind': 'ranged',
    'factserver': {
      'category_slugs': ['crypto-world'],
      'tag_slugs': ['ethereum'],
      //'title': 'What fee will BTC-relay take?',
      'title': faker.Lorem.sentence(),
      //'description': 'What will be the fee for proving the existence of one Bitcoin transaction using the BTC-relay contracts?',
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://frontier.ether.camp/',
      'resolution_date': '2016-04-20T08:30:30Z',
      'lower_bound': '0.0',
      'upper_bound': '1000.0',
      'unit': 'finney',
      'base_unit': 0,
    },
    'event_token': {
      'fee': new BigNumber('1e17'), // 0.1 ether
      'outcome_count': 2,
      'resolver_address': gnosis.config.defaultConfig.addresses.UltimateResolver,
      'currency_address': gnosis.config.defaultConfig.addresses.HunchGameToken,
      'currency_hash': hex.encode(0, 256),
    },
    'market': {
      'fee': new BigNumber('0.1'),
      'initial_funding': new BigNumber('10e18'), // Minimum allowed funding is 1e19 wei (10 ether).
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    },
  }, {
    'kind': 'discrete',
    'factserver': {
      'category_slugs': ['gossip'],
      'tag_slugs': ['kanye-west', 'kim-kardashian'],
      //'title': "Kim and Kanye's second baby will be a boy.",
      'title': faker.Lorem.sentence(),
      //'description': "Kim and Kanye's second baby will be a boy.",
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://gawker.com/',
      'resolution_date': '2016-11-05T08:30:30Z',
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
      'fee': new BigNumber('2'),
      'initial_funding': new BigNumber('1e19'), // Minimum allowed funding is 1e19 tokens.
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    },
  }, {
    'kind': 'discrete',
    'factserver': {
      'category_slugs': ['gossip'],
      'tag_slugs': ['kanye-west', 'kim-kardashian'],
      //'title': "Kim and Kany West will break.",
      'title': faker.Lorem.sentence(),
      //'description': "Kim and Kany West will break with his relationship.",
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://gawker.com/',
      'resolution_date': '2016-11-05T08:30:30Z',
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
      'fee': new BigNumber('2'),
      'initial_funding': new BigNumber('1e19'), // Minimum allowed funding is 1e19 tokens.
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    }
  }, {
    'kind': 'discrete',
    'factserver': {
      'category_slugs': ['gossip'],
      'tag_slugs': ['kim-kardashian'],
      //'title': "Kim Kardashian will start her studies.",
      'title': faker.Lorem.sentence(),
      //'description': "The famous Kim Kardashian seems to be worried about her future.",
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://gawker.com/',
      'resolution_date': '2016-11-05T08:31:30Z',
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
      'fee': new BigNumber('2'),
      'initial_funding': new BigNumber('1e19'), // Minimum allowed funding is 1e19 tokens.
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    }
  }, {
    'kind': 'discrete',
    'factserver': {
      'category_slugs': ['crypto-world'],
      'tag_slugs': ['ethereum'],
      //'title': 'Will ethereum price reach 20$ before 2017?',
      'title': faker.Lorem.sentence(),
      //'description': 'Ethereum price has increased a lot, last two months, will the price reach 20$/eth before 2017?',
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://frontier.ether.camp/',
      'resolution_date': '2017-1-01T08:30:30Z',
      'outcomes': ['Yes', 'No'],
    },
    'event_token': {
      'fee': new BigNumber('5e17'), // 0.5 ether
      'outcome_count': 3,
      'resolver_address': gnosis.config.defaultConfig.addresses.UltimateResolver,
      'currency_address': gnosis.config.defaultConfig.addresses.HunchGameToken,
      'currency_hash': hex.encode(0, 256),
    },
    'market': {
      'fee': new BigNumber('0.1'),
      'initial_funding': new BigNumber('1e19'),
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    }
  }, {
    'kind': 'ranged',
    'factserver': {
      'category_slugs': ['crypto-world'],
      'tag_slugs': ['ethereum'],
      //'title': 'Will will be the ethereum price at the end of 2016?',
      'title': faker.Lorem.sentence(),
      //'description': 'Will will be the ethereum price at the end of 2016? pleace your beats!',
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://frontier.ether.camp/',
      'resolution_date': '2017-1-01T08:30:30Z',
      'lower_bound': '0.0',
      'upper_bound': '1000.0',
      'unit': 'dollars',
      'base_unit': 0,
    },
    'event_token': {
      'fee': new BigNumber('5e17'), // 0.5 ether
      'outcome_count': 3,
      'resolver_address': gnosis.config.defaultConfig.addresses.UltimateResolver,
      'currency_address': gnosis.config.defaultConfig.addresses.HunchGameToken,
      'currency_hash': hex.encode(0, 256),
    },
    'market': {
      'fee': new BigNumber('0.1'),
      'initial_funding': new BigNumber('1e19'),
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    }
  }, {
    'kind': 'discrete',
    'factserver': {
      'category_slugs': ['crypto-world'],
      'tag_slugs': ['ethereum'],
      //'title': 'Will ethereum price beat bitcoin before 2017?',
      'title': faker.Lorem.sentence(),
      //'description': 'Can sound imposible, but will ethereum price beat bitcoin this year?',
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://frontier.ether.camp/',
      'resolution_date': '2017-1-01T08:30:30Z',
      'outcomes': ['Yes', 'No'],
    },
    'event_token': {
      'fee': new BigNumber('5e17'), // 0.5 ether
      'outcome_count': 3,
      'resolver_address': gnosis.config.defaultConfig.addresses.UltimateResolver,
      'currency_address': gnosis.config.defaultConfig.addresses.HunchGameToken,
      'currency_hash': hex.encode(0, 256),
    },
    'market': {
      'fee': new BigNumber('0.1'),
      'initial_funding': new BigNumber('1e19'),
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    }
  }, {
    'kind': 'ranged',
    'factserver': {
      'category_slugs': ['crypto-world'],
      'tag_slugs': ['ethereum'],
      //'title': 'What will be the ethereum price at the end of April?',
      'title': faker.Lorem.sentence(),
      //'description': 'Ethereum price has increased a lot last two months, what will happen at the end of the next month?',
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://frontier.ether.camp/',
      'resolution_date': (new Date(new Date().getTime() + 1000 * 60 * 30)).toISOString(),
      'lower_bound': '0.0',
      'upper_bound': '1000.0',
      'unit': 'dollars',
      'base_unit': 0,
    },
    'event_token': {
      'fee': new BigNumber('5e17'), // 0.5 ether
      'outcome_count': 3,
      'resolver_address': gnosis.config.defaultConfig.addresses.UltimateResolver,
      'currency_address': gnosis.config.defaultConfig.addresses.HunchGameToken,
      'currency_hash': hex.encode(0, 256),
    },
    'market': {
      'fee': new BigNumber('0.1'),
      'initial_funding': new BigNumber('1e19'),
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    }
  }, {
    'kind': 'discrete',
    'factserver': {
      'category_slugs': ['crypto-world'],
      'tag_slugs': ['ethereum'],
      //'title': "It's gnosis team cool?",
      'title': faker.Lorem.sentence(),
      //'description': 'Be honest',
      'description': faker.Lorem.paragraph(),
      'source_url': 'http://frontier.ether.camp/',
      'resolution_date': (new Date(new Date().getTime() + 1000 * 60 * 30)).toISOString(),
      'outcomes': ['Yes', 'No'],
    },
    'event_token': {
      'fee': new BigNumber('5e17'), // 0.5 ether
      'outcome_count': 3,
      'resolver_address': gnosis.config.defaultConfig.addresses.UltimateResolver,
      'currency_address': gnosis.config.defaultConfig.addresses.HunchGameToken,
      'currency_hash': hex.encode(0, 256),
    },
    'market': {
      'fee': new BigNumber('0.1'),
      'initial_funding': new BigNumber('1e19'),
      'maker_address': gnosis.config.defaultConfig.addresses.LMSRMarketMaker,
    }
  }

];

// This key is for account 0xe0931803cd14986c8017aad70618bd5f0b58965a.
const keypair = ec.keyFromPrivate('29e228e7a7312cdd1ab98da15bb21ec0f6cd3f0a5a87ea8ab38a14760082d0e8');
// The Description hash for last event on array (the one that is resolved)
const descriptionHash = '0x730ad734141e5b4a7b52ae082b52af4d89fffa0fc448c00a279c4967ab5300be';
gnosis.config.initialize().then((config) => {
  gnosis.actions.storeEventsAsNewOracle(
    events, keypair, 'Fake Satoshi Nakamoto', 'satoshin@vistomail.com', config).then((resul) => {
    gnosis.actions.setWinningOutcome(descriptionHash, new BigNumber('1'), keypair, config).then((result) => {
      var ids = gnosis.actions.getEventIdentifiers(events[9]);
      gnosis.actions.postResult(new BigNumber('1'), ids.description_hash, keypair)
        .then((result) => {
          console.log(result);
        });
    });
  });
});
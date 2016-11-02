import gnosis from '../../src/';
import BigNumber from 'bignumber.js';
import * as hex from '../../src/lib/hex';
import {exec} from 'child_process';
import * as heapdump from 'heapdump';

let snap_id;
let config;

const testrpcConfig = {

  // Testrpc Configuration
  addresses: {
    // optional: Allows to do market operations without passing the market address
    defaultMarketFactory: '0x0634e653ee7cc2a01efca45a6b5365d7c2911f31',

    // optional: Allows calculating of share prices without passing the maker address
    defaultMarketMaker: '0x1912f977d4ed325f145644a7151f410aed75c85b',

    // obligatory
    etherToken: '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',

    // obligatory
    eventFactory: '0x4f4c243aa1a7f9ffb12cec09d9d6cb8b0130a8ae',

    // optional
    ultimateOracle: '0xb7ead0f8e08594b0337d4332554962b69a201cfc',
    // optional
    lmsrMarketMaker: '0x1912f977d4ed325f145644a7151f410aed75c85b',

    marketSol: '0x0634e653ee7cc2a01efca45a6b5365d7c2911f31',

    hunchGameToken: '0x31fd8a27f4abdbb74ad92539948cd69ef9fb88a7',
    hunchGameMarketFactory: '0x1ec884fd25e73edd024153e5ced3051738c8fd63',
  },
  addressFiltersPostLoad: {
    marketMakers: ['0x1912f977d4ed325f145644a7151f410aed75c85b'],
    oracles: ['0xb7ead0f8e08594b0337d4332554962b69a201cfc'],
    tokens: ['0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a', '0x31fd8a27f4abdbb74ad92539948cd69ef9fb88a7'],
  },

  addressFilters: {
    // optional: Only loads events from blockchain, which are resolved by
    // given oracle
    oracle: '0xb7ead0f8e08594b0337d4332554962b69a201cfc',
    // optional: Only loads markets from blockchain, which are created by
    // given investor
    investor: null,
  },
  gnosisServiceURL: 'http://127.0.0.1:8050/api/',
  ethereumNodeURL: 'http://127.0.0.1:8545',
  gethNode: false,

  //// Consensys TestNet
  //addresses: {
  //  defaultMarket: '0xf17371f35e0945de4c4d5a2512450cf5c42ea7d1',
  //  defaultMarketMaker: '0x5f1a458636c8a9d21b3684a26af4a073c40c1f9c',
  //  eventToken: '0x2f69c603c5bc1be86a402df276b42f968ce299df',
  //  ultimateOracle: '0xaa7c4cb6507d72603317d814fabda3576220d830',
  //  lmsrMarketMaker: '0x5f1a458636c8a9d21b3684a26af4a073c40c1f9c'
  //},
  //addressFilters: {
  //  oracle: '0xaa7c4cb6507d72603317d814fabda3576220d830',
  //  investor: null,
  //},
  //addressFiltersPostLoad: {
  //  marketMakers: ['0x5f1a458636c8a9d21b3684a26af4a073c40c1f9c'],
  //  oracles: ['0xaa7c4cb6507d72603317d814fabda3576220d830'],
  //  currencies: ['0xf17371f35e0945de4c4d5a2512450cf5c42ea7d1', '0x2f69c603c5bc1be86a402df276b42f968ce299df', '0x0'],
  //},
  //gnosisServiceURL: 'http://127.0.0.1:8050/api/',
  //ethereumNodeURL: ' http://staging.gnosis.pm:8545',
  //gethNode: true,

  // Common configuration

  removeEvents: true,
  eventDescriptionFilters : {
    resolutionDate: new Date().setDate(new Date().getDate()+60),
    oracleAddresses: [],
    includeWhitelistedOracles: false
  },
  defaultGas: 3000000,
  defaultGasPrice: new BigNumber('5e10'), // 50 gwei
  oauthToken: 'y3xT0QGKrOgra51IB4BXI9PJwDbUWX',
  events : [
    {
      'kind': 'discrete',
      'tags': ['kanye-west', 'kim-kardashian'], // optional
      'title': "Kim and Kanye's second baby will be a boy.",
      'description': "Kim and Kanye's second baby will be a boy.",
      'sourceUrl': 'http://gawker.com/', // optional
      'resolutionDate': '2018-11-02T08:30:30Z',
      'outcomes': ['Yes', 'No'],
      'fee': new BigNumber('0'),
      'feeToken': '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',
      'resolverAddress': '0xb7ead0f8e08594b0337d4332554962b69a201cfc',
      'tokenAddress': '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',
      'outcomeCount': 2,
      'market': {
        'fee': new BigNumber('0'),
        'initialFunding': new BigNumber('1e19'), // Minimum allowed funding is 1e19 tokens.
        'makerAddress': '0x1912f977d4ed325f145644a7151f410aed75c85b',
      },
    },
  ],
};

beforeEach(function prepareTests(done){
  this.timeout(150000);
  // Take a heap snapshot, for memory usage profiling
  // heapdump.writeSnapshot(__dirname + '/heapsnapshots/' + Date.now() + '.heapsnapshot');

  if(!testrpcConfig.gethNode){
    gnosis.config.initialize(testrpcConfig).then((app_config) => {
      config = app_config;

      // Gets snapshot of current blockchain
      app_config.web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_snapshot",
        id: 12345
      }, (e, response) => {
        snap_id = response.result;

        if(testrpcConfig.removeEvents){
          // Removes events and oracles from API
          //const command = "vagrant ssh -- -t 'cd /vagrant/factserver/; /home/vagrant/.pyenv/shims/python manage.py delete_events_and_oracles'";
          const command = "/home/vagrant/.pyenv/shims/python manage.py delete_events_and_oracles";
          //exec(command, {cwd: __dirname+"/../../../"}, (e, out, eInfo) => {
          exec(command, {cwd: "/vagrant/factserver/"}, (e, out, eInfo) => {
            if(e){
              console.error(e, eInfo);
            }
            done();
          });
        }
        else{
          done();
        }
      })
    });
  }
  else{
    done();
  }

});

afterEach((done) => {
  if(!testrpcConfig.gethNode)
    {
      config.web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_revert",
        id: 12346,
        params: [snap_id]
      }, (e, response) =>
      {
        done();
      });
    }
  else{
    done();
  }

});

export default testrpcConfig;

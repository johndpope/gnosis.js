'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Config = exports.defaultConfig = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

exports.initialize = initialize;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

var _callbacks = require('./lib/callbacks');

var _rxWeb = require('./lib/rx-web3');

var _rxWeb2 = _interopRequireDefault(_rxWeb);

var _abi = require('./abi');

var abi = _interopRequireWildcard(_abi);

var _web3ProviderEngine = require('web3-provider-engine');

var _web3ProviderEngine2 = _interopRequireDefault(_web3ProviderEngine);

var _rpc = require('web3-provider-engine/subproviders/rpc.js');

var _rpc2 = _interopRequireDefault(_rpc);

var _state = require('./state');

var state = _interopRequireWildcard(_state);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultConfig = exports.defaultConfig = {
  // Mainnet
  addresses: {
    defaultMarketFactory: '0x6ca7f214ab2ddbb9a8e1a1e2c8550e3164e9dba5',
    defaultMarketMaker: '0x8695e5e79dab06fbbb05f445316fa4edb0da30f0',
    etherToken: '0x92f1dbea03ce08225e31e95cc926ddbe0198e6f2',
    eventFactory: '0x5aae5c59d642e5fd45b427df6ed478b49d55fefd',
    ultimateOracle: '0x529c4cb814029b8bb32acb516ea3a4b07fdae350',
    lmsrMarketMaker: '0x8695e5e79dab06fbbb05f445316fa4edb0da30f0',
    makerToken: '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7'
  },
  addressFilters: {
    oracle: '0x529c4cb814029b8bb32acb516ea3a4b07fdae350'
  },
  eventDescriptionFilters: {
    oracleAddresses: null,
    includeWhitelistedOracles: false,
    pageSize: 10
  },
  addressFiltersPostLoad: {
    marketMakers: ['0x8695e5e79dab06fbbb05f445316fa4edb0da30f0'],
    oracles: ['0x529c4cb814029b8bb32acb516ea3a4b07fdae350'],
    tokens: ['0x92f1dbea03ce08225e31e95cc926ddbe0198e6f2']
  },

  defaultGas: 3000000,
  defaultGasPrice: new _bignumber2.default('5e10'), // 50 gwei

  gnosisServiceURL: 'https://www.gnosis.pm/api/',
  ethereumNodeURL: 'https://mainnet.infura.io/',

  persistTransactions: false,
  transactionConfirmCallback: null,
  newTransactionCallback: null,

  // an array of functions that each return a Promise. These functions will be
  // called in buildState and updateState calls.
  additionalUpdates: null,

  transactionsLoop: true, // transactions receipt loop
  requestBlockNumberTimeout: 5,

  // Before every transaction it's done a fake one, that allows to save the gas in case of fail
  callBeforeTransaction: true
};

function buildWeb3(nodeURL) {
  // let engine = new ProviderEngine();
  return new _web2.default(new _web2.default.providers.HttpProvider(nodeURL));

  /* engine.addProvider(new RpcSubprovider({
    rpcUrl: nodeURL,
  }));
  engine.start();*/
}

var Config = exports.Config = function Config(overrides) {
  var _this = this;

  (0, _classCallCheck3.default)(this, Config);

  // Override defaults with the provided config and assign them to this object.
  _lodash2.default.merge(this, defaultConfig, overrides);
  if (this.web3 == null) {
    this.web3 = buildWeb3(this.ethereumNodeURL);
  }

  // for(let contractName in this.addresses){
  //  this.addresses[contractName] = web3.toChecksumAddress(this.addresses[contractName]);
  // }
  // this.rxWeb3 = new RxWeb3(this.web3);

  if (this.account == null) {
    // Load an account from the web3 provider as a fallback. this.initialize
    // is a Promise that clients can wait on to make sure initialization has
    // completed before they use this data.
    this.initialize = new _promise2.default(function (resolve, reject) {
      _this.web3.eth.getAccounts((0, _callbacks.promiseCallback)(resolve, reject));
    }).then(function (result) {
      if (result.length > 0) {
        _this.account = result[0];
      } else {
        _this.account = '0x0000000000000000000000000000000000000000';
      }
      _this.accounts = result;
    }, function () {
      _this.account = '0x0000000000000000000000000000000000000000';
      _this.accounts = [];
    });
  } else {
    this.initialize = _promise2.default.resolve();
  }

  if (this.batch == null) {
    this.batch = this.web3.createBatch();
  }

  if (this.receiptPromises == null) {
    this.receiptPromises = {};
  }
};

function checkTransactions(config) {
  var stateSnapshot = state.get(config);

  // Check if there is a new block
  config.web3.eth.getBlockNumber(function (error, blockNumber) {
    if (blockNumber !== stateSnapshot.blockNumber) {
      // Update state blocknumber
      state.updateBlocknumber(config);

      // Get transactions from state
      var transactions = stateSnapshot.transactions;

      // batch requests
      var batch = config.web3.createBatch();

      // Check receipts for each pending transactions

      var _loop = function _loop(key) {
        var transaction = transactions[key];

        if (transaction.receipt == null) {
          batch.add(config.web3.eth.getTransactionReceipt.request(key, function (e, receipt) {
            if (e == null && receipt && state.get(config).transactions && state.get(config).transactions[key] && state.get(config).transactions[key].receipt == null) {
              var transactionCallback = transaction.callback;
              var newTransaction = {};
              newTransaction[key] = {
                callback: null,
                receipt: receipt,
                subject: transaction.subject,
                date: transaction.date,
                transactionHash: key
              };
              state.updateTransactions(newTransaction, config);
              // call transaction callback
              if (transactionCallback) {
                transactionCallback(e, receipt);
              }

              // call config transaction callback
              if (config.transactionConfirmCallback) {
                config.transactionConfirmCallback(e, receipt);
              }
            }
          }));
        }
      };

      for (var key in transactions) {
        _loop(key);
      }
      if ((0, _keys2.default)(transactions).length > 0) {
        batch.execute();
      }
    }

    setTimeout(function () {
      checkTransactions(config);
    }, config.requestBlockNumberTimeout * 1000);
  });
}

/**
 * Generate an initialized config.
 * This is less error-prone than directly constructing a Config. It's easy to
 * forget to wait for config.initialize to resolve. This interface avoids that.
 * @return {Promise<Config>}
 */
function initialize(overrides) {
  var config = new Config(overrides);

  if (config.transactionsLoop) {
    // Init check transactions receipts
    // Not using filter due to lot of requests
    // let blockFilter = config.web3.eth.filter("latest");

    setTimeout(function () {
      checkTransactions(config);
    }, config.requestBlockNumberTimeout * 1000);
  }
  return config.initialize.then(function () {
    return config;
  });
}
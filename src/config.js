import _ from 'lodash';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import {promiseCallback} from './lib/callbacks';
import RxWeb3 from './lib/rx-web3';
import * as abi from './abi';
import ProviderEngine from 'web3-provider-engine';
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc.js';
import * as state from './state';

export const defaultConfig = {
  // Mainnet
  addresses: {
    defaultMarketFactory: '0x6ca7f214ab2ddbb9a8e1a1e2c8550e3164e9dba5',
    defaultMarketMaker: '0x8695e5e79dab06fbbb05f445316fa4edb0da30f0',
    etherToken: '0x92f1dbea03ce08225e31e95cc926ddbe0198e6f2',
    eventFactory: '0x5aae5c59d642e5fd45b427df6ed478b49d55fefd',
    ultimateOracle: '0x529c4cb814029b8bb32acb516ea3a4b07fdae350',
    lmsrMarketMaker: '0x8695e5e79dab06fbbb05f445316fa4edb0da30f0',
    makerToken: '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7',
  },
  addressFilters: {
    oracle: '0x529c4cb814029b8bb32acb516ea3a4b07fdae350',
  },
  eventDescriptionFilters: {
    oracleAddresses: null,
    includeWhitelistedOracles: false,
    pageSize: 10,
  },
  addressFiltersPostLoad: {
    marketMakers: ['0x8695e5e79dab06fbbb05f445316fa4edb0da30f0'],
    oracles: ['0x529c4cb814029b8bb32acb516ea3a4b07fdae350'],
    tokens: ['0x92f1dbea03ce08225e31e95cc926ddbe0198e6f2', '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7'],
  },

  defaultGas: 3000000,
  defaultGasPrice: new BigNumber('5e10'), // 50 gwei

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
  callBeforeTransaction: true,
};

function buildWeb3(nodeURL) {
  // let engine = new ProviderEngine();
  return new Web3(new Web3.providers.HttpProvider(nodeURL));

  /* engine.addProvider(new RpcSubprovider({
    rpcUrl: nodeURL,
  }));
  engine.start();*/
}

export class Config {
  constructor(overrides) {
    // Override defaults with the provided config and assign them to this object.
    _.merge(this, defaultConfig, overrides);
    if (this.web3 == null) {
      this.web3 = buildWeb3(
          this.ethereumNodeURL
      );
    }

    // for(let contractName in this.addresses){
    //  this.addresses[contractName] = web3.toChecksumAddress(this.addresses[contractName]);
    // }
    // this.rxWeb3 = new RxWeb3(this.web3);

    if (this.account == null) {
      // Load an account from the web3 provider as a fallback. this.initialize
      // is a Promise that clients can wait on to make sure initialization has
      // completed before they use this data.
      this.initialize = new Promise((resolve, reject) => {
        this.web3.eth.getAccounts(promiseCallback(resolve, reject));
      }).then((result) => {
        if (result && result.length > 0) {
          this.account = result[0];
          this.accounts = result;
        }
        else {
          this.account = '0x0000000000000000000000000000000000000000';
          this.accounts = [];
        }
      },
      () => {
        this.account = '0x0000000000000000000000000000000000000000';
        this.accounts = [];
      });
    } else {
      this.initialize = Promise.resolve();
    }

    if (this.batch == null) {
      this.batch = this.web3.createBatch();
    }

    if (this.receiptPromises == null) {
      this.receiptPromises = {};
    }
  }
}

function checkTransactions(config) {
  const stateSnapshot = state.get(config);

  // Check if there is a new block
  config.web3.eth.getBlockNumber(
      (error, blockNumber) => {
        if (blockNumber !== stateSnapshot.blockNumber){
          // Update state blocknumber
          state.updateBlocknumber(config);

          // Get transactions from state
          const transactions = stateSnapshot.transactions;

          // batch requests
          const batch = config.web3.createBatch();

          // Check receipts for each pending transactions
          for (let key in transactions) {
            const transaction = transactions[key];

            if (transaction.receipt == null) {
              batch.add(config.web3.eth.getTransactionReceipt.request(
                key, (e, receipt) => {
                  if(
                      e == null &&
                      receipt &&
                      state.get(config).transactions &&
                      state.get(config).transactions[key] &&
                      state.get(config).transactions[key].receipt == null
                    )
                    {
                      let transactionCallback = transaction.callback;
                      let newTransaction = {};
                      newTransaction[key] = {
                        callback: null,
                        receipt: receipt,
                        subject: transaction.subject,
                        date: transaction.date,
                        transactionHash: key
                      };
                      state.updateTransactions(newTransaction, config);
                      // call transaction callback
                      if(transactionCallback){
                        transactionCallback(e, receipt);
                      }

                      // call config transaction callback
                      if(config.transactionConfirmCallback) {
                        config.transactionConfirmCallback(e, receipt);
                      }
                  }
              }));
            }
          }
          if(Object.keys(transactions).length > 0){
            batch.execute();
          }
        }

        setTimeout(
          function(){
            checkTransactions(config)
          },
          config.requestBlockNumberTimeout * 1000
        );

  });
}

/**
 * Generate an initialized config.
 * This is less error-prone than directly constructing a Config. It's easy to
 * forget to wait for config.initialize to resolve. This interface avoids that.
 * @return {Promise<Config>}
 */
export function initialize(overrides) {
  const config = new Config(overrides);

  if(config.transactionsLoop){
    // Init check transactions receipts
    // Not using filter due to lot of requests
    // let blockFilter = config.web3.eth.filter("latest");

    setTimeout(
      function(){
        checkTransactions(config);
      },
      config.requestBlockNumberTimeout * 1000
    );

  }
  return config.initialize.then(() => config);
}

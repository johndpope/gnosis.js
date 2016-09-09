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
  addresses: {
    // optional: Allows to do market operations without passing the
    // market address
    defaultMarket: '0x3ddb5f64c40ea7fc7544246e9f372f74f9916b2b',

    // optional: Allows calculating of share prices without passing the
    // maker address
    defaultMarketMaker: '0xfaf8913492cef6e4a99904962703529b8f3ad781',

    // obligatory
    etherToken: '0x4955fd25df125d1abf23d45df1d094111f4b864e',

    // obligatory
    events: '0x631298cdbd72d1f2cb4b8e5120d3f8c41b8abe97',

    // optional
    ultimateOracle: '0x97ed93a5cebf62a7a48ebbbef7f16b87a80fee90',
    // optional
    lmsrMarketMaker: '0x3ddb5f64c40ea7fc7544246e9f372f74f9916b2b'
  },
  addressFiltersPostLoad: {
    marketMakers: ['0xfaf8913492cef6e4a99904962703529b8f3ad781'],
    oracles: ['0x97ed93a5cebf62a7a48ebbbef7f16b87a80fee90'],
    tokens: [
      '0x4955fd25df125d1abf23d45df1d094111f4b864e',
      '0xce2562752c3d635b94be9b18f2250ddc638aadca'],
  },

  addressFilters: {
    // optional: Only loads events from blockchain, which are resolved by
    // given oracle
    oracle: '0x97ed93a5cebf62a7a48ebbbef7f16b87a80fee90',
    // optional: Only loads markets from blockchain, which are created by
    // given investor
    investor: null,
  },

  eventDescriptionFilters: {
    // resolutionDate: new Date(new Date().getTime() + 3600000*24*60),
    oracleAddresses: null,
    includeWhitelistedOracles: false,
    pageSize: 50// number of events returned by API for each page
  },

  defaultGas: 3000000,
  defaultGasPrice: new BigNumber('5e10'), // 50 gwei

  gnosisServiceURL: 'http://localhost:8050/api/',
  ethereumNodeURL: 'http://127.0.0.1:8545',

  persistTransactions: false,
  transactionConfirmCallback: null,
  newTransactionCallback: null,

  // an array of functions that each return a Promise. These functions will be
  // called in buildState and updateState calls.
  additionalUpdates: null,

  transactionsLoop: true, // transactions receipt loop
  requestBlockNumberTimeout: 5
};

function buildWeb3(nodeURL){
  //let engine = new ProviderEngine();
  return new Web3(new Web3.providers.HttpProvider(nodeURL));

  /*engine.addProvider(new RpcSubprovider({
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

    //for(let contractName in this.addresses){
    //  this.addresses[contractName] = web3.toChecksumAddress(this.addresses[contractName]);
    //}
    //this.rxWeb3 = new RxWeb3(this.web3);

    if (this.account == null) {
      // Load an account from the web3 provider as a fallback. this.initialize
      // is a Promise that clients can wait on to make sure initialization has
      // completed before they use this data.
      this.initialize = new Promise((resolve, reject) => {
          this.web3.eth.getAccounts(promiseCallback(resolve, reject));
      }).then((result) => {
        if(result.length > 0){
          this.account = result[0];
        }
        else{
          this.account = '0x0000000000000000000000000000000000000000';
        }
        this.accounts = result;
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

function checkTransactions(config){
  let stateSnapshot = state.get(config);

  // Check if there is a new block
  config.web3.eth.getBlockNumber(
      (error, blockNumber) => {
        if(blockNumber != stateSnapshot.blockNumber){
          // Update state blocknumber
          state.updateBlocknumber(config);

          // Get transactions from state
          let transactions = stateSnapshot.transactions;

          // batch requests
          let batch = config.web3.createBatch();

          // Check receipts for each pending transactions
          for(let key in transactions){
            let transaction = transactions[key];

            if(transaction.receipt == null){
              batch.add(config.web3.eth.getTransactionReceipt.request(
                key,
                (e, receipt) =>
                {
                  if(
                      e == null &&
                      receipt &&
                      state.get(config).transactions &&
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

                      //call config transaction callback
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

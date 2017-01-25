import BigNumber from 'bignumber.js';
import {promiseCallback} from './callbacks';
import * as state from '../state';



export function isResultZero(result) {
  return result === '0x' || new BigNumber(result, 16).eq(0);
}

export function logOnFailure(logTag, successTest = res => !isResultZero(res)) {
  return (simulatedResult) => {
    if (!successTest(simulatedResult)) {
      console.error(`${logTag}: The simulated result (${simulatedResult}) might indicate an error.`);
    }
    return simulatedResult;
  };
}

export function errorOnFailure(logTag, successTest = res => !isResultZero(res)) {
  return (simulatedResult) => {
    if (!successTest(simulatedResult)) {
      throw new Error(`${logTag}: Simulated transaction result was unsuccessful.`);
    }
    return simulatedResult;
  };
}

// TODO (future) subjectName could be removed and get it from function name
export function callAndSendTransaction(contractFunction, subjectName, args, config, predictSuccess = errorOnFailure(''), callback) {

    return new Promise((resolve, reject) =>
    {
      config.web3.eth.getGasPrice(promiseCallback(resolve, reject));
    }).then((gasPrice) => {
      // console.log("gas price: %s", gasPrice);
      args[args.length-1].gasPrice = gasPrice ;
      return new Promise((resolve, reject) => {
        if (config.callBeforeTransaction) {
          const callArgs = args.concat(promiseCallback(resolve, reject));
          contractFunction.call.apply(contractFunction, callArgs);
        }
        else {
          resolve(new BigNumber(1));
        }
      });
  })
  .then(predictSuccess)
  .then((simulatedResult) => {
    return new Promise((resolve, reject) => {
      const sendArgs = args.concat(promiseCallback(resolve, reject));
      contractFunction.sendTransaction.apply(contractFunction, sendArgs);
    }).then((txhash) => {
      // Add transaction to state object
      let transactionObject = {};
      if(callback){
        transactionObject[txhash] = {
          callback: callback,
          receipt: null,
          subject: subjectName,
          'date': new Date(),
          transactionHash: txhash
        };
      }
      else{
        transactionObject[txhash] = {
          callback: null,
          receipt: null,
          subject: subjectName,
          'date': new Date(),
          transactionHash: txhash
        };
      }
      state.updateTransactions(transactionObject, config);
      return {txhash: txhash, simulatedResult: simulatedResult};
    });
  });
}

export function txDefaults(config) {
  return {
    from: config.account,
    gas: config.defaultGas,
    gasPrice: config.defaultGasPrice,
  };
}

export function sendTransaction(contractFunction, args) {
    return new Promise((resolve, reject) => {
      const sendArgs = args.concat(promiseCallback(resolve, reject));
      contractFunction.sendTransaction.apply(contractFunction, sendArgs);
    }).then((txhash) => {
      return {txhash: txhash};
    });
}


/**
 * Create a promise that resolves to the receipt for the given transaction
 * hash once it has been included in a block.
 */
export function waitForReceipt(txhash, config, subjectName) {
  console.log(`Waiting for transaction ${txhash} to be mined...`);
  const deconstructedPromise = {};
  deconstructedPromise.promise = new Promise((resolve, reject) => {
    deconstructedPromise.resolve = resolve;
    deconstructedPromise.reject = reject;
  });

  // Add transaction to state object
  let transactionObject = {};
  transactionObject[txhash] = {callback: deconstructedPromise.resolve, receipt: null, subject: subjectName, 'date': new Date()};
  state.updateTransactions(transactionObject);

  return deconstructedPromise.promise;
}

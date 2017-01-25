'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.isResultZero = isResultZero;
exports.logOnFailure = logOnFailure;
exports.errorOnFailure = errorOnFailure;
exports.callAndSendTransaction = callAndSendTransaction;
exports.txDefaults = txDefaults;
exports.sendTransaction = sendTransaction;
exports.waitForReceipt = waitForReceipt;

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _callbacks = require('./callbacks');

var _state = require('../state');

var state = _interopRequireWildcard(_state);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isResultZero(result) {
  return result === '0x' || new _bignumber2.default(result, 16).eq(0);
}

function logOnFailure(logTag) {
  var successTest = arguments.length <= 1 || arguments[1] === undefined ? function (res) {
    return !isResultZero(res);
  } : arguments[1];

  return function (simulatedResult) {
    if (!successTest(simulatedResult)) {
      console.error(logTag + ': The simulated result (' + simulatedResult + ') might indicate an error.');
    }
    return simulatedResult;
  };
}

function errorOnFailure(logTag) {
  var successTest = arguments.length <= 1 || arguments[1] === undefined ? function (res) {
    return !isResultZero(res);
  } : arguments[1];

  return function (simulatedResult) {
    if (!successTest(simulatedResult)) {
      throw new Error(logTag + ': Simulated transaction result was unsuccessful.');
    }
    return simulatedResult;
  };
}

// TODO (future) subjectName could be removed and get it from function name
function callAndSendTransaction(contractFunction, subjectName, args, config) {
  var predictSuccess = arguments.length <= 4 || arguments[4] === undefined ? errorOnFailure('') : arguments[4];
  var callback = arguments[5];


  return new _promise2.default(function (resolve, reject) {
    config.web3.eth.getGasPrice((0, _callbacks.promiseCallback)(resolve, reject));
  }).then(function (gasPrice) {
    // console.log("gas price: %s", gasPrice);
    args[args.length - 1].gasPrice = gasPrice;
    return new _promise2.default(function (resolve, reject) {
      if (config.callBeforeTransaction) {
        var callArgs = args.concat((0, _callbacks.promiseCallback)(resolve, reject));
        contractFunction.call.apply(contractFunction, callArgs);
      } else {
        resolve();
      }
    });
  }).then(predictSuccess).then(function (simulatedResult) {
    return new _promise2.default(function (resolve, reject) {
      var sendArgs = args.concat((0, _callbacks.promiseCallback)(resolve, reject));
      contractFunction.sendTransaction.apply(contractFunction, sendArgs);
    }).then(function (txhash) {
      // Add transaction to state object
      var transactionObject = {};
      if (callback) {
        transactionObject[txhash] = {
          callback: callback,
          receipt: null,
          subject: subjectName,
          'date': new Date(),
          transactionHash: txhash
        };
      } else {
        transactionObject[txhash] = {
          callback: null,
          receipt: null,
          subject: subjectName,
          'date': new Date(),
          transactionHash: txhash
        };
      }
      state.updateTransactions(transactionObject, config);
      return { txhash: txhash, simulatedResult: simulatedResult };
    });
  });
}

function txDefaults(config) {
  return {
    from: config.account,
    gas: config.defaultGas,
    gasPrice: config.defaultGasPrice
  };
}

function sendTransaction(contractFunction, args) {
  return new _promise2.default(function (resolve, reject) {
    var sendArgs = args.concat((0, _callbacks.promiseCallback)(resolve, reject));
    contractFunction.sendTransaction.apply(contractFunction, sendArgs);
  }).then(function (txhash) {
    return { txhash: txhash };
  });
}

/**
 * Create a promise that resolves to the receipt for the given transaction
 * hash once it has been included in a block.
 */
function waitForReceipt(txhash, config, subjectName) {
  console.log('Waiting for transaction ' + txhash + ' to be mined...');
  var deconstructedPromise = {};
  deconstructedPromise.promise = new _promise2.default(function (resolve, reject) {
    deconstructedPromise.resolve = resolve;
    deconstructedPromise.reject = reject;
  });

  // Add transaction to state object
  var transactionObject = {};
  transactionObject[txhash] = { callback: deconstructedPromise.resolve, receipt: null, subject: subjectName, 'date': new Date() };
  state.updateTransactions(transactionObject);

  return deconstructedPromise.promise;
}
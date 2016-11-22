'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.balanceOf = balanceOf;
exports.name = name;
exports.symbol = symbol;
exports.decimals = decimals;
exports.allowance = allowance;
exports.approve = approve;
exports.totalSupply = totalSupply;
exports.transfer = transfer;
exports.transferFrom = transferFrom;

var _web3Batch = require('../lib/web3-batch');

var _abi = require('../abi');

var abi = _interopRequireWildcard(_abi);

var _transactions = require('../lib/transactions');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function balanceOf(tokenAddress, owner, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.balanceOf, owner, 'latest', callback);
} /**
   * Created by denisgranha on 11/4/16.
   */

function name(tokenAddress, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.name, 'latest', callback);
}

function symbol(tokenAddress, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.symbol, 'latest', callback);
}

function decimals(tokenAddress, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.decimals, 'latest', callback);
}

function allowance(tokenAddress, owner, spender, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.allowance, owner, spender, 'latest', callback);
}

function approve(tokenAddress, spender, value, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);
    var args = [spender, value, (0, _transactions.txDefaults)(config)];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.approve, "approve", args, config, (0, _transactions.errorOnFailure)('approve', booleanSuccessTest), callback);
}

function totalSupply(tokenAddress, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);

    return (0, _web3Batch.requestWithBlockNumber)(contractInstance.totalSupply, 'latest', callback);
}

function transfer(tokenAddress, addressTo, value, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);
    var args = [addressTo, value, (0, _transactions.txDefaults)(config)];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.transfer, "transfer", args, config, (0, _transactions.errorOnFailure)('transfer', booleanSuccessTest), callback);
}

function transferFrom(tokenAddress, addressFrom, addressTo, value, config, callback) {
    var contractInstance = config.web3.eth.contract(abi.token).at(tokenAddress);
    var args = [addressFrom, addressTo, value, (0, _transactions.txDefaults)(config)];

    var booleanSuccessTest = function booleanSuccessTest(res) {
        return res;
    };
    return (0, _transactions.callAndSendTransaction)(contractInstance.transferFrom, "transferFrom", args, config, (0, _transactions.errorOnFailure)('transferFrom', booleanSuccessTest), callback);
}
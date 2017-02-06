/**
 * Created by denisgranha on 06/02/16.
 */
import * as abi from '../abi';
import {callAndSendTransaction, errorOnFailure, txDefaults} from '../lib/transactions';

export function deposit(value, config, callback) {
  const contractInstance = config.web3.eth.contract(abi.makerToken).at(config.addresses.makerToken);
  const args = [
    Object.assign({value: value}, txDefaults(config)),
  ];

  const booleanSuccessTest = res => res;
  return callAndSendTransaction(
      contractInstance.deposit,
      'buyTokens',
      args,
      config,
      errorOnFailure('buyTokens', booleanSuccessTest),
      callback);
}

export function withdraw(count, config, callback) {
  const contractInstance = config.web3.eth.contract(abi.makerToken).at(config.addresses.makerToken);
  const args = [
    count,
    txDefaults(config),
  ];

  const booleanSuccessTest = res => res;
  return callAndSendTransaction(
    contractInstance.withdraw,
    'sellTokens',
    args,
    config,
    errorOnFailure('sellTokens', booleanSuccessTest),
    callback
  );
}

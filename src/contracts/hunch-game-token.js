/**
 * Created by denisgranha on 31/10/16.
 */

import {callAndSendTransaction, errorOnFailure, txDefaults}
  from '../lib/transactions';
import * as abi from '../abi';


export function setup(config, callback) {
  const contractInstance = config.web3.eth
    .contract(abi.hunchGameToken)
    .at(config.addresses.hunchGameToken);
  const args = [
    config.addresses.hunchGameMarketFactory,
    txDefaults(config),
  ];

  const booleanSuccessTest = res => res;
  return callAndSendTransaction(
      contractInstance.setup,
      "setup",
      args,
      config,
      errorOnFailure('setup', booleanSuccessTest),
      callback);
}

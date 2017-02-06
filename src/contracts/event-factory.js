/**
 * Created by denisgranha on 8/4/16.
 */
import _ from 'lodash';
import * as hex from '../lib/hex';
import BigNumber from 'bignumber.js';
import * as constants from '../constants';
import {
  callAndSendTransaction,
  errorOnFailure,
  waitForReceipt,
  txDefaults
} from '../lib/transactions';
import {requestWithBlockNumber} from '../lib/web3-batch';
import {promiseCallback} from '../lib/callbacks';
import * as helpers from '../helpers';
import * as abi from '../abi';
import {get} from '../state';
import {getFee} from './oracle';

export function buyAllOutcomes(eventHash, numShares, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);

    const args = [
        eventHash,
        numShares,
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;

    return callAndSendTransaction(
        contractInstance.buyAllOutcomes,
        "buyAllOutcomes",
        args,
        config,
        errorOnFailure('buyAllOutcomes', booleanSuccessTest),
        callback);


}

export function sellAllOutcomes(eventHash, numShares, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    const args = [
        eventHash,
        numShares,
        txDefaults(config),
    ];
    const booleanSuccessTest = res => res;

    return callAndSendTransaction(
        contractInstance.sellAllOutcomes,
        "sellAllOutcomes",
        args,
        config,
        errorOnFailure('sellAllOutcomes', booleanSuccessTest),
        callback);
}

/**
 * Redeem shares for token after the winning outcome has been set for a market.
 */
export function redeemWinnings(eventHash, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    const args = [
        eventHash,
        txDefaults(config),
    ];

    return callAndSendTransaction(
        contractInstance.redeemWinnings,
        "redeemWinnings",
        args,
        config,
        errorOnFailure('redeemWinnings'),
        callback);
}

/**
 *
 * @param event
 * @param descriptionHash
 * @param feeSignatures
 * @param config
 * @param callback
 * @returns {Promise}
 */
export function createOffChainEvent(event, descriptionHash, feeSignatures,
  config, callback){
    return createEvent(
      event,
      descriptionHash,
      helpers.encodeFeeSignatures(feeSignatures),
      config,
      callback);
}

/**
 * Create the event on chain with metadata and fees for the ultimateOracle.
 * @return {Promise}  Resolves to an object containing the event hash and
 * transaction hash of the sent transaction.
 */
export function createEvent(event, descriptionHash, validationData, config,
  callback) {

    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    const bounds = {lowerBound: 0, upperBound: 0};
    if (event.kind === constants.KIND_RANGED){
        bounds.lowerBound = event.lowerBound;
        bounds.upperBound = event.upperBound;
    }

    const args = [
        descriptionHash,
        event.kind === constants.KIND_RANGED,
        bounds.lowerBound,
        bounds.upperBound,
        event.outcomeCount,
        event.tokenAddress,
        event.resolverAddress,
        validationData,
        txDefaults(config),
    ];

    return callAndSendTransaction(
        contractInstance.createEvent,
        "createEvent",
        args,
        config,
        errorOnFailure('createEvent'),
        callback);

}


/**
 * Gets the event_hashes for a given description_hashes of events
 * @param descriptionHashes
 * @param creators
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
export function getEventHashes(descriptionHashes, creators, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    return requestWithBlockNumber(
        contractInstance.getEventHashes,
        descriptionHashes,
        creators,
        'latest',
        callback);
}

/**
 * Returns an object of description hashes, where each description hash has a
 * collection of event hashes
 * @param descriptionHashes
 * @param creators
 * @param config
 * @returns {*}
 */
export function getEventHashesProcessed(descriptionHashes, creators, config) {
  return new Promise((resolve, reject) => {
    getEventHashes(
      descriptionHashes,
      creators,
      config,
      promiseCallback(resolve, reject)
    ).call();
  }).then((eventHashesResponse) => {
    return new Promise((resolve, reject) => {
      let events = [];
      if (eventHashesResponse.length > 2){
        let index = 2;
        while (index < eventHashesResponse.length){
          let currentDescription = hex.encode(eventHashesResponse[index - 2]);
          let numHashes = eventHashesResponse[index - 1].toNumber();
          for (var offset = 0; offset < numHashes; offset++){
            // We add a new entry on state.events for each eventHash, with its
            // respective description
            let eventHash = hex.encode(eventHashesResponse[index + offset], 256);
            events.push(eventHash);
          }
          index += numHashes + 2;
        }
      }
      resolve(events);
    });
  });
}

/**
 * Returns a collection of event objects stored on eventsContract identified by
 * given event_hashes
 * @param eventHashes
 * @param resolverAddress
 * @param config
 * @param callback
 * @returns {Promise|Promise<T>}
 */
export function getEvents(eventHashes, resolverAddress, tokenAddress,
  config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    return requestWithBlockNumber(
        contractInstance.getEvents,
        eventHashes,
        resolverAddress,
        tokenAddress,
        'latest',
        callback);
}

export function getEventsProcessed(eventHashes, resolverAddress, tokenAddress,
  config) {
  return new Promise((resolve, reject) => {
    getEvents(
      eventHashes,
      resolverAddress,
      tokenAddress,
      config,
      promiseCallback(resolve, reject)
    ).call();
  }).then((contractData) =>
  {
    return new Promise((resolve, reject) =>
    {
      // Returned array have the following structure:
      // [eventHash, descriptionHash, isRanged, lowerBound, upperBound,
      // outcomeCount, resolverAddress, tokenAddress, creatorAddress,
      // isWinningOutcomeSet, winningOutcome, eventDataLength, eventData1...,
      // eventDataN, eventHash2, descriptionHash2 ... ]
      const events = {};
      let eventIndex = 0;
      while (eventIndex < contractData.length) {
        if (contractData[eventIndex].equals(0)) {
          break;
        }

        const eventHash = hex.encode(contractData[eventIndex], 256);
        const isResolved = !contractData[eventIndex + 8].eq(0);
        const outcomeCount = contractData[eventIndex + 10].toNumber();

        // tokenAddress, currencyHash should be null if is 0x0

        events[eventHash] = {
          eventHash: eventHash,
          descriptionHash:
            hex.encode(contractData[eventIndex + 1], 256),
          kind:
            contractData[eventIndex + 2].eq(0) ? constants.KIND_DISCRETE : constants.KIND_RANGED,
          outcomeCount: outcomeCount,
          eventIdentifier: hex.encode(contractData[eventIndex + 7], 256),
          resolverAddress: hex.encode(contractData[eventIndex + 6], 160),
          tokenAddress:
            contractData[eventIndex + 5].eq(0) ? null : hex.encode(contractData[eventIndex + 5], 160),
          // creatorAddress: hex.encode(contractData[eventIndex + 2], 160),
          isResolved: isResolved,
          winningOutcome:
            isResolved ? contractData[eventIndex + 9].toNumber() : null,
          tokens: contractData.slice(
            eventIndex + 11, eventIndex + 11 + outcomeCount
            ).map(token => hex.encode(token, 160))
        };




        if (events[eventHash].kind === constants.KIND_RANGED) {
          if (contractData[eventIndex + 3].greaterThan(new BigNumber(2).pow(128))) {
            events[eventHash].lowerBound = contractData[eventIndex + 3].minus(new BigNumber(2).pow(256));
          }
          else {
            events[eventHash].lowerBound = contractData[eventIndex + 3];
          }

          if (contractData[eventIndex + 4].greaterThan(new BigNumber(2).pow(128))) {
            events[eventHash].upperBound = contractData[eventIndex + 4].minus(new BigNumber(2).pow(256));
          }
          else {
            events[eventHash].upperBound = contractData[eventIndex + 4];
          }
        }

        eventIndex += 11 + outcomeCount;
      }

      resolve(events);

    });
  });
}

/**
 * Returns event object stored on eventsContract indentified by eventHash
 * @param eventHash
 * @param config
 * @param callback
 * @returns {requestObject}
 */
export function getEvent(eventHash, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    return requestWithBlockNumber(
        contractInstance.getEvent,
        eventHash,
        'latest',
        callback);
}

/**
 *
 * @param forAddress
 * @param eventHashes
 * @param config
 * @param callback
 * @returns {Request}
 */
export function getShares(forAddress, eventHashes, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    return requestWithBlockNumber(
        contractInstance.getShares,
        forAddress,
        eventHashes,
        'latest',
        callback);
}

export function getSharesProcessed(forAddress, eventHashes, config) {
  return new Promise((resolve, reject) => {
    getShares(
      forAddress,
      eventHashes,
      config,
      promiseCallback(resolve, reject)
    ).call();
  }).then((contractData) => {
    return new Promise((resolve, reject) => {
      let index=2;
      let tokens = {};
      while(index< contractData.length) {
        let currentEventHash = hex.encode(contractData[index-2], 256);
        let currentEvent = get(config).events[currentEventHash];
        let numOutcomes = contractData[index-1].toNumber();

        for(var outcomeIndex=0; outcomeIndex<numOutcomes; outcomeIndex++){
          let tokenAddress = currentEvent.tokens[outcomeIndex];
          tokens[tokenAddress] = {
              value: contractData[index+outcomeIndex],
              eventHash: currentEventHash,
              outcomeIndex: outcomeIndex
          };
        }

        index += numOutcomes +2;

      }
      resolve(tokens);
    });
  },
  (error) => {
    return new Promise((resolve, reject) => {
        resolve({});
    });
  });
}

/**
 * * Returns BaseFee stored on Event Token Contract
 * @param config
 */
export function getBaseFee(config, callback){
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    return requestWithBlockNumber(
        contractInstance.getBaseFee,
        'latest',
        callback
    );
}

export function calcBaseFeeForShares(shares, config) {
  return new Promise((resolve, reject) => {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    requestWithBlockNumber(
        contractInstance.calcBaseFeeForShares,
        shares,
        'latest',
        promiseCallback(resolve, reject)
    ).call();
  });
    // return new Promise((resolve, reject) =>
    // {
    //     // use the state if available
    //     let baseFee = get(config).baseFee;
    //
    //     if(baseFee){
    //         resolve(baseFee);
    //     }
    //     else{
    //         getBaseFee(config, (e, baseFee) =>
    //         {
    //             resolve(baseFee);
    //         }).call();
    //     }
    //
    // }).then((baseFee) => {
    //     return shares
    //     .mul("1000000")
    //     .div(
    //       new BigNumber("1000000").minus(baseFee)
    //     ).minus(shares);
    // });
}

export function calcBaseFee(amount, config) {
  return new Promise((resolve, reject) => {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    requestWithBlockNumber(
        contractInstance.calcBaseFee,
        amount,
        'latest',
        promiseCallback(resolve, reject)
    ).call();
  });
    // return new Promise((resolve, reject) =>
    // {
    //     // use the state if available
    //     let baseFee = get(config).baseFee;
    //
    //     if(baseFee){
    //         resolve(baseFee);
    //     }
    //     else{
    //         getBaseFee(config, (e, baseFee) =>
    //         {
    //             resolve(baseFee);
    //         }).call();
    //     }
    // }).then((baseFee) => {
    //     return amount.mul(baseFee).div(new BigNumber("1000000")).floor();
    // });
}

export function permitPermanentApproval(spender, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    const args = [
        spender,
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.permitPermanentApproval,
        "permitPermanentApproval",
        args,
        config,
        errorOnFailure('permitPermanentApproval', booleanSuccessTest),
        callback);
}

export function isPermanentlyApproved(owner, spender, config, callback) {
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);

    return requestWithBlockNumber(
        contractInstance.isPermanentlyApproved,
        owner,
        spender,
        'latest',
        callback
    );
}

export function ensurePermanentApproval(spender, config) {
    return new Promise((resolve, reject) => {
      isPermanentlyApproved(
        config.account,
        spender,
        config,
        promiseCallback(resolve, reject)
      ).call();
    }).then((isPermanentlyApproved) => {
      if(!isPermanentlyApproved) {
        return new Promise((resolve, reject) => {
          permitPermanentApproval(
            spender,
            config,
            promiseCallback(resolve, reject)
          );
        });
        return true;
      }
    }).then((result) => {
      return result;
    });
}

export function revokePermanentApproval(allowedAddress, config, callback){
    const contractInstance = config.web3.eth
      .contract(abi.eventFactory)
      .at(config.addresses.eventFactory);
    const args = [
        allowedAddress,
        txDefaults(config),
    ];

    const booleanSuccessTest = res => res;
    return callAndSendTransaction(
        contractInstance.revokePermanentApproval,
        "revokePermanentApproval",
        args,
        config,
        errorOnFailure('revokePermanentApproval', booleanSuccessTest),
        callback);
}

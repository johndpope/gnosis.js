/**
 * Created by denisgranha on 13/4/16.
 */
import * as eventFactory from './contracts/event-factory';
import * as abstractToken from './contracts/token';
import * as marketFactory from './contracts/market-factory';
import * as marketMaker from './contracts/market-maker';
import * as api from './api';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import {promiseCallback} from './lib/callbacks';
import * as helpers from './helpers';
import * as hex from './lib/hex';
import {deepCompare} from './lib/compare';
import co from 'co';
import * as constants from './constants';
import * as models from './models';
import {signing} from 'eth-lightwallet';


export let state = {
    blockNumber: 0,
    eventDescriptions: {},
    events: {},
    markets: {},
    transactions: {},
    tokens: {},
    baseFee: null,
    eventCount: 0
};

export function reset(){
    state.blockNumber = 0;
    state.eventDescriptions = {};
    state.events = {};
    state.markets = {};
    state.transactions = {};
    state.tokens = {};
    state.baseFee = null;
    state.eventCount = 0;
}

export function updateTransactions(transactions, config){
    Object.assign(state.transactions, transactions);

    if(config && config.newTransactionCallback) {
        config.newTransactionCallback();
    }

    if(config && config.persistTransactions){
        saveTransactions(config);
    }

    return getTransactions(config);
}

export function getTransactions(config){
  if(
    config &&
    config.persistTransactions &&
    Object.keys(state.transactions).length == 0
  ){
      state.transactions = loadTransactions(config);
  }
  return state.transactions;
}

export function saveTransactions(config){
    if(config && config.persistTransactions && localStorage) {
        let persistentTransactions = {};
        Object.assign(persistentTransactions, state.transactions);
        localStorage
          .setItem(
            "gnosisTransactions",
            JSON.stringify(persistentTransactions)
          );
    }
}

export function loadTransactions(){
    if(typeof localStorage != "undefined"){
        let persistentTransactions = JSON
          .parse(localStorage.getItem("gnosisTransactions"));
        if(persistentTransactions){
            Object.assign(state.transactions, persistentTransactions);
        }
    }
    return state.transactions;
}

export function removeTransactions(){
    state.transactions = {};
    localStorage.removeItem("gnosisTransactions");
}

/**
 * Updates state.eventDescriptions property. Updates descriptions related to
 * given descriptionHashes or rebuilds it
 * if none descriptionHashes passed
 * @param config
 * @param descriptionHashes
 * @returns {Promise<T>|Promise}
 */
export function updateEventDescriptions(config, filters){

  let defaultFilters = {};
  // Merge filters
  Object.assign(defaultFilters, config.eventDescriptionFilters);
  // passed filters have priority
  Object.assign(defaultFilters, filters);

  return new Promise((resolve, reject) => {
    // Get description hashes from Django API
    // oracle_addresses, resolution_date_gt, include_whitelisted_oracles
    api.getEvents(config,
      {
        description_hashes: defaultFilters.descriptionHashes,
        include_whitelisted_oracles: defaultFilters.includeWhitelistedOracles,
        oracle_addresses: defaultFilters.oracleAddresses,
        creator_address: defaultFilters.creatorAddress,
        page_size: defaultFilters.pageSize,
        page: defaultFilters.page,
        title: defaultFilters.title,
        tags: defaultFilters.tags,
        resolution_date_gt: defaultFilters.resolutionDate?new Date().toISOString():null,
        resolution_date_lt: defaultFilters.resolutionDate
      }
    )
    .then((eventResponse) => {
      state.eventCount = eventResponse.data.count;
      let events = eventResponse.data.results;
      let eventDescriptions = {};

      events.map((event) => {
        // Check descriptionHash is the same
        let identifiers = helpers
          .getEventIdentifiers(JSON.parse(event.descriptionJSON));


        // Check that descriptionHash = sha3(descriptionJSON)
        // check descriptionJSON has needed fields title, description,
        // resolutionDate, outcomes...
        // check outcomeCount > 1
        // check descriptionJSON properties types: resolutionDate, title,
        // description...
        let descriptionJSON = JSON.parse(event.descriptionJSON);
        if (
          identifiers.descriptionHash == event.descriptionHash &&
          typeof descriptionJSON.title == "string" &&
          typeof descriptionJSON.description == "string" &&
          descriptionJSON.resolutionDate &&
          (
            (
              Array.isArray(descriptionJSON.outcomes) &&
              descriptionJSON.outcomes.length > 1
            ) ||
            (descriptionJSON.unit && descriptionJSON.decimals != undefined)
          )
        )
        {
          event.descriptionJSON = JSON.parse(event.descriptionJSON);
          event.descriptionJSON.resolutionDate = new Date(
            event.descriptionJSON.resolutionDate
          );
          eventDescriptions[identifiers.descriptionHash] = new models
            .EventDescription(event, state);


          for(let oracleAddress in event.offChainOracles){
            // check feeSignatures, concatenation of
            // sha3(descriptionHash+fee), recover oracle address
            try{
              let fee = event.offChainOracles[oracleAddress].fee;
              let feeToken = fee.feeToken;
              if(fee){
                let v = new Buffer(new BigNumber(fee.v).toString(16), 'hex');
                let r = new Buffer(
                  hex.encode(new BigNumber(fee.r), 256).slice(2),
                  'hex'
                );
                let s = new Buffer(
                  hex.encode(new BigNumber(fee.s), 256).slice(2),
                  'hex'
                );
                let feeHex = hex.encode(new BigNumber(fee.fee), 256);
                let address = '0x' + signing.recoverAddress(
                  identifiers.descriptionHash + feeHex.slice(2) + feeToken.slice(2),
                  v,
                  r,
                  s
                ).toString('hex');

                if(oracleAddress != address){
                    event.offChainOracles[oracleAddress].fee = null;
                }
              }
            }
            catch(error){
                console.error(error);
                event.offChainOracles[oracleAddress].fee = null;
            }

            // Check all revisions data
            for(let i=0; i<event.offChainOracles[oracleAddress].revisions.length; i++){
              // Check revision signature
              let revision = event.offChainOracles[oracleAddress].revisions[i];
              try{
                let v = new Buffer(
                  new BigNumber(revision.v).toString(16),
                  'hex'
                );
                let r = new Buffer(
                  hex.encode(new BigNumber(revision.r), 256).slice(2),
                  'hex'
                );
                let s = new Buffer(
                  hex.encode(new BigNumber(revision.s), 256).slice(2),
                  'hex'
                );

                let msgRaw = new Buffer(
                  revision.revisionJSON
                );
                // revisionSignature is the signature of descriptionHash
                let address = '0x' + signing.recoverAddress(
                        msgRaw,
                        v,
                        r,
                        s
                    ).toString('hex');

                let revisionJSON = JSON.parse(revision.revisionJSON);

                let outcomesCount = 2;
                if(revisionJSON.outcomes){
                    outcomesCount = revisionJSON.outcomes.length;
                }
                // Only if revision signature is correct we add it to the
                // revisions object map outcomeCount should be equal to
                // outcomes.length if discrete or 2 if ranged index of
                // revisions has to be incremental without jumps, are
                // order desc
                if(
                    address == oracleAddress &&
                    ((event.descriptionJSON.outcomes && outcomesCount == event.descriptionJSON.outcomes.length) ||
                    (!event.descriptionJSON.outcomes && outcomesCount == 2)) &&
                    revisionJSON.nonce == event.offChainOracles[oracleAddress].revisions.length - i - 1
                ){
                    Object.assign(revision, JSON.parse(revision.revisionJSON));
                }
                else{
                    revision = null;
                }
              }
              catch(error){
                console.error(error);
                revision = null;
              }
            }
          }
        }
      });

      //Copy new eventDescriptions to state
      Object.assign(state.eventDescriptions, eventDescriptions);

      resolve(eventDescriptions);

    });
  });
}

export function updateEvents(config, creators, resolverAddress, tokenAddress,
  filteredEventHashes) {
  return new Promise((resolve, reject) => {
    // If eventHashes passed, get all Description Hashes related
    if (filteredEventHashes) {
        resolve(filteredEventHashes);
    }
    // If not, get all Description Hashes
    else {
      let descriptionHashes = Object.keys(state.eventDescriptions);
      eventFactory.getEventHashesProcessed(descriptionHashes, creators, config)
      .then((eventHashes) => {
          resolve(eventHashes);
      })
    }
  }).then((eventHashes) => {
    return new Promise((resolve, reject) => {
      // get events from blockchain
      eventFactory.getEventsProcessed(eventHashes, resolverAddress,
        tokenAddress, config)
        .then((events) => {
          // console.log("descriptions", state.eventDescriptions);
          // console.log("events", events, eventHashes, resolverAddress);
          let checkedEvents = {};
          // And link related markets and descriptions
          for (var eventHash in events) {

            let relatedDescriptionHash = events[eventHash].descriptionHash;


            let relatedEvent = state.eventDescriptions[relatedDescriptionHash];
            // check blockchain events data against API events

            let descriptionJSON = relatedEvent.descriptionJSON;

            if (relatedEvent) {
              if (
                // Check Event Info (eventType, lowerBound, upperBound,
                // outcomeCount, data) against descriptionJSON and
                // description data
                (
                  (
                    events[eventHash].kind == constants.KIND_DISCRETE &&
                    events[eventHash].outcomeCount == descriptionJSON.outcomes.length
                  ) ||
                  (
                    events[eventHash].kind == constants.KIND_RANGED &&
                    events[eventHash].outcomeCount == 2
                  )
                ) &&
                config.addressFiltersPostLoad.oracles
                  .indexOf(events[eventHash].resolverAddress) != -1 &&
                config.addressFiltersPostLoad.tokens
                  .indexOf(events[eventHash].tokenAddress) != -1

              ) {
                checkedEvents[eventHash] = new models.Event(
                  events[eventHash],
                  state
                );

                // Bidirectional link to eventDescriptions
                state.eventDescriptions[checkedEvents[eventHash]
                  .descriptionHash].eventHashes.push(eventHash);
              }
            }
          }

          //Copy event events object to state
          Object.assign(state.events, checkedEvents);

          resolve(checkedEvents);
      });
    });
  });
}

export function updateMarkets(config, investors, marketContractAddress,
  filteredMarketHashes) {
    return new Promise((resolve, reject) => {
        if(filteredMarketHashes){
            resolve(filteredMarketHashes);
        }
        // If no eventHashes are passed to the function, will get all eventHashes on state
        else{
            marketFactory.getMarketHashesProcessed(
              Object.keys(state.events),
              investors,
              config,
              marketContractAddress
            )
                .then((marketHashes) => {
                    resolve(marketHashes);
                });
        }
    }).then((marketHashes) => {
        return new Promise((resolve, reject) => {
            marketFactory.getMarketsProcessed(marketHashes, config,
              marketContractAddress)
                .then((markets) => {
                    // console.log("markets", markets);

                    let checkedMarkets = {};
                    for(var marketHash in markets){
                        if(
                          // Check market maker against config maker's addresses
                          config.addressFiltersPostLoad.marketMakers.indexOf(markets[marketHash].makerAddress) != -1 &&
                          // Check outcomeCount = outcomes.length or 2 (if is ranged)
                          markets[marketHash].outcomeCount == state.events[markets[marketHash].eventHash].outcomeCount
                        ){
                            checkedMarkets[marketHash] = new models.Market(markets[marketHash], state, marketContractAddress);

                            // Bidirectional link
                            if(! state.events[markets[marketHash].eventHash].marketHashes) {
                                state.events[markets[marketHash].eventHash].marketHashes = [];
                            }
                            state.events[markets[marketHash].eventHash].marketHashes.push(marketHash);


                            // If there is a previous prices history, we mantain it
                            if(state.markets[marketContractAddress] && state.markets[marketContractAddress][marketHash]){
                                checkedMarkets[marketHash].history = state.markets[marketContractAddress][marketHash].history;
                            } else {
                                checkedMarkets[marketHash].history = {};
                            }
                        }
                    }

                    if(!state.markets[marketContractAddress]){
                        state.markets[marketContractAddress] = {};
                    }

                    // Copy markets to state object
                    Object.assign(state.markets[marketContractAddress], checkedMarkets);

                    resolve(checkedMarkets);
                });
        });
    });
}

export function updateTokens(tokenAddresses, config) {

    return new Promise((resolve, reject) => {

        let balances = {};
        let batch = config.web3.createBatch();
        let tokenPromises = tokenAddresses.map((tokenAddress) => {
          balances[tokenAddress] = {};
            return new Promise((resolve, reject) => {
                // Ether balance
                if (tokenAddress === 0) {
                  config.web3.eth.getBalance(config.account, (e, ethBalance) => {
                    Object.assign(balances[tokenAddress], {value: ethBalance});
                    resolve();
                  });
                } else if (tokenAddress === config.addresses.makerToken) {
                  abstractToken.balanceOf(tokenAddress, config.account, config, (e, tokenBalance) => {
                    Object.assign(balances[tokenAddress], {value: tokenBalance, name: 'Maker ETH Wrapper', symbol: 'ETH'});
                    resolve();
                  }).call();
                } else {
                    // token balance
                    let balancePromise = new Promise((resolve, reject) => {
                      batch.add(
                        abstractToken.balanceOf(tokenAddress, config.account, config, (e, tokenBalance) => {
                          Object.assign(balances[tokenAddress], {value: tokenBalance});
                          resolve();
                        })
                      );
                    });
                    let namePromise = new Promise((resolve, reject) => {
                      // token name
                      batch.add(
                        abstractToken.name(
                          tokenAddress,
                          config,
                          (e, tokenName) => {
                            Object.assign(balances[tokenAddress], {name: tokenName});
                            resolve();
                          },
                          () => {
                            Object.assign(balances[tokenAddress], {name: ''});
                            resolve();
                          }
                        )
                      );
                    });

                    let symbolPromise = new Promise((resolve, reject) => {
                      // token symbol
                      batch.add(
                        abstractToken.symbol(
                          tokenAddress,
                          config,
                          (e, tokenSymbol) => {
                            Object.assign(balances[tokenAddress], {symbol: tokenSymbol});
                            resolve();
                          },
                          () => {
                            Object.assign(balances[tokenAddress], {symbol: ''});
                            resolve();
                          }
                        )
                      );
                    });

                    let decimalsPromise = new Promise((resolve, reject) => {
                      // token decimals
                      batch.add(
                        abstractToken.decimals(
                          tokenAddress,
                          config,
                          (e, tokenDecimals) => {
                            Object.assign(balances[tokenAddress], {decimals: tokenDecimals});
                            resolve();
                          },
                          () => {
                            Object.assign(balances[tokenAddress], {decimals: 0});
                            resolve();
                          }
                        )
                      );
                    });

                    Promise.all(
                      [
                        balancePromise,
                        namePromise,
                        symbolPromise,
                        decimalsPromise
                      ]
                    )
                    .then(() => {
                      resolve();
                    });

                }
            });
        });

        batch.execute();

        Promise.all(tokenPromises).then(() => {
            // Copy balances to state object
            Object.assign(state.tokens, balances);
            resolve(balances);
        });

    });
}

export function updateEventTokenShares(forAddress, eventHashes, config){
    return new Promise((resolve, reject) => {
        // Get shares for on event token contract
        eventFactory.getSharesProcessed(forAddress, eventHashes, config)
            .then((shares) => {

                //remove the old entries, otherwise removed shares will be left in state.
                for (let tokenAddress in state.tokens) {
                    if(eventHashes.indexOf(state.tokens[tokenAddress].eventHash) > -1) {
                        delete state.tokens[tokenAddress];
                    }
                }


                Object.assign(state.tokens, shares);
                resolve(shares);
            });
    });
}

export function updateBlocknumber(config) {
    return new Promise((resolve, reject) => {
        config.web3.eth.getBlockNumber((error, blockNumber) => {
            if(error) {
                return reject(error);
            }

            state.blockNumber = blockNumber;
            resolve(blockNumber);
        });
    });
}


export function getSample(marketAddress, marketHash, blockNumber, config) {
    const sharesPromise = new Promise((resolve, reject) => {
        config.batch.add(
                marketFactory.getShareDistributionWithTimestamp(
                marketHash,
                blockNumber,
                config,
                marketAddress,
                promiseCallback(resolve, reject)
            )
        );
    });
    return sharesPromise.then((sharesData) => {
        const shares = sharesData.slice(1);  // getShareDistribution includes timestamp, we don't need it
        return {
            blockNumber: blockNumber,
            timestamp: sharesData[0].toNumber(),
            shareDistribution: shares,
        };
    });
}

/**
 * Get the shares history for a market.
 * @param  marketAddress: market contract address
 * @param  marketHash: market sha3 hash that identifies the market instance
 * @param  fromBlock: first block of the interval
 * @param  toBlock: last block of the inverval
 * @param  sampleCount: number of points of the interval
 * @param  config: config object
 */
export function updateHistory(marketAddress, marketHash, fromBlock, toBlock, sampleCount, config){
    config.batch = config.web3.createBatch();

    // Get market info
    const market = state.markets[marketAddress][marketHash];
    if(!market){
        return new Promise((resolve, reject) => {
           reject("unknown market");
        });
    }
    let fromBlockCorrected = fromBlock + (fromBlock % sampleCount);
    let toBlockCorrected = toBlock - (toBlock % sampleCount);
    const blocksToSample = _.range(
        fromBlockCorrected,
        toBlockCorrected,
        Math.floor((toBlockCorrected - fromBlockCorrected) / sampleCount)
    );

    blocksToSample[blocksToSample.length-1] = toBlock;

    const samplePromises = blocksToSample.map((block) => {
        return new Promise((resolve, reject) =>
        {
            // Check if is currently on the state
            if(market.history[block]){
                resolve(market.history[block])
            }
            else{
                getSample(marketAddress, marketHash, block, config)
                    .then((sample) =>
                    {
                        const newSample = {shareDistribution: sample.shareDistribution, timestamp: sample.timestamp};
                        market.history[block] = {};
                        Object.assign(market.history[block], newSample);
                        resolve(newSample);
                    },
                        (error) => {
                            console.error(error);
                            resolve();
                        });
            }
        });
    });

    // After adding all request to the batcher, we execute them
    config.batch.execute();
    config.batch = config.web3.createBatch();

    return Promise.all(samplePromises);
}

// export function updateBaseFee(config){
//     return new Promise((resolve, reject) => {
//         eventFactory.getBaseFee(config, promiseCallback(resolve, reject)).call();
//     });
// }

export function buildState(config, creators, investors, tokenAddresses, marketAddresses) {
    if(!tokenAddresses){
        tokenAddresses = [config.addresses.etherToken];
    }

    if(!marketAddresses){
        marketAddresses = [config.addresses.defaultMarketFactory];
    }

    if(!creators){
      creators = [config.account];
    }

    if(!investors){
      investors = [config.account];
    }

    return co(function*() {
        let eventDescriptions = yield updateEventDescriptions(config);
        let events = yield updateEvents(config, creators, config.addressFilters.oracle);
        let parallelUpdates = [
            updateTokens(tokenAddresses, config),
            updateEventTokenShares(config.account, Object.keys(state.events), config),
            updateBlocknumber(config)
            // updateBaseFee(config),
        ];

        // Add market updates to parallelUpdates array
        marketAddresses.map((marketAddress) => {
            parallelUpdates.push(updateMarkets(config, investors, marketAddress));
        });

        if(Array.isArray(config.additionalUpdates)) {
            config.additionalUpdates.forEach((item) => {
                parallelUpdates.push(item());
            });
        }
        yield parallelUpdates;
        state.transactions = loadTransactions(config);
        state.config = config;

        return state;
    });
}

export function get(config) {
    state.config = config;
    if(
      state.config &&
      state.config.persistTransactions &&
      state.transactions == {}
    ){
        state.transactions = loadTransactions(config);
    }
    return state;
}

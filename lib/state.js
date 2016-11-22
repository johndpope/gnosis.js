'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.state = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

exports.reset = reset;
exports.updateTransactions = updateTransactions;
exports.getTransactions = getTransactions;
exports.saveTransactions = saveTransactions;
exports.loadTransactions = loadTransactions;
exports.removeTransactions = removeTransactions;
exports.updateEventDescriptions = updateEventDescriptions;
exports.updateEvents = updateEvents;
exports.updateMarkets = updateMarkets;
exports.updateTokens = updateTokens;
exports.updateEventTokenShares = updateEventTokenShares;
exports.updateBlocknumber = updateBlocknumber;
exports.getSample = getSample;
exports.updateHistory = updateHistory;
exports.buildState = buildState;
exports.get = get;

var _eventFactory = require('./contracts/event-factory');

var eventFactory = _interopRequireWildcard(_eventFactory);

var _token = require('./contracts/token');

var abstractToken = _interopRequireWildcard(_token);

var _marketFactory = require('./contracts/market-factory');

var marketFactory = _interopRequireWildcard(_marketFactory);

var _marketMaker = require('./contracts/market-maker');

var marketMaker = _interopRequireWildcard(_marketMaker);

var _api = require('./api');

var api = _interopRequireWildcard(_api);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _callbacks = require('./lib/callbacks');

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var _hex = require('./lib/hex');

var hex = _interopRequireWildcard(_hex);

var _compare = require('./lib/compare');

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _constants = require('./constants');

var constants = _interopRequireWildcard(_constants);

var _models = require('./models');

var models = _interopRequireWildcard(_models);

var _ethLightwallet = require('eth-lightwallet');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var state = exports.state = {
    blockNumber: 0,
    eventDescriptions: {},
    events: {},
    markets: {},
    transactions: {},
    tokens: {},
    baseFee: null,
    eventCount: 0
}; /**
    * Created by denisgranha on 13/4/16.
    */
function reset() {
    state.blockNumber = 0;
    state.eventDescriptions = {};
    state.events = {};
    state.markets = {};
    state.transactions = {};
    state.tokens = {};
    state.baseFee = null;
    state.eventCount = 0;
}

function updateTransactions(transactions, config) {
    (0, _assign2.default)(state.transactions, transactions);

    if (config && config.newTransactionCallback) {
        config.newTransactionCallback();
    }

    if (config && config.persistTransactions) {
        saveTransactions(config);
    }

    return getTransactions(config);
}

function getTransactions(config) {
    if (config && config.persistTransactions && (0, _keys2.default)(state.transactions).length == 0) {
        state.transactions = loadTransactions(config);
    }
    return state.transactions;
}

function saveTransactions(config) {
    if (config && config.persistTransactions && localStorage) {
        var persistentTransactions = {};
        (0, _assign2.default)(persistentTransactions, state.transactions);
        localStorage.setItem("gnosisTransactions", (0, _stringify2.default)(persistentTransactions));
    }
}

function loadTransactions() {
    if (typeof localStorage != "undefined") {
        var persistentTransactions = JSON.parse(localStorage.getItem("gnosisTransactions"));
        if (persistentTransactions) {
            (0, _assign2.default)(state.transactions, persistentTransactions);
        }
    }
    return state.transactions;
}

function removeTransactions() {
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
function updateEventDescriptions(config, filters) {

    var defaultFilters = {};
    // Merge filters
    (0, _assign2.default)(defaultFilters, config.eventDescriptionFilters);
    // passed filters have priority
    (0, _assign2.default)(defaultFilters, filters);

    return new _promise2.default(function (resolve, reject) {
        // Get description hashes from Django API
        // oracle_addresses, resolution_date_gt, include_whitelisted_oracles
        api.getEvents(config, {
            description_hashes: defaultFilters.descriptionHashes,
            include_whitelisted_oracles: defaultFilters.includeWhitelistedOracles,
            oracle_addresses: defaultFilters.oracleAddresses,
            creator_address: defaultFilters.creatorAddress,
            page_size: defaultFilters.pageSize,
            page: defaultFilters.page,
            title: defaultFilters.title,
            tags: defaultFilters.tags,
            resolution_date_gt: defaultFilters.resolutionDate ? new Date().toISOString() : null,
            resolution_date_lt: defaultFilters.resolutionDate
        }).then(function (eventResponse) {
            state.eventCount = eventResponse.data.count;
            var events = eventResponse.data.results;
            var eventDescriptions = {};

            events.map(function (event) {
                // Check descriptionHash is the same
                var identifiers = helpers.getEventIdentifiers(JSON.parse(event.descriptionJSON));

                // Check that descriptionHash = sha3(descriptionJSON)
                // check descriptionJSON has needed fields title, description,
                // resolutionDate, outcomes...
                // check outcomeCount > 1
                // check descriptionJSON properties types: resolutionDate, title,
                // description...
                var descriptionJSON = JSON.parse(event.descriptionJSON);
                if (identifiers.descriptionHash == event.descriptionHash && typeof descriptionJSON.title == "string" && typeof descriptionJSON.description == "string" && descriptionJSON.resolutionDate && (Array.isArray(descriptionJSON.outcomes) && descriptionJSON.outcomes.length > 1 || descriptionJSON.unit && descriptionJSON.decimals != undefined)) {
                    event.descriptionJSON = JSON.parse(event.descriptionJSON);
                    event.descriptionJSON.resolutionDate = new Date(event.descriptionJSON.resolutionDate);
                    eventDescriptions[identifiers.descriptionHash] = new models.EventDescription(event, state);

                    for (var oracleAddress in event.offChainOracles) {
                        // check feeSignatures, concatenation of
                        // sha3(descriptionHash+fee), recover oracle address
                        try {
                            var fee = event.offChainOracles[oracleAddress].fee;
                            var feeToken = fee.feeToken;
                            if (fee) {
                                var v = new Buffer(new _bignumber2.default(fee.v).toString(16), 'hex');
                                var r = new Buffer(hex.encode(new _bignumber2.default(fee.r), 256).slice(2), 'hex');
                                var s = new Buffer(hex.encode(new _bignumber2.default(fee.s), 256).slice(2), 'hex');
                                var feeHex = hex.encode(new _bignumber2.default(fee.fee), 256);
                                var address = '0x' + _ethLightwallet.signing.recoverAddress(identifiers.descriptionHash + feeHex.slice(2) + feeToken.slice(2), v, r, s).toString('hex');

                                if (oracleAddress != address) {
                                    event.offChainOracles[oracleAddress].fee = null;
                                }
                            }
                        } catch (error) {
                            console.error(error);
                            event.offChainOracles[oracleAddress].fee = null;
                        }

                        // Check all revisions data
                        for (var i = 0; i < event.offChainOracles[oracleAddress].revisions.length; i++) {
                            // Check revision signature
                            var revision = event.offChainOracles[oracleAddress].revisions[i];
                            try {
                                var _v = new Buffer(new _bignumber2.default(revision.v).toString(16), 'hex');
                                var _r = new Buffer(hex.encode(new _bignumber2.default(revision.r), 256).slice(2), 'hex');
                                var _s = new Buffer(hex.encode(new _bignumber2.default(revision.s), 256).slice(2), 'hex');

                                var msgRaw = new Buffer(revision.revisionJSON);
                                // revisionSignature is the signature of descriptionHash
                                var _address = '0x' + _ethLightwallet.signing.recoverAddress(msgRaw, _v, _r, _s).toString('hex');

                                var revisionJSON = JSON.parse(revision.revisionJSON);

                                var outcomesCount = 2;
                                if (revisionJSON.outcomes) {
                                    outcomesCount = revisionJSON.outcomes.length;
                                }
                                // Only if revision signature is correct we add it to the
                                // revisions object map outcomeCount should be equal to
                                // outcomes.length if discrete or 2 if ranged index of
                                // revisions has to be incremental without jumps, are
                                // order desc
                                if (_address == oracleAddress && (event.descriptionJSON.outcomes && outcomesCount == event.descriptionJSON.outcomes.length || !event.descriptionJSON.outcomes && outcomesCount == 2) && revisionJSON.nonce == event.offChainOracles[oracleAddress].revisions.length - i - 1) {
                                    (0, _assign2.default)(revision, JSON.parse(revision.revisionJSON));
                                } else {
                                    revision = null;
                                }
                            } catch (error) {
                                console.error(error);
                                revision = null;
                            }
                        }
                    }
                }
            });

            //Copy new eventDescriptions to state
            (0, _assign2.default)(state.eventDescriptions, eventDescriptions);

            resolve(eventDescriptions);
        });
    });
}

function updateEvents(config, creators, resolverAddress, tokenAddress, filteredEventHashes) {
    return new _promise2.default(function (resolve, reject) {
        // If eventHashes passed, get all Description Hashes related
        if (filteredEventHashes) {
            resolve(filteredEventHashes);
        }
        // If not, get all Description Hashes
        else {
                var descriptionHashes = (0, _keys2.default)(state.eventDescriptions);
                eventFactory.getEventHashesProcessed(descriptionHashes, creators, config).then(function (eventHashes) {
                    resolve(eventHashes);
                });
            }
    }).then(function (eventHashes) {
        return new _promise2.default(function (resolve, reject) {
            // get events from blockchain
            eventFactory.getEventsProcessed(eventHashes, resolverAddress, tokenAddress, config).then(function (events) {
                // console.log("descriptions", state.eventDescriptions);
                // console.log("events", events, eventHashes, resolverAddress);
                var checkedEvents = {};
                // And link related markets and descriptions
                for (var eventHash in events) {

                    var relatedDescriptionHash = events[eventHash].descriptionHash;

                    var relatedEvent = state.eventDescriptions[relatedDescriptionHash];
                    // check blockchain events data against API events

                    var descriptionJSON = relatedEvent.descriptionJSON;

                    if (relatedEvent) {
                        if (
                        // Check Event Info (eventType, lowerBound, upperBound,
                        // outcomeCount, data) against descriptionJSON and
                        // description data
                        (events[eventHash].kind == constants.KIND_DISCRETE && events[eventHash].outcomeCount == descriptionJSON.outcomes.length || events[eventHash].kind == constants.KIND_RANGED && events[eventHash].outcomeCount == 2) && config.addressFiltersPostLoad.oracles.indexOf(events[eventHash].resolverAddress) != -1 && config.addressFiltersPostLoad.tokens.indexOf(events[eventHash].tokenAddress) != -1) {
                            checkedEvents[eventHash] = new models.Event(events[eventHash], state);

                            // Bidirectional link to eventDescriptions
                            state.eventDescriptions[checkedEvents[eventHash].descriptionHash].eventHashes.push(eventHash);
                        }
                    }
                }

                //Copy event events object to state
                (0, _assign2.default)(state.events, checkedEvents);

                resolve(checkedEvents);
            });
        });
    });
}

function updateMarkets(config, investors, marketContractAddress, filteredMarketHashes) {
    return new _promise2.default(function (resolve, reject) {
        if (filteredMarketHashes) {
            resolve(filteredMarketHashes);
        }
        // If no eventHashes are passed to the function, will get all eventHashes on state
        else {
                marketFactory.getMarketHashesProcessed((0, _keys2.default)(state.events), investors, config, marketContractAddress).then(function (marketHashes) {
                    resolve(marketHashes);
                });
            }
    }).then(function (marketHashes) {
        return new _promise2.default(function (resolve, reject) {
            marketFactory.getMarketsProcessed(marketHashes, config, marketContractAddress).then(function (markets) {
                // console.log("markets", markets);

                var checkedMarkets = {};
                for (var marketHash in markets) {
                    if (
                    // Check market maker against config maker's addresses
                    config.addressFiltersPostLoad.marketMakers.indexOf(markets[marketHash].makerAddress) != -1 &&
                    // Check outcomeCount = outcomes.length or 2 (if is ranged)
                    markets[marketHash].outcomeCount == state.events[markets[marketHash].eventHash].outcomeCount) {
                        checkedMarkets[marketHash] = new models.Market(markets[marketHash], state, marketContractAddress);

                        // Bidirectional link
                        if (!state.events[markets[marketHash].eventHash].marketHashes) {
                            state.events[markets[marketHash].eventHash].marketHashes = [];
                        }
                        state.events[markets[marketHash].eventHash].marketHashes.push(marketHash);

                        // If there is a previous prices history, we mantain it
                        if (state.markets[marketContractAddress] && state.markets[marketContractAddress][marketHash]) {
                            checkedMarkets[marketHash].history = state.markets[marketContractAddress][marketHash].history;
                        } else {
                            checkedMarkets[marketHash].history = {};
                        }
                    }
                }

                if (!state.markets[marketContractAddress]) {
                    state.markets[marketContractAddress] = {};
                }

                // Copy markets to state object
                (0, _assign2.default)(state.markets[marketContractAddress], checkedMarkets);

                resolve(checkedMarkets);
            });
        });
    });
}

function updateTokens(tokenAddresses, config) {

    return new _promise2.default(function (resolve, reject) {

        var balances = {};
        var batch = config.web3.createBatch();
        var tokenPromises = tokenAddresses.map(function (tokenAddress) {
            balances[tokenAddress] = {};
            return new _promise2.default(function (resolve, reject) {
                // Ether balance
                if (tokenAddress == 0) {
                    config.web3.eth.getBalance(config.account, function (e, ethBalance) {
                        (0, _assign2.default)(balances[tokenAddress], { value: ethBalance });
                        resolve();
                    });
                } else {

                    // token balance
                    var balancePromise = new _promise2.default(function (resolve, reject) {
                        batch.add(abstractToken.balanceOf(tokenAddress, config.account, config, function (e, tokenBalance) {
                            (0, _assign2.default)(balances[tokenAddress], { value: tokenBalance });
                            resolve();
                        }));
                    });
                    var namePromise = new _promise2.default(function (resolve, reject) {
                        // token name
                        batch.add(abstractToken.name(tokenAddress, config, function (e, tokenName) {
                            (0, _assign2.default)(balances[tokenAddress], { name: tokenName });
                            resolve();
                        }));
                    });

                    var symbolPromise = new _promise2.default(function (resolve, reject) {
                        // token symbol
                        batch.add(abstractToken.symbol(tokenAddress, config, function (e, tokenSymbol) {
                            (0, _assign2.default)(balances[tokenAddress], { symbol: tokenSymbol });
                            resolve();
                        }));
                    });

                    var decimalsPromise = new _promise2.default(function (resolve, reject) {
                        // token decimals
                        batch.add(abstractToken.decimals(tokenAddress, config, function (e, tokenDecimals) {
                            (0, _assign2.default)(balances[tokenAddress], { decimals: tokenDecimals });
                            resolve();
                        }));
                    });

                    _promise2.default.all([balancePromise, namePromise, symbolPromise, decimalsPromise]).then(function () {
                        resolve();
                    });
                }
            });
        });

        batch.execute();

        _promise2.default.all(tokenPromises).then(function () {
            // Copy balances to state object
            (0, _assign2.default)(state.tokens, balances);
            resolve(balances);
        });
    });
}

function updateEventTokenShares(forAddress, eventHashes, config) {
    return new _promise2.default(function (resolve, reject) {
        // Get shares for on event token contract
        eventFactory.getSharesProcessed(forAddress, eventHashes, config).then(function (shares) {

            //remove the old entries, otherwise removed shares will be left in state.
            for (var tokenAddress in state.tokens) {
                if (eventHashes.indexOf(state.tokens[tokenAddress].eventHash) > -1) {
                    delete state.tokens[tokenAddress];
                }
            }

            (0, _assign2.default)(state.tokens, shares);
            resolve(shares);
        });
    });
}

function updateBlocknumber(config) {
    return new _promise2.default(function (resolve, reject) {
        config.web3.eth.getBlockNumber(function (error, blockNumber) {
            if (error) {
                return reject(error);
            }

            state.blockNumber = blockNumber;
            resolve(blockNumber);
        });
    });
}

function getSample(marketAddress, marketHash, blockNumber, config) {
    var sharesPromise = new _promise2.default(function (resolve, reject) {
        config.batch.add(marketFactory.getShareDistributionWithTimestamp(marketHash, blockNumber, config, marketAddress, (0, _callbacks.promiseCallback)(resolve, reject)));
    });
    return sharesPromise.then(function (sharesData) {
        var shares = sharesData.slice(1); // getShareDistribution includes timestamp, we don't need it
        return {
            blockNumber: blockNumber,
            timestamp: sharesData[0].toNumber(),
            shareDistribution: shares
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
function updateHistory(marketAddress, marketHash, fromBlock, toBlock, sampleCount, config) {
    config.batch = config.web3.createBatch();

    // Get market info
    var market = state.markets[marketAddress][marketHash];
    if (!market) {
        return new _promise2.default(function (resolve, reject) {
            reject("unknown market");
        });
    }
    var fromBlockCorrected = fromBlock + fromBlock % sampleCount;
    var toBlockCorrected = toBlock - toBlock % sampleCount;
    var blocksToSample = _lodash2.default.range(fromBlockCorrected, toBlockCorrected, Math.floor((toBlockCorrected - fromBlockCorrected) / sampleCount));

    blocksToSample[blocksToSample.length - 1] = toBlock;

    var samplePromises = blocksToSample.map(function (block) {
        return new _promise2.default(function (resolve, reject) {
            // Check if is currently on the state
            if (market.history[block]) {
                resolve(market.history[block]);
            } else {
                getSample(marketAddress, marketHash, block, config).then(function (sample) {
                    var newSample = { shareDistribution: sample.shareDistribution, timestamp: sample.timestamp };
                    market.history[block] = {};
                    (0, _assign2.default)(market.history[block], newSample);
                    resolve(newSample);
                }, function (error) {
                    console.error(error);
                    resolve();
                });
            }
        });
    });

    // After adding all request to the batcher, we execute them
    config.batch.execute();
    config.batch = config.web3.createBatch();

    return _promise2.default.all(samplePromises);
}

// export function updateBaseFee(config){
//     return new Promise((resolve, reject) => {
//         eventFactory.getBaseFee(config, promiseCallback(resolve, reject)).call();
//     });
// }

function buildState(config, creators, investors, tokenAddresses, marketAddresses) {
    if (!tokenAddresses) {
        tokenAddresses = [config.addresses.etherToken];
    }

    if (!marketAddresses) {
        marketAddresses = [config.addresses.defaultMarketFactory];
    }

    if (!creators) {
        creators = [config.account];
    }

    if (!investors) {
        investors = [config.account];
    }

    return (0, _co2.default)(_regenerator2.default.mark(function _callee() {
        var eventDescriptions, events, parallelUpdates;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return updateEventDescriptions(config);

                    case 2:
                        eventDescriptions = _context.sent;
                        _context.next = 5;
                        return updateEvents(config, creators, config.addressFilters.oracle);

                    case 5:
                        events = _context.sent;
                        parallelUpdates = [updateTokens(tokenAddresses, config), updateEventTokenShares(config.account, (0, _keys2.default)(state.events), config), updateBlocknumber(config)
                        // updateBaseFee(config),
                        ];

                        // Add market updates to parallelUpdates array

                        marketAddresses.map(function (marketAddress) {
                            parallelUpdates.push(updateMarkets(config, investors, marketAddress));
                        });

                        if (Array.isArray(config.additionalUpdates)) {
                            config.additionalUpdates.forEach(function (item) {
                                parallelUpdates.push(item());
                            });
                        }
                        _context.next = 11;
                        return parallelUpdates;

                    case 11:
                        state.transactions = loadTransactions(config);
                        state.config = config;

                        return _context.abrupt('return', state);

                    case 14:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));
}

function get(config) {
    state.config = config;
    if (state.config && state.config.persistTransactions && state.transactions == {}) {
        state.transactions = loadTransactions(config);
    }
    return state;
}
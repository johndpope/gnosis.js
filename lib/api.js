'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.createEvent = createEvent;
exports.subscribeOracleToEvent = subscribeOracleToEvent;
exports.postResult = postResult;
exports.updateResult = updateResult;
exports.reportResult = reportResult;
exports.getEvents = getEvents;
exports.createEventRevision = createEventRevision;
exports.getContracts = getContracts;
exports.getOracleDetails = getOracleDetails;
exports.addOnChainOracle = addOnChainOracle;
exports.updateOnChainOracle = updateOnChainOracle;
exports.addOffChainOracle = addOffChainOracle;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _helpers = require('./helpers');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* Creates event against Gnosis API
* @param event: event object with following params:
* required: title, description, resolutionDate and outcomes for discrete events
*           or unit and decimals for ranged events
* optional: imageEncoded, sourceURL, email
* @param oracleAddress: web3 account used to sign information
* @param config: config object
* @returns {axios.Promise}
*/

function createEvent(event, oracleAddress, config) {
    var url = config.gnosisServiceURL + 'event/';
    if (event.imageEncoded) {
        event.imageEncodedHash = config.web3.sha3(event.imageEncoded).slice(2);
    }

    var ids = (0, _helpers.getEventIdentifiers)(event);

    return new _promise2.default(function (resolve, reject) {
        if (event.fee) {
            return (0, _helpers.signOracleFee)(oracleAddress, ids.descriptionHash, event.fee, event.feeToken, config).then(resolve);
        } else {
            try {
                return (0, _helpers.signMsg)(oracleAddress, ids.descriptionJSON, config).then(resolve);
            } catch (e) {
                reject(e);
            }
        }
    }).then(function (eventSignature) {
        var payload = {
            email: event.email,
            descriptionJSON: ids.descriptionJSON,
            signature: {
                v: eventSignature.v,
                r: eventSignature.r.toString(10),
                s: eventSignature.s.toString(10),
                address: oracleAddress
            }
        };

        if (event.imageEncoded) {
            payload.imageEncoded = event.imageEncoded;
        }

        if (event.fee) {
            payload.fee = event.fee.toString(10);
            payload.feeToken = event.feeToken;
        }

        return _axios2.default.post(url, payload).catch(function (response) {
            console.error('Error while creating an event on the factserver!');
            console.log((0, _stringify2.default)(response.data));
            throw response;
        });
    });
}

/**
 * Adds the Oracle to the oracle subscritors collection of event with
 * respective description_hash
 * A new Oracle is registered if it is not stored yet
 * @param givenFee: bigNumber representing fee as wei
 * @param descriptionHash: 0x string
 * @param oracleAddress: web3 account used to sign data
 * @returns {axios.Promise}
 */
/**
 * Created by denisgranha on 11/4/16.
 */

function subscribeOracleToEvent(fee, feeToken, descriptionHash, oracleAddress, email, config) {
    var url = config.gnosisServiceURL + 'event/oracle/';
    return (0, _helpers.signOracleFee)(oracleAddress, descriptionHash, fee, feeToken, config).then(function (messageSignature) {
        var message = messageSignature.message;
        var v = messageSignature.v;
        var r = messageSignature.r;
        var s = messageSignature.s;
        var address = messageSignature.address;

        var payload = {
            signature: {
                v: v.toNumber(),
                r: r.toString(10),
                s: s.toString(10),
                address: oracleAddress
            },
            descriptionHash: descriptionHash,
            fee: fee.toString(10),
            feeToken: feeToken,
            email: email
        };

        return _axios2.default.post(url, payload).catch(function (response) {
            console.error('Error while subscribing oracle to event!');
            throw response;
        });
    });
}

/**
 * Post result for event with respective description_hash, signed by given
 * oracleAddress
 * Oracle must be subscribed to event
 * @param resultObject:
 * {
 *  "result": bigNumber,
 *  "publicationDate": date (optional), the date when result signature will be
 *  public
 *  "descriptionHash": string, hex string used to identify the event
 *  "email": email, (optional) email used to notify oracle about reports
 *  ""
 * @param oracleAddress: web3 account used to sign message
 * @returns {axios.Promise}
 */
function postResult(resultObject, oracleAddress, config) {
    var url = config.gnosisServiceURL + 'event/oracle/result/';
    return (0, _helpers.signWithDescription)(oracleAddress, resultObject.result, resultObject.descriptionHash, config).then(function (messageSignature) {
        var message = messageSignature.message;
        var v = messageSignature.v;
        var r = messageSignature.r;
        var s = messageSignature.s;
        var address = messageSignature.address;

        var payload = {
            signature: {
                v: v,
                r: r.toString(10),
                s: s.toString(10),
                address: oracleAddress
            },
            descriptionHash: resultObject.descriptionHash,
            result: resultObject.result.toString(10),
            publicationDate: resultObject.publicationDate,
            email: resultObject.email
        };

        return _axios2.default.post(url, payload).catch(function (response) {
            console.error('Error while publishing result!');
            throw response;
        });
    });
}

/**
 * Updates result for event with respective description_hash, signed by given
 * oracleAddress
 * Oracle must have resolved event before
 * @param resultObject:
 * {
 *  "result": bigNumber,
 *  "publicationDate": date (optional), the date when result signature will be
 *  public
 *  "descriptionHash": string, hex string used to identify the event
 *  "email": email, (optional) email used to notify oracle about reports
 *  ""
 * @param oracleAddress: web3 account used to sign message
 * @returns {axios.Promise}
 */
function updateResult(resultObject, oracleAddress, config) {
    var url = config.gnosisServiceURL + 'event/oracle/result/';
    return (0, _helpers.signWithDescription)(oracleAddress, resultObject.result, resultObject.descriptionHash, config).then(function (messageSignature) {
        var message = messageSignature.message;
        var v = messageSignature.v;
        var r = messageSignature.r;
        var s = messageSignature.s;
        var address = messageSignature.address;

        var payload = {
            signature: {
                v: v,
                r: r.toString(10),
                s: s.toString(10),
                address: oracleAddress
            },
            descriptionHash: resultObject.descriptionHash,
            result: resultObject.result.toString(10),
            publicationDate: resultObject.publicationDate,
            email: resultObject.email
        };

        return _axios2.default.put(url, payload).catch(function (response) {
            console.error('Error while updating result!');
            throw response;
        });
    });
}

/**
 * Reports the oracle that posted the result directly by email if there's
 * any error
 * @param report: String that represents the body of the message sent to the
 * oracle
 * @param descriptionHash: 0x string that identifies the event
 * @param oracleAddress: ethereum address of the oracle that posted the result
 * @param signerAddress: web3 account used to sign message
 * @returns {axios.Promise}
 */
function reportResult(report, descriptionHash, oracleAddress, signerAddress, config) {
    var url = config.gnosisServiceURL + 'event/oracle/result/report/';

    var payload = {
        descriptionHash: descriptionHash,
        report: report,
        oracleAddress: oracleAddress
    };

    return (0, _helpers.signFactserverPayload)(config.account, payload, config).then(function (signedPayload) {
        return _axios2.default.post(url, signedPayload).catch(function (response) {
            console.error('Error while reporting result!');
            throw response;
        });
    });
}

// /**
//  * Sends challenge for an outcome posted by an Oracle
//  * @param challenge
//  * @param oracleAddress
//  * @returns {axios.Promise}
//  */
// export function challengeOutcome(challenge, oracleAddress, config) {
//     const url = config.gnosisServiceURL + "event/oracle/challenge/";
//     return signFactserverPayload(oracleAddress, challenge, config)
//         .then((signedPayload) => {
//             return axios.post(url, signedPayload).catch((response) => {
//                 console.log(oracleAddress);
//                 console.log(JSON.stringify(response.data));
//                 console.error('Error while challenging result!');
//                 throw response;
//             });
//         });
// }
//
// /**
//  * Rejects existing challenge
//  * @param challenge
//  * @param oracleAddress
//  * @returns {axios.Promise}
//  */
// export function rejectChallenge(challenge, oracleAddress, config) {
//     const url = config.gnosisServiceURL + "event/oracle/challenge/reject/";
//     return signFactserverPayload(oracleAddress, challenge, config)
//         .then((signedPayload) => {
//             return axios.post(url, signedPayload).catch((response) => {
//                 console.error('Error while rejecting challenge!');
//                 throw response;
//             });
//         });
// }
//
// /**
//  * Oracle approves challenge to outcome and signs the new result
//  * @param challengeId
//  * @param descriptionHash
//  * @param result
//  * @param response
//  * @param oracleAddress
//  * @returns {axios.Promise}
//  */
// export function approveChallenge(challengeId, descriptionHash, result,
//                                  response, oracleAddress, config) {
//     const url = config.gnosisServiceURL + "event/oracle/challenge/approve/";
//
//     return signWithDescription(oracleAddress, result, descriptionHash, config)
//         .then((messageSignature) => {
//             const {message, v, r, s, address} = messageSignature;
//             const payload = {
//                 resultSignature: {
//                   v, r: r.toString(10),
//                   s: s.toString(10),
//                   address: oracleAddress
//                 },
//                 result: result,
//                 response: response,
//                 challengeId: challengeId
//             };
//
//             return signFactserverPayload(oracleAddress, payload, config)
//                 .then((signedPayload) => {
//                     return axios.post(url, signedPayload).catch((response) => {
//                         console.error('Error while approving challenge!');
//                         throw response;
//                     });
//                 });
//         });
// }


/**
 * Get all events from API, paginated.
 * @param config: config object
 * @param filters: query filters, available:
 * creator_address, oracle_addresses, resolution_date_gt, description_hashes,
 * include_whitelisted_oracles
 * @returns {axios.Promise}
 */
function getEvents(config, filters) {
    var url = config.gnosisServiceURL + 'events/';

    return _axios2.default.get(url, { params: filters }).catch(function (response) {
        console.error('Error while getting events!');
        throw response;
    });
}

/**
 * Store the given Event Revision on the factserver signed with the given oracleAddress
 * The Oracle is created if doesn't exist before posting revision.
 * @param revision: the event revision object
 * @param oracleAddress: web3 account used to sign data
 * @returns {axios.Promise}
 */
function createEventRevision(revision, oracleAddress, config) {

    var revisionJSON = {
        title: revision.title,
        description: revision.description,
        sourceURL: revision.sourceURL,
        resolutionDate: revision.resolutionDate,
        outcomes: revision.outcomes,
        unit: revision.unit,
        decimals: revision.decimals,
        nonce: revision.nonce,
        descriptionHash: revision.descriptionHash
    };

    if (revision.imageEncoded) {
        revisionJSON.imageEncodedHash = config.web3.sha3(revision.imageEncoded).slice(2);
    }

    var payload = {
        revisionJSON: (0, _stringify2.default)(revisionJSON)

    };

    if (revision.imageEncoded) {
        payload.imageEncoded = revision.imageEncoded;
    }

    return (0, _helpers.signMsg)(oracleAddress, payload.revisionJSON, config).then(function (revisionSignature) {
        payload.signature = {
            v: revisionSignature.v,
            r: revisionSignature.r.toString(10),
            s: revisionSignature.s.toString(10),
            address: oracleAddress
        };
        var url = config.gnosisServiceURL + 'event/revision/';

        return _axios2.default.post(url, payload).catch(function (response) {
            console.error('Error while creating an event revision on the factserver!');
            throw response;
        });
    });
}

/**
 * Get Contract and Account Addresses
 * @param filters: query filters, available:
 * oracle_addresses, include_whitelisted_contracts
 * @param config: config object
 * @returns {axios.Promise}
 */
function getContracts(filters, config) {
    return _axios2.default.get(config.gnosisServiceURL + 'addresses/', { params: filters });
}

/**
 * Get Oracle Details
 * @param config: config object
 * @param address: Oracle address
 * @returns {axios.Promise}
 */
function getOracleDetails(config, address) {
    return _axios2.default.get(config.gnosisServiceURL + 'oracle/' + address + '/');
}

/**
 * Register OnChainOracle on django API if address is available
 * @param oracle: oracle object data
 * @param offChainOracleAddress: off chain oracle used to sign message
 * @param config: config object
 * @returns {axios.Promise}
 */
function addOnChainOracle(oracle, offChainOracleAddress, config) {
    var url = config.gnosisServiceURL + "contract/on-chain-oracle/";

    return (0, _helpers.signFactserverPayload)(offChainOracleAddress, oracle, config).then(function (signedPayload) {
        return _axios2.default.post(url, signedPayload).catch(function (response) {
            console.error('Error while registering onchain oracle!');
            throw response;
        });
    });
}

/**
 * Updates OnChainOracle Data
 * @param oracle: oracle object data
 * @param offChainOracleAddress: off chain oracle used to sign message
 * @param config: config object
 * @returns {axios.Promise}
 */
function updateOnChainOracle(oracle, offChainOracleAddress, config) {
    var url = config.gnosisServiceURL + "contract/on-chain-oracle/";

    return (0, _helpers.signFactserverPayload)(offChainOracleAddress, oracle, config).then(function (signedPayload) {
        return _axios2.default.put(url, signedPayload).catch(function (response) {
            console.error('Error while updating onchain oracle!');
            throw response;
        });
    });
}

/**
 * Creates Off Chain Oracle on API
 * @param oracleAddress: web3 account used to sig message
 * @param config: config object
 * @returns {axios.Promise}
 */
function addOffChainOracle(oracle, oracleAddress, config) {
    var url = config.gnosisServiceURL + 'oracle/';
    return (0, _helpers.signFactserverPayload)(oracleAddress, oracle, config).then(function (signedPayload) {
        return _axios2.default.post(url, signedPayload).catch(function (response) {
            console.error('Error during oracle registration!');
            throw response;
        });
    });
}
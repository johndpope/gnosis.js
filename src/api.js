/**
 * Created by denisgranha on 11/4/16.
 */

import axios from 'axios';
import {
  getEventIdentifiers,
  signOracleFee,
  signWithDescription,
  getEthereumAddress,
  signFactserverPayload,
  signMsg
} from './helpers';
import _ from 'lodash';

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

export function createEvent(event, oracleAddress, config) {
    const url = config.gnosisServiceURL + 'event/';
    if(event.imageEncoded){
        event.imageEncodedHash = config.web3.sha3(event.imageEncoded).slice(2);
    }

    const ids = getEventIdentifiers(event);

    return new Promise((resolve, reject) => {
      if(event.fee){
        return signOracleFee(
          oracleAddress,
          ids.descriptionHash,
          event.fee,
          event.feeToken,
          config
        )
        .then(resolve);
      }
      else{
        try{
          return signMsg(oracleAddress, ids.descriptionJSON, config)
              .then(resolve);
        }
        catch(e){
          reject(e);
        }
      }
    }).then((eventSignature) => {
      let payload = {
        email: event.email,
        descriptionJSON: ids.descriptionJSON,
        signature: {
            v: eventSignature.v,
            r: eventSignature.r.toString(10),
            s: eventSignature.s.toString(10),
            address: oracleAddress
        }
      }

      if(event.imageEncoded){
          payload.imageEncoded = event.imageEncoded;
      }

      if(event.fee){
        payload.fee = event.fee.toString(10);
        payload.feeToken = event.feeToken;
      }

      return axios.post(url, payload).catch((response) => {
          console.error('Error while creating an event on the factserver!');
          console.log(JSON.stringify(response.data));
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
export function subscribeOracleToEvent(
  fee,
  feeToken,
  descriptionHash,
  oracleAddress,
  email,
  config
) {
    const url = config.gnosisServiceURL + 'event/oracle/';
    return signOracleFee(oracleAddress, descriptionHash, fee, feeToken, config)
        .then((messageSignature) => {
            const {message, v, r, s, address} = messageSignature;
            const payload = {
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

            return axios.post(url, payload).catch((response) => {
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
export function postResult(resultObject, oracleAddress, config) {
    const url = config.gnosisServiceURL + 'event/oracle/result/';
    return signWithDescription(
      oracleAddress,
      resultObject.result,
      resultObject.descriptionHash,
      config
    )
        .then((messageSignature) => {
            const {message, v, r, s, address} = messageSignature;
            const payload = {
                signature: {
                  v,
                  r: r.toString(10),
                  s: s.toString(10),
                  address: oracleAddress
                },
                descriptionHash: resultObject.descriptionHash,
                result: resultObject.result.toString(10),
                publicationDate: resultObject.publicationDate,
                email: resultObject.email
            };

            return axios.post(url, payload).catch((response) => {
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
export function updateResult(resultObject, oracleAddress, config) {
    const url = config.gnosisServiceURL + 'event/oracle/result/';
    return signWithDescription(
      oracleAddress,
      resultObject.result,
      resultObject.descriptionHash,
      config
    )
        .then((messageSignature) => {
            const {message, v, r, s, address} = messageSignature;
            const payload = {
                signature: {
                  v,
                  r: r.toString(10),
                  s: s.toString(10),
                  address: oracleAddress
                },
                descriptionHash: resultObject.descriptionHash,
                result: resultObject.result.toString(10),
                publicationDate: resultObject.publicationDate,
                email: resultObject.email
            };

            return axios.put(url, payload).catch((response) => {
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
export function reportResult(report, descriptionHash, oracleAddress,
  signerAddress, config) {
    const url = config.gnosisServiceURL + 'event/oracle/result/report/';

    const payload = {
        descriptionHash,
        report,
        oracleAddress
    };

    return signFactserverPayload(config.account, payload, config)
      .then((signedPayload) => {
        return axios.post(url, signedPayload).catch((response) => {
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
export function getEvents(config, filters) {
    const url = config.gnosisServiceURL + 'events/';

    return axios.get(url, {params: filters}).catch((response) => {
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
export function createEventRevision(revision, oracleAddress, config) {

    let revisionJSON = {
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

    if(revision.imageEncoded){
      revisionJSON.imageEncodedHash = config.web3.sha3(revision.imageEncoded).slice(2);
    }

    let payload = {
        revisionJSON: JSON.stringify(revisionJSON),

    };

    if(revision.imageEncoded){
      payload.imageEncoded = revision.imageEncoded;
    }

    return signMsg(oracleAddress, payload.revisionJSON, config)
        .then((revisionSignature) => {
            payload.signature = {
                v: revisionSignature.v,
                r: revisionSignature.r.toString(10),
                s: revisionSignature.s.toString(10),
                address: oracleAddress
            };
          const url = config.gnosisServiceURL + 'event/revision/';

          return axios.post(url, payload).catch((response) => {
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
export function getContracts(filters, config){
    return axios.get(config.gnosisServiceURL + 'addresses/', {params: filters});
}

/**
 * Get Oracle Details
 * @param config: config object
 * @param address: Oracle address
 * @returns {axios.Promise}
 */
export function getOracleDetails(config, address){
    return axios.get(config.gnosisServiceURL + 'oracle/'+ address + '/');
}

/**
 * Register OnChainOracle on django API if address is available
 * @param oracle: oracle object data
 * @param offChainOracleAddress: off chain oracle used to sign message
 * @param config: config object
 * @returns {axios.Promise}
 */
export function addOnChainOracle(oracle, offChainOracleAddress, config) {
    const url = config.gnosisServiceURL + "contract/on-chain-oracle/";

    return signFactserverPayload(offChainOracleAddress, oracle, config)
        .then((signedPayload) => {
            return axios.post(url, signedPayload).catch((response) => {
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
export function updateOnChainOracle(oracle, offChainOracleAddress, config){
    const url = config.gnosisServiceURL + "contract/on-chain-oracle/";

    return signFactserverPayload(offChainOracleAddress, oracle, config)
        .then((signedPayload) => {
            return axios.put(url, signedPayload).catch((response) => {
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
export function addOffChainOracle(oracle, oracleAddress, config) {
    const url = config.gnosisServiceURL + 'oracle/';
    return signFactserverPayload(oracleAddress, oracle, config)
        .then((signedPayload) => {
            return axios.post(url, signedPayload).catch((response) => {
                console.error('Error during oracle registration!');
                throw response;
            });
        });
}

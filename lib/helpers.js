'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

exports.signFactserverPayload = signFactserverPayload;
exports.outcomeIdentifier = outcomeIdentifier;
exports.getEventIdentifiers = getEventIdentifiers;
exports.signWithDescription = signWithDescription;
exports.signOracleFee = signOracleFee;
exports.signMsg = signMsg;
exports.outcomeHash = outcomeHash;
exports.decodeSignature = decodeSignature;
exports.encodeFeeSignatures = encodeFeeSignatures;

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _cryptoJs = require('crypto-js');

var _cryptoJs2 = _interopRequireDefault(_cryptoJs);

var _crypto = require('./lib/crypto');

var crypto = _interopRequireWildcard(_crypto);

var _hex = require('./lib/hex');

var hex = _interopRequireWildcard(_hex);

var _callbacks = require('./lib/callbacks');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by denisgranha on 8/4/16.
 */
function signFactserverPayload(oracleAddress, payload, config) {
    var message = (0, _stringify2.default)(payload);

    var messageHash = _cryptoJs2.default.SHA3(message, { outputLength: 256 }).toString(_cryptoJs2.default.enc.Hex);
    return new _promise2.default(function (resolve, reject) {
        config.web3.eth.sign(oracleAddress, messageHash, (0, _callbacks.promiseCallback)(resolve, reject));
    }).then(function (signature) {
        var decodedSignature = decodeSignature(signature);
        return new _promise2.default(function (resolve, reject) {
            resolve({
                signature: {
                    address: oracleAddress,
                    r: decodedSignature.r.toString(10),
                    s: decodedSignature.s.toString(10),
                    v: decodedSignature.v.toNumber()
                },
                message: message
            });
        });
    });
}

function outcomeIdentifier(eventHash, outcomeIndex) {
    return crypto.evmKeccak(eventHash, hex.encode(outcomeIndex, 8));
}

function getDescriptionJSON(event) {
    var data = {
        title: event.title,
        description: event.description,
        resolutionDate: event.resolutionDate,
        sourceURL: event.sourceURL,
        tags: event.tags
    };
    if (event.outcomes) {
        data.outcomes = event.outcomes;
    } else {
        data.unit = event.unit;
        data.decimals = event.decimals;
    }

    if (event.imageEncodedHash) {
        data.imageEncodedHash = event.imageEncodedHash;
    }

    return (0, _stringify2.default)(data);
}

function getEventIdentifiers(event) {
    var descriptionJSON = getDescriptionJSON(event);
    var descriptionHash = _cryptoJs2.default.SHA3(descriptionJSON, { outputLength: 256 });
    return {
        descriptionHash: '0x' + descriptionHash.toString(_cryptoJs2.default.enc.Hex),
        descriptionJSON: descriptionJSON
    };
}

/**
 * Generate the signed data expected by /api/event/oracle/result/ or fee
 * signatures.
 * The data is the uint256 fee/result followed by the v, r and s components of
 * a signature, which are 8, 256 and 256 bits, respectively.
 * The signature payload is the hash of the uint256 description hash
 * concatenated with the uint256 fee/result.
 */
function signWithDescription(oracleAddress, message, descriptionHash, config) {
    var hash = crypto.evmKeccak(descriptionHash, hex.encode(message, 256));

    return new _promise2.default(function (resolve, reject) {
        config.web3.eth.sign(oracleAddress, hash, (0, _callbacks.promiseCallback)(resolve, reject));
    }).then(function (signature) {
        var decodedSignature = decodeSignature(signature);
        return new _promise2.default(function (resolve, reject) {
            resolve((0, _assign2.default)({
                message: message,
                address: oracleAddress,
                descriptionHash: descriptionHash
            }, decodedSignature));
        });
    });
}

/**
* Generates the signature expected to subscribe an oracle to one concrete event.
* @param fee: bigNumber. Represents the fee oracle charges event creator for resolving
*       the event.
* @param feeToken: bigNumber|hexString. Token address used to charge oracle fees.
* @param descriptionHash: hexString. Hash that identifies the event description.
**/
function signOracleFee(oracleAddress, descriptionHash, fee, feeToken, config) {
    var feeHash = crypto.evmKeccak(descriptionHash, hex.encode(fee, 256), feeToken);

    return new _promise2.default(function (resolve, reject) {
        config.web3.eth.sign(oracleAddress, feeHash, (0, _callbacks.promiseCallback)(resolve, reject));
    }).then(function (signature) {
        var decodedSignature = decodeSignature(signature);
        return new _promise2.default(function (resolve, reject) {
            resolve((0, _assign2.default)({
                fee: fee,
                feeToken: feeToken,
                address: oracleAddress,
                descriptionHash: descriptionHash
            }, decodedSignature));
        });
    });
}

function signMsg(account, message, config) {
    var msgHash = '0x' + _cryptoJs2.default.SHA3(message, { outputLength: 256 }).toString(_cryptoJs2.default.enc.hex);

    return new _promise2.default(function (resolve, reject) {
        config.web3.eth.sign(account, msgHash, (0, _callbacks.promiseCallback)(resolve, reject));
    }).then(function (signature) {
        var decodedSignature = decodeSignature(signature);
        decodedSignature.address = account;
        return new _promise2.default(function (resolve, reject) {
            resolve(decodedSignature);
        });
    });
}

/**
 * Sign result outcome with the oracle private key
 */
function outcomeHash(descriptionHash, outcomeIndex) {
    return crypto.evmKeccak(descriptionHash, hex.encode(outcomeIndex, 256));
}

/**
 * Deconstruct signature returned by eth_sign
 * @param signature
 */
function decodeSignature(signature) {
    signature = signature.slice(2);
    return {
        r: new _bignumber2.default('0x' + signature.slice(0, 64)),
        s: new _bignumber2.default('0x' + signature.slice(64, 128)),
        v: new _bignumber2.default('0x' + signature.slice(128, 130))
    };
}

function encodeFeeSignatures(feeSignatures) {

    var validationData = _lodash2.default.flatten(feeSignatures.map(function (feeSignature, index) {
        if (index) {
            return [feeSignature.fee, new _bignumber2.default(feeSignature.feeToken), feeSignature.v, feeSignature.r, feeSignature.s];
        } else {
            return [new _bignumber2.default(feeSignature.descriptionHash), feeSignature.fee, new _bignumber2.default(feeSignature.feeToken), feeSignature.v, feeSignature.r, feeSignature.s];
        }
    }));

    // Pad all of the resolver data to 32 bytes. The function expects bytes,
    // so web3 would pad values on the right. ultimateOracle.isValidEvent
    // expects values padded on the left that it can just cast to uints and
    // addresses, so we must left pad them in advance.

    var validationDataBytes = validationData.map(function (int) {
        return hex.encode(int, 256);
    });

    return validationDataBytes;
}
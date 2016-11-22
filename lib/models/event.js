'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _eventFactory = require('../contracts/event-factory');

var eventFactory = _interopRequireWildcard(_eventFactory);

var _state = require('../state');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Event = function () {
    function Event(props, state) {
        (0, _classCallCheck3.default)(this, Event);

        (0, _assign2.default)(this, props);
        this.state = state;
    }

    (0, _createClass3.default)(Event, [{
        key: 'getEventDescription',
        value: function getEventDescription() {
            return this.state.eventDescriptions[this.descriptionHash];
        }
    }, {
        key: 'getMarkets',
        value: function getMarkets(marketContractAddress) {
            if (!marketContractAddress) {
                marketContractAddress = this.state.config.addresses.defaultMarket;
            }

            var markets = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(this.marketHashes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var marketHash = _step.value;

                    markets[marketHash] = this.state.markets[marketContractAddress][marketHash];
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return markets;
        }
    }, {
        key: 'getShares',
        value: function getShares() {
            // Get token address for each outcome
            var eventShares = [];
            for (var outcomeIndex = 0; outcomeIndex < this.outcomeCount; outcomeIndex++) {
                var tokenAddress = this.tokens[outcomeIndex];
                if (this.state.tokens[tokenAddress]) {
                    eventShares.push(this.state.tokens[tokenAddress]);
                }
            }

            return eventShares;
        }
    }, {
        key: 'getBalance',
        value: function getBalance() {
            return this.state.tokens[this.tokenAddress];
        }
    }, {
        key: 'buyAllOutcomes',
        value: function buyAllOutcomes(numShares, callback) {
            return eventFactory.buyAllOutcomes(this.eventHash, numShares, this.state.config, callback);
        }
    }, {
        key: 'redeemWinnings',
        value: function redeemWinnings(callback) {
            return eventFactory.redeemWinnings(this.eventHash, this.state.config, callback);
        }
    }, {
        key: 'sellAllOutcomes',
        value: function sellAllOutcomes(numShares, callback) {
            return eventFactory.sellAllOutcomes(this.eventHash, numShares, this.state.config, callback);
        }
    }, {
        key: 'update',
        value: function update() {
            return (0, _state.updateEvents)(this.state.config, null, this.resolverAddress, this.tokenAddress, [this.eventHash]);
        }
    }]);
    return Event;
}();

exports.default = Event;
module.exports = exports['default'];
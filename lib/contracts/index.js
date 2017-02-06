'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _eventFactory = require('./event-factory');

var eventFactory = _interopRequireWildcard(_eventFactory);

var _marketMaker = require('./market-maker');

var marketMaker = _interopRequireWildcard(_marketMaker);

var _oracle = require('./oracle');

var oracle = _interopRequireWildcard(_oracle);

var _ultimateOracle = require('./ultimate-oracle');

var ultimateOracle = _interopRequireWildcard(_ultimateOracle);

var _hunchGameToken = require('./hunch-game-token');

var hunchGameToken = _interopRequireWildcard(_hunchGameToken);

var _hunchGameMarketFactory = require('./hunch-game-market-factory');

var hunchGameMarketFactory = _interopRequireWildcard(_hunchGameMarketFactory);

var _marketFactory = require('./market-factory');

var marketFactory = _interopRequireWildcard(_marketFactory);

var _token = require('./token');

var token = _interopRequireWildcard(_token);

var _etherToken = require('./ether-token');

var etherToken = _interopRequireWildcard(_etherToken);

var _makerToken = require('./maker-token.js');

var makerToken = _interopRequireWildcard(_makerToken);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Created by denisgranha on 8/4/16.
 */

exports.default = { eventFactory: eventFactory, marketMaker: marketMaker, oracle: oracle, ultimateOracle: ultimateOracle,
  hunchGameToken: hunchGameToken, hunchGameMarketFactory: hunchGameMarketFactory, marketFactory: marketFactory, token: token, etherToken: etherToken, makerToken: makerToken };
module.exports = exports['default'];
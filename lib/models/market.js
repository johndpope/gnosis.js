'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _marketMaker = require('../contracts/market-maker');

var marketMaker = _interopRequireWildcard(_marketMaker);

var _marketFactory = require('../contracts/market-factory');

var marketFactory = _interopRequireWildcard(_marketFactory);

var _state = require('../state');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Market = function () {
	function Market(props, state, marketAddress) {
		(0, _classCallCheck3.default)(this, Market);

		(0, _assign2.default)(this, props);
		this.state = state;
		this.marketAddress = marketAddress;

		this.trend = this.getTrend();
	}

	(0, _createClass3.default)(Market, [{
		key: 'getEvent',
		value: function getEvent() {
			return this.state.events[this.eventHash];
		}
	}, {
		key: 'getShareDistributionAsBinaryOption',
		value: function getShareDistributionAsBinaryOption(outcome) {
			var otherOutcomesShares = new _bignumber2.default(0);
			for (var i = 0; i < this.shares.length; i++) {
				if (i != outcome) {
					otherOutcomesShares = otherOutcomesShares.plus(this.shares[i]);
				}
			}
			return [this.shares[outcome], otherOutcomesShares];
		}
	}, {
		key: 'isBinaryOption',
		value: function isBinaryOption() {
			return this.shares.length == 2;
		}

		// getTrend() {
		// 	// First we find the minimum difference between outcomes
		// 	let shares_sorted = this.shares.sort((a, b) => {
		// 		return a.comparedTo(b);
		// 	});
		//
		// 	let spread = shares_sorted[1].sub(shares_sorted[0]);
		// 	for (let i = 2; i != shares_sorted.length; i++) {
		// 		spread = BigNumber.min(spread, shares_sorted[i].sub(shares_sorted[i - 1]));
		// 	}
		// 	spread = spread.div(1000000000000000000);
		//
		// 	//then we give the spread a rating
		// 	let rating = 1;
		// 	if (spread.lessThan(5)) {
		// 		rating = 5;
		// 	} else if (spread.lessThan(10)) {
		// 		rating = 4;
		// 	} else if (spread.lessThan(20)) {
		// 		rating = 3;
		// 	} else if (spread.lessThan(30)) {
		// 		rating = 2;
		// 	} else if (spread.greaterThanOrEqualTo(30)) {
		// 		rating = 0.5;
		// 	}
		//
		// 	//Activity is the number of shares traded
		// 	let activity = new BigNumber(0);
		// 	this.shares.forEach(function(shareValue) {
		// 		activity = activity.add(shareValue);
		// 	});
		// 	activity = activity.sub(this.initialFunding).div(1000000000000000000);
		//
		// 	//Activity is multiplied by rating
		// 	let trend = activity.mul(rating);
		//
		// 	return trend;
		// }
		//

	}, {
		key: 'getTrend',
		value: function getTrend() {
			var sharesCopy = this.shares.slice(0);
			var shares_sorted = sharesCopy.sort(function (a, b) {
				return a.comparedTo(b);
			});

			var spread = shares_sorted[shares_sorted.length - 1].sub(shares_sorted[0]);

			//Activity is the number of shares traded
			var activity = new _bignumber2.default(0);
			sharesCopy.forEach(function (shareValue) {
				activity = activity.add(shareValue);
			});
			activity = activity.sub(this.initialFunding.mul(this.getEvent().outcomeCount));

			var trend = spread.eq(0) ? new _bignumber2.default('0') : activity.div(spread);

			return trend;
		}

		// market maker functions wrapper functions

	}, {
		key: 'calcCostsBuyingWithFee',
		value: function calcCostsBuyingWithFee(outcomeIndex, numShares, callback) {
			return marketMaker.calcCostsBuyingWithFees(this.marketHash, outcomeIndex, numShares, this.state.config, this.makerAddress, this.marketAddress, callback);
		}
	}, {
		key: 'calcEarningsSellingWithFees',
		value: function calcEarningsSellingWithFees(outcomeIndex, numShares, callback) {
			return marketMaker.calcEarningsSellingWithFees(this.marketHash, outcomeIndex, numShares, this.state.config, this.makerAddress, this.marketAddress, callback);
		}

		// market contract wrapper functions

	}, {
		key: 'buyShares',
		value: function buyShares(outcomeIndex, numShares, maxTotalPrice, callback) {
			return marketFactory.buyShares(this.marketHash, outcomeIndex, numShares, maxTotalPrice, this.state.config, this.marketAddress, callback);
		}
	}, {
		key: 'sellShares',
		value: function sellShares(outcomeIndex, numShares, minTotalPrice, callback) {
			return marketFactory.sellShares(this.marketHash, outcomeIndex, numShares, minTotalPrice, this.state.config, this.marketAddress, callback);
		}
	}, {
		key: 'withdrawFees',
		value: function withdrawFees(callback) {
			return marketFactory.withdrawFees(this.marketHash, this.state.config, this.marketAddress, callback);
		}
	}, {
		key: 'shortSellShares',
		value: function shortSellShares(outcomeIndex, numShares, moneyToEarn, callback) {
			return marketFactory.shortSellShares(this.marketHash, outcomeIndex, numShares, moneyToEarn, this.state.config, this.marketAddress, callback);
		}
	}, {
		key: 'update',
		value: function update() {
			return (0, _state.updateMarkets)(this.state.config, [this.investorAddress], this.marketAddress, [this.marketHash]);
		}
	}]);
	return Market;
}();

exports.default = Market;
module.exports = exports['default'];
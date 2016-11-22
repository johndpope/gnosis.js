'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcPrice = calcPrice;
exports.calcCostsBuying = calcCostsBuying;
exports.calcCostsBuyingWithFees = calcCostsBuyingWithFees;
exports.calcEarningsSelling = calcEarningsSelling;
exports.calcEarningsSellingWithFees = calcEarningsSellingWithFees;

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _eventFactory = require('./contracts/event-factory');

var eventFactory = _interopRequireWildcard(_eventFactory);

var _marketFactory = require('./contracts/market-factory');

var marketFactory = _interopRequireWildcard(_marketFactory);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ONE = new _bignumber2.default('0x10000000000000000');

function min(array) {
  var lowest = new _bignumber2.default(array[0]);
  for (var i = 1; i < array.length; i++) {
    if (array[i].lessThan(lowest)) {
      lowest = array[i];
    }
  }
  return lowest;
}

function max(array) {
  var highest = new _bignumber2.default(array[0]);
  for (var i = 1; i < array.length; i++) {
    if (array[i].greaterThan(highest)) {
      highest = array[i];
    }
  }
  return highest;
}

function e_exp(x) {
  var ln2 = new _bignumber2.default('0xb17217f7d1cf79ac');
  var y = x.mul(ONE).dividedToIntegerBy(ln2);
  var shift = new _bignumber2.default(2).toPower(y.dividedToIntegerBy(ONE));
  var z = y.modulo(ONE);
  var zpow = z;
  var result = ONE;
  result = result.plus(new _bignumber2.default('0xb172182739bc0e46').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x3d7f78a624cfb9b5').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0xe359bcfeb6e4531').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x27601df2fc048dc').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x5808a728816ee8').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x95dedef350bc9').mul(zpow).dividedToIntegerBy(ONE));
  result = result.plus(new _bignumber2.default('0x16aee6e8ef'));
  return shift.mul(result);
}

function floor_log2(x) {
  var y = new _bignumber2.default(x).dividedToIntegerBy(ONE);
  var lo = new _bignumber2.default(0);
  var hi = new _bignumber2.default(191);
  var mid = hi.add(lo).dividedToIntegerBy(2);
  while (!lo.add(1).equals(hi)) {
    if (y.lessThan(new _bignumber2.default(2).toPower(mid))) {
      hi = mid;
    } else {
      lo = mid;
    }
    mid = hi.add(lo).dividedToIntegerBy(2);
  }
  return lo;
}

function ln(x) {
  var log2e = new _bignumber2.default('0x171547652b82fe177');
  var ilog2 = floor_log2(x);
  var z = x.dividedToIntegerBy(new _bignumber2.default(2).toPower(ilog2));
  var zpow = ONE;
  var _const = ONE.mul(10);
  var result = _const;
  result = result.minus(new _bignumber2.default('0x443b9c5adb08cc45f').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0xf0a52590f17c71a3f').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new _bignumber2.default('0x2478f22e787502b023').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x48c6de1480526b8d4c').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new _bignumber2.default('0x70c18cae824656408c').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x883c81ec0ce7abebb2').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new _bignumber2.default('0x81814da94fe52ca9f5').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x616361924625d1acf5').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new _bignumber2.default('0x39f9a16fb9292a608d').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x1b3049a5740b21d65f').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new _bignumber2.default('0x9ee1408bd5ad96f3e').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x2c465c91703b7a7f4').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new _bignumber2.default('0x918d2d5f045a4d63').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x14ca095145f44f78').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new _bignumber2.default('0x1d806fc412c1b99').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new _bignumber2.default('0x13950b4e1e89cc').mul(zpow).dividedToIntegerBy(ONE));
  return ilog2.mul(ONE).plus(result).minus(_const).mul(ONE).dividedToIntegerBy(log2e);
}

function calcPrice(share_distribution, selected_outcome, initial_funding) {
  // invert share distribution
  share_distribution = share_distribution.slice(0);
  var max_shares = max(share_distribution);
  for (var i = 0; i < share_distribution.length; i++) {
    share_distribution[i] = share_distribution[i].mul(-1).plus(max_shares);
  }
  var b = initial_funding.dividedBy(Math.log(share_distribution.length).toString());
  var denominator = new _bignumber2.default(0);
  for (var _i = 0; _i < share_distribution.length; _i++) {
    denominator = denominator.plus(Math.exp(share_distribution[_i].dividedBy(b)).toString());
  }
  return new _bignumber2.default(Math.exp(share_distribution[selected_outcome].dividedBy(b)).toString()).dividedBy(denominator);
}

function calcC(inv_b, share_distribution, lowest_shares, highest_shares, initial_funding) {
  var inner_sum = new _bignumber2.default(0);
  for (var i = 0; i < share_distribution.length; i++) {
    inner_sum = inner_sum.plus(e_exp(highest_shares.minus(lowest_shares).minus(share_distribution[i].minus(lowest_shares)).dividedToIntegerBy(initial_funding.dividedToIntegerBy(10000)).mul(inv_b)));
  }
  return ln(inner_sum).mul(ONE).dividedToIntegerBy(inv_b);
}

function calcCostsBuying(initialFunding, shareDistribution, selectedOutcome, sharesWanted) {
  var shareDistributionCopy = shareDistribution.slice(0);
  var outcomeCount = new _bignumber2.default(shareDistributionCopy.length);
  var invB = ln(outcomeCount.mul(ONE)).dividedToIntegerBy(10000);
  var lowestShares = min(shareDistributionCopy);
  var highestShares = max(shareDistributionCopy);

  var c1 = calcC(invB, shareDistributionCopy, lowestShares, highestShares, initialFunding);
  shareDistributionCopy[selectedOutcome] = shareDistributionCopy[selectedOutcome].minus(sharesWanted);
  var c2 = calcC(invB, shareDistributionCopy, lowestShares, highestShares, initialFunding);
  // calculate costs
  var costs = c2.minus(c1).mul(initialFunding.dividedToIntegerBy(10000)).mul(new _bignumber2.default(100000).plus(2)).dividedToIntegerBy(100000).dividedToIntegerBy(ONE);
  if (costs.greaterThan(sharesWanted)) {
    return sharesWanted;
  }
  return costs;
}

function calcCostsBuyingWithFees(marketHash, initial_funding, share_distribution, selected_outcome, shares_wanted, config) {
  // get base fee
  eventFactory.calcBaseFeeForShares(shares_wanted, config).then(function (baseFee) {
    var costs = calcCostsBuying(initial_funding, share_distribution, selected_outcome, shares_wanted);
    return marketFactory.calcMarketFee(marketHash, costs, config, config.addresses.lmsrMarketMaker).then(function (marketFee) {
      return costs.plus(baseFee).plus(marketFee);
    });
  });
}

function calcEarningsSelling(initial_funding, share_distribution, selected_outcome, shares_wanted) {
  var share_distribution_copy = share_distribution.slice(0);
  var outcome_count = new _bignumber2.default(share_distribution_copy.length);
  var inv_b = ln(outcome_count.mul(ONE)).dividedToIntegerBy(10000);
  var lowest_shares = new _bignumber2.default(min(share_distribution_copy));
  var highest_shares = new _bignumber2.default(max(share_distribution_copy)).plus(shares_wanted);
  var c1 = calcC(inv_b, share_distribution_copy, lowest_shares, highest_shares, initial_funding);
  share_distribution_copy[selected_outcome] = share_distribution_copy[selected_outcome].plus(shares_wanted);
  var c2 = calcC(inv_b, share_distribution_copy, lowest_shares, highest_shares, initial_funding);
  // calculate costs with fees
  return c1.minus(c2).mul(initial_funding.dividedToIntegerBy(10000)).mul(new _bignumber2.default(100000).minus(2)).dividedToIntegerBy(100000).dividedToIntegerBy(ONE);
}

function calcEarningsSellingWithFees(marketHash, initial_funding, share_distribution, selected_outcome, shares_wanted, config) {
  var earnings = calcEarningsSelling(initial_funding, share_distribution, selected_outcome, shares_wanted);
  return marketFactory.calcMarketFee(marketHash, earnings, config, config.addresses.lmsrMarketMaker).then(function (marketFee) {
    return earnings.min(marketFee);
  });
}

// TODO calcSharesSellingWithFees
// TODO calcSharesBuyingWithFees
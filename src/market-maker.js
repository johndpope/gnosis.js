import BigNumber from 'bignumber.js';
import * as eventFactory from './contracts/event-factory';
import * as marketFactory from './contracts/market-factory';

const ONE = new BigNumber('0x10000000000000000');

function min(array) {
  let lowest = new BigNumber(array[0]);
  for (let i = 1; i < array.length; i++) {
    if (array[i].lessThan(lowest)) {
      lowest = array[i];
    }
  }
  return lowest;
}

function max(array) {
  let highest = new BigNumber(array[0]);
  for (let i = 1; i < array.length; i++) {
    if (array[i].greaterThan(highest)) {
      highest = array[i];
    }
  }
  return highest;
}

function e_exp(x) {
  const ln2 = new BigNumber('0xb17217f7d1cf79ac');
  const y = x.mul(ONE).dividedToIntegerBy(ln2);
  const shift = new BigNumber(2).toPower(y.dividedToIntegerBy(ONE));
  const z = y.modulo(ONE);
  let zpow = z;
  let result = ONE;
  result = result.plus(new BigNumber('0xb172182739bc0e46').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x3d7f78a624cfb9b5').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0xe359bcfeb6e4531').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x27601df2fc048dc').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x5808a728816ee8').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x95dedef350bc9').mul(zpow).dividedToIntegerBy(ONE));
  result = result.plus(new BigNumber('0x16aee6e8ef'));
  return (shift.mul(result));
}

function floor_log2(x) {
  const y = new BigNumber(x).dividedToIntegerBy(ONE);
  let lo = new BigNumber(0);
  let hi = new BigNumber(191);
  let mid = hi.add(lo).dividedToIntegerBy(2);
  while (!lo.add(1).equals(hi)) {
    if (y.lessThan(new BigNumber(2).toPower(mid))) {
      hi = mid;
    } else {
      lo = mid;
    }
    mid = hi.add(lo).dividedToIntegerBy(2);
  }
  return lo;
}

function ln(x) {
  const log2e = new BigNumber('0x171547652b82fe177');
  const ilog2 = floor_log2(x);
  const z = x.dividedToIntegerBy(new BigNumber(2).toPower(ilog2));
  let zpow = ONE;
  const _const = ONE.mul(10);
  let result = _const;
  result = result.minus(new BigNumber('0x443b9c5adb08cc45f').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0xf0a52590f17c71a3f').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new BigNumber('0x2478f22e787502b023').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x48c6de1480526b8d4c').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new BigNumber('0x70c18cae824656408c').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x883c81ec0ce7abebb2').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new BigNumber('0x81814da94fe52ca9f5').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x616361924625d1acf5').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new BigNumber('0x39f9a16fb9292a608d').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x1b3049a5740b21d65f').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new BigNumber('0x9ee1408bd5ad96f3e').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x2c465c91703b7a7f4').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new BigNumber('0x918d2d5f045a4d63').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x14ca095145f44f78').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.minus(new BigNumber('0x1d806fc412c1b99').mul(zpow).dividedToIntegerBy(ONE));
  zpow = zpow.mul(z).dividedToIntegerBy(ONE);
  result = result.plus(new BigNumber('0x13950b4e1e89cc').mul(zpow).dividedToIntegerBy(ONE));
  return ilog2.mul(ONE).plus(result).minus(_const).mul(ONE).dividedToIntegerBy(log2e);
}

export function calcPrice(share_distribution, selected_outcome, initial_funding) {
  // invert share distribution
  share_distribution = share_distribution.slice(0);
  const max_shares = max(share_distribution);
  for (let i = 0; i < share_distribution.length; i++) {
    share_distribution[i] = share_distribution[i].mul(-1).plus(max_shares);
  }
  const b = initial_funding.dividedBy(Math.log(share_distribution.length).toString());
  let denominator = new BigNumber(0);
  for (let i = 0; i < share_distribution.length; i++) {
    denominator = denominator.plus(Math.exp(share_distribution[i].dividedBy(b)).toString());
  }
  return new BigNumber(Math.exp(share_distribution[selected_outcome].dividedBy(b)).toString()).dividedBy(denominator);
}

function calcC(inv_b, share_distribution, lowest_shares, highest_shares, initial_funding) {
  let inner_sum = new BigNumber(0);
  for (let i = 0; i < share_distribution.length; i++) {
    inner_sum = inner_sum.plus(e_exp(
      highest_shares.minus(lowest_shares).minus(
        share_distribution[i].minus(lowest_shares)
      ).dividedToIntegerBy(initial_funding.dividedToIntegerBy(10000)).mul(inv_b)
    ));
  }
  return ln(inner_sum).mul(ONE).dividedToIntegerBy(inv_b);
}

export function calcCostsBuying(initialFunding, shareDistribution, selectedOutcome, sharesWanted){
  let shareDistributionCopy = shareDistribution.slice(0);
  const outcomeCount = new BigNumber(shareDistributionCopy.length);
  const invB = ln(outcomeCount.mul(ONE)).dividedToIntegerBy(10000);
  const lowestShares = min(shareDistributionCopy);
  const highestShares = max(shareDistributionCopy);

  const c1 = calcC(invB, shareDistributionCopy, lowestShares, highestShares, initialFunding);
  shareDistributionCopy[selectedOutcome] = shareDistributionCopy[selectedOutcome].minus(sharesWanted);
  const c2 = calcC(invB, shareDistributionCopy, lowestShares, highestShares, initialFunding);
  // calculate costs
  const costs = c2.minus(c1).mul(
    initialFunding.dividedToIntegerBy(10000)
  ).mul(
    new BigNumber(100000).plus(2)
  ).dividedToIntegerBy(100000).dividedToIntegerBy(ONE);
  if (costs.greaterThan(sharesWanted)) {
    return sharesWanted;
  }
  return costs;
}

export function calcCostsBuyingWithFees(marketHash, initial_funding, share_distribution, selected_outcome,
                                        shares_wanted, config) {
  // get base fee
  eventFactory.calcBaseFeeForShares(shares_wanted, config)
      .then((baseFee) => {
        let costs = calcCostsBuying(initial_funding, share_distribution, selected_outcome, shares_wanted);
        return marketFactory.calcMarketFee(marketHash, costs, config, config.addresses.lmsrMarketMaker)
          .then((marketFee) => {
              return costs.plus(baseFee).plus(marketFee);
          });
      });

}

export function calcEarningsSelling(initial_funding, share_distribution, selected_outcome, shares_wanted) {
  let share_distribution_copy = share_distribution.slice(0);
  const outcome_count = new BigNumber(share_distribution_copy.length);
  const inv_b = ln(outcome_count.mul(ONE)).dividedToIntegerBy(10000);
  const lowest_shares = new BigNumber(min(share_distribution_copy));
  const highest_shares = new BigNumber(max(share_distribution_copy)).plus(shares_wanted);
  const c1 = calcC(inv_b, share_distribution_copy, lowest_shares, highest_shares, initial_funding);
  share_distribution_copy[selected_outcome] = share_distribution_copy[selected_outcome].plus(shares_wanted);
  const c2 = calcC(inv_b, share_distribution_copy, lowest_shares, highest_shares, initial_funding);
  // calculate costs with fees
  return c1.minus(c2).mul(
    initial_funding.dividedToIntegerBy(10000)
  ).mul(
    new BigNumber(100000).minus(2)
  ).dividedToIntegerBy(100000).dividedToIntegerBy(ONE);
}

export function calcEarningsSellingWithFees(marketHash, initial_funding, share_distribution, selected_outcome,
                                            shares_wanted, config){
  let earnings = calcEarningsSelling(initial_funding, share_distribution, selected_outcome, shares_wanted);
  return marketFactory.calcMarketFee(marketHash, earnings, config, config.addresses.lmsrMarketMaker)
    .then((marketFee) => {
      return earnings.min(marketFee);
    });
}

// TODO calcSharesSellingWithFees
// TODO calcSharesBuyingWithFees

export function calcShares(tokens, outcomeIndex, shareDistributionRaw, initialFunding) {
  // TODO move this to index
  const maxShares = shareDistributionRaw.reduce((maximum, shareCount) => {
    return shareCount.greaterThan(maximum) ? shareCount : maximum;
  }, new BigNumber('0'));

  const shareDistribution = shareDistributionRaw.map((shareCount) => {
    return maxShares.minus(shareCount);
  });

  BigNumber.config({ ERRORS: false });
  const b = new BigNumber(initialFunding).div(Math.log(shareDistribution.length));

  const firstValue = shareDistribution.reduce( (summation, shareCount) => {
    return summation.plus(Math.exp(new BigNumber(shareCount).div(b).plus(new BigNumber(tokens).div(b).toNumber())));
  }, new BigNumber(0));

  const secondValue =
  shareDistribution.reduce( (summation, shareCount, index) => {
    let result = summation;
    if (index !== new BigNumber(outcomeIndex).toNumber()) {
      result = summation.plus(Math.exp(new BigNumber(shareCount).div(b.plus(new BigNumber(tokens).div(b))).toNumber()));
    }
    return result;
  }, new BigNumber(0));
  const thirdValue = firstValue.minus(secondValue);
  const numShares = b.mul(new BigNumber(Math.log(thirdValue.toNumber()))).minus(shareDistribution[outcomeIndex]).mul('0.999');
  return numShares;
}

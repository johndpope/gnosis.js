import BigNumber from 'bignumber.js';
import * as marketMaker from '../contracts/market-maker';
import * as marketFactory from '../contracts/market-factory';
import {updateMarkets} from '../state';
class Market {
	constructor(props, state, marketAddress) {
		Object.assign(this, props);
		this.state = state;
		this.marketAddress = marketAddress;

		this.trend = this.getTrend();
	}

	getEvent() {
		return this.state.events[this.eventHash];
	}

	getShareDistributionAsBinaryOption(outcome) {
		let otherOutcomesShares = new BigNumber(0);
		for(let i=0; i<this.shares.length; i++){
			if(i != outcome){
				otherOutcomesShares = otherOutcomesShares.plus(this.shares[i]);
			}
		}
		return [this.shares[outcome],  otherOutcomesShares];
	}

	isBinaryOption(){
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
	getTrend() {
		var sharesCopy = this.shares.slice(0);
		let shares_sorted = sharesCopy.sort((a, b) => {
			return a.comparedTo(b);
		});

		let spread = shares_sorted[shares_sorted.length-1].sub(shares_sorted[0]);


		//Activity is the number of shares traded
		let activity = new BigNumber(0);
		sharesCopy.forEach(function(shareValue){
			activity = activity.add(shareValue);
		});
		activity = activity.sub(this.initialFunding.mul(this.getEvent().outcomeCount));

		let trend = spread.eq(0)?new BigNumber('0'):activity.div(spread);

		return trend;
	}

	// market maker functions wrapper functions
	calcCostsBuyingWithFee(outcomeIndex, numShares, callback){
		return marketMaker.calcCostsBuyingWithFees(
			this.marketHash,
			outcomeIndex,
			numShares,
			this.state.config,
			this.makerAddress,
			this.marketAddress,
			callback);
	}

	calcEarningsSellingWithFees(outcomeIndex, numShares, callback){
		return marketMaker.calcEarningsSellingWithFees(
			this.marketHash,
			outcomeIndex,
			numShares,
			this.state.config,
			this.makerAddress,
			this.marketAddress,
			callback);
	}

	// market contract wrapper functions

	buyShares(outcomeIndex, numShares, maxTotalPrice, callback){
		return marketFactory.buyShares(
			this.marketHash,
			outcomeIndex,
			numShares,
			maxTotalPrice,
			this.state.config,
			this.marketAddress,
			callback
		);
	}

	sellShares(outcomeIndex, numShares, minTotalPrice, callback){
		return marketFactory.sellShares(
			this.marketHash,
			outcomeIndex,
			numShares,
			minTotalPrice,
			this.state.config,
			this.marketAddress,
			callback
		);
	}

	withdrawFees(callback){
		return marketFactory.withdrawFees(
			this.marketHash,
			this.state.config,
			this.marketAddress,
			callback
		);
	}

	shortSellShares(outcomeIndex, numShares, moneyToEarn, callback){
		return marketFactory.shortSellShares(
			this.marketHash,
			outcomeIndex,
			numShares,
			moneyToEarn,
			this.state.config,
			this.marketAddress,
			callback
		);
	}

	update(){
		return updateMarkets(
			this.state.config,
			[this.investorAddress],
			this.marketAddress,
			[this.marketHash]
		)
	}
}

export default Market

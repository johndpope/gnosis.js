import * as helpers from '../helpers';
import BigNumber from 'bignumber.js';
import * as eventFactory from '../contracts/event-factory';
import {updateEvents} from '../state';

class Event {
    constructor(props, state) {
        Object.assign(this, props);
        this.state = state;
    }

    getEventDescription() {
        return this.state.eventDescriptions[this.descriptionHash];
    }

    getMarkets(marketContractAddress) {
        if (!marketContractAddress) {
            marketContractAddress = this.state.config.addresses.defaultMarket;
        }

        let markets = {};
        for (let marketHash of this.marketHashes) {
            markets[marketHash] = this.state.markets[marketContractAddress][marketHash];
        }

        return markets;
    }

    getShares() {
        // Get token address for each outcome
        let eventShares = [];
        for (let outcomeIndex = 0; outcomeIndex < this.outcomeCount; outcomeIndex++) {
            let tokenAddress = this.tokens[outcomeIndex];
            if(this.state.tokens[tokenAddress]){
                eventShares.push(this.state.tokens[tokenAddress]);
            }
        }

        return eventShares;
    }

    getBalance() {
        return this.state.tokens[this.tokenAddress];
    }

    buyAllOutcomes(numShares, callback){
        return eventFactory.buyAllOutcomes(this.eventHash, numShares, this.state.config, callback);
    }

    redeemWinnings(callback){
        return eventFactory.redeemWinnings(this.eventHash, this.state.config, callback);
    }

    sellAllOutcomes(numShares, callback){
        return eventFactory.sellAllOutcomes(this.eventHash, numShares, this.state.config, callback);
    }

    update(){
      return updateEvents(
        this.state.config,
        null,
        this.resolverAddress,
        this.tokenAddress,
        [this.eventHash]
      )
    }
}

export default Event

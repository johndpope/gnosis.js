/**
 * Created by denisgranha on 8/4/16.
 */
import * as abi from '../abi';
import {requestWithBlockNumber} from '../lib/web3-batch';
import * as eventFactory from './event-factory';
import * as marketFactory from './market-factory';
import * as marketMaker from '../market-maker';
import {get} from '../state';

// if LMSR makerAddress
// use javascript implementation
export function calcCostsBuying(marketHash, initialFunding, shareDistribution,
  outcomeIndex, numberOfShares, config, ...args) {
    let callback = args.pop();
    let marketMakerAddress = args.pop();

    if(!marketMakerAddress){
        marketMakerAddress = config.addresses.defaultMarketMaker;
    }

    let contractInstance = config.web3.eth.contract(abi.marketMaker).at(marketMakerAddress);


    // If LMSR, do javascript call
    if(marketMakerAddress == config.addresses.lmsrMarketMaker){
        return {
            call: function(){
                callback(null, marketMaker.calcCostsBuying(initialFunding,
                  shareDistribution, outcomeIndex, numberOfShares)
                );
            }
        }
    }
    else{
        return requestWithBlockNumber(
            contractInstance.calcCostsBuying,
            marketHash,
            initialFunding,
            shareDistribution,
            outcomeIndex,
            numberOfShares,
            'latest',
            callback);
    }
}

export function calcCostsBuyingWithFees(marketHash, outcomeIndex, numberOfShares,
                                        config, ...args) {
    let callback = args.pop();
    let marketAddress = args.pop();
    let marketMakerAddress = args.pop();

    if(!marketMakerAddress){
        marketMakerAddress = config.addresses.defaultMarketMaker;
    }

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }

    return new Promise((resolve, reject) => {
        // get Market information initialFunding and shareDistribution
        // Try first to get it from the state
        let markets = get(config).markets;
        if(markets[marketAddress] && markets[marketAddress][marketHash]){
            let stateMarket = markets[marketAddress][marketHash];
            resolve(stateMarket);
        }
        else{
            // Get market info from blockchain
            marketFactory.getMarketsProcessed([marketHash], config, config.account, marketAddress)
                .then((marketsProcessed) => {
                    if(marketsProcessed.length){
                        resolve(marketsProcessed[0]);
                    }
                    else{
                        reject('market does not exist');
                    }
                });

        }
    }).then((marketObject) => {
      let initialFunding = marketObject.initialFunding;
      let shareDistribution = marketObject.shares;
      // get base fee
      return eventFactory.calcBaseFeeForShares(
        numberOfShares, config
      )
      .then((baseFee) => {
        return calcCostsBuying(marketHash, initialFunding, shareDistribution, outcomeIndex, numberOfShares,
          config, marketMakerAddress , (e, costs) => {
            return marketFactory.calcMarketFee(
              marketHash, costs, config, marketAddress
            )
            .then((marketFee) => {
              let costsWithFees = costs.plus(baseFee).plus(marketFee);
              if(callback){
                  callback(null, costsWithFees);
              }
              else{
                  return costsWithFees;
              }
            });
          }).call();
      });
    });

}

// if LMSR makerAddress
// use javascript implementation
export function calcEarningsSelling(marketHash, initialFunding,
  shareDistribution, outcome, numberOfShares, config, ...args) {
    let callback = args.pop();
    let marketMakerAddress = args.pop();

    if(!marketMakerAddress){
        marketMakerAddress = config.addresses.defaultMarketMaker;
    }

    let contractInstance = config.web3.eth.contract(abi.marketMaker).at(marketMakerAddress);

    if(marketMakerAddress == config.addresses.lmsrMarketMaker){
        return {
            call: function(){
                callback(null, marketMaker.calcEarningsSelling(initialFunding, shareDistribution, outcome, numberOfShares));
            }
        }
    }
    else{
        return requestWithBlockNumber(
            contractInstance.calcEarningsSelling,
            marketHash,
            initialFunding,
            shareDistribution,
            outcome,
            numberOfShares,
            'latest',
            callback);
    }
}

export function calcEarningsSellingWithFees(marketHash, outcomeIndex, numberOfShares, config,
                                            ...args){

    let callback = args.pop();
    let marketAddress = args.pop();
    let marketMakerAddress = args.pop();

    if(!marketMakerAddress){
        marketMakerAddress = config.addresses.defaultMarketMaker;
    }

    if(!marketAddress){
        marketAddress = config.addresses.defaultMarketFactory;
    }

    return new Promise((resolve, reject) => {
        // get Market information initialFunding and shareDistribution
        // Try first to get it from the state
        let markets = get(config).markets;
        if(markets[marketAddress] && markets[marketAddress][marketHash]){
            let stateMarket = markets[marketAddress][marketHash];
            resolve(stateMarket);
        }
        else{
            // Get market info from blockchain
            marketFactory.getMarketsProcessed([marketHash], config, config.account, marketAddress)
                .then((marketsProcessed) => {
                    if(marketsProcessed.length){
                        resolve(marketsProcessed[0]);
                    }
                    else{
                        reject('market does not exist');
                    }
                });

        }
    }).then((marketObject) =>
    {
        let initialFunding = marketObject.initialFunding;
        let shareDistribution = marketObject.shares;
        calcEarningsSelling(marketHash, initialFunding, shareDistribution, outcomeIndex, numberOfShares, config, marketMakerAddress,
            (e, earnings) => {
                marketFactory.calcMarketFee(marketHash, earnings, config, marketAddress)
                    .then((marketFee) => {
                        callback(null, earnings.minus(marketFee))
                    });
            }).call();
    });
}

// TODO calcSharesSellingWithFees
// TODO calcSharesBuyingWithFees

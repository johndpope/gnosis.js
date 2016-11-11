/**
 * Created by denisgranha on 13/4/16.
 */
import testrpcConfig from './config';
import gnosis from '../../src/';
import {expect} from 'chai';
import * as util from 'util';
import {exec} from 'child_process';
import BigNumber from 'bignumber.js';
import {promiseCallback} from '../../src/lib/callbacks';

describe('state', function runTests(){
    this.timeout(100000);
    let config;

    beforeEach( (done) => {
        return gnosis.config.initialize(testrpcConfig)
            .then((initializedConfig) =>
            {
                config = initializedConfig;
                const command = "node --require babel-register --require babel-polyfill stress_tests/create_events_and_buy_outcomes 1";
                const command_options = {cwd:  __dirname+"/../../"};
                exec(command, command_options, (e, out, eInfo) => {
                    if(e){
                      console.error(e, eInfo);
                    }
                    gnosis.state.reset();
                    done();
                });
            });
    });

    it('get State', () => {
        return gnosis.state.buildState(config).then((state) => {
            expect(state).to.be.a('object');
            // console.log(util.inspect(state, {showHidden: false, depth: null}));
            expect(state.eventDescriptions).to.be.a('object');
            expect(state).to.equal(gnosis.state.get(config));
            // 1 event description created
            expect(Object.keys(state.eventDescriptions).length).to.equal(1);
            // 1 event on chain
            expect(Object.keys(state.events).length).to.equal(1);
            // 1 market
            expect(Object.keys(state.markets).length).to.equal(1);
            expect(state.markets[config.addresses.defaultMarketFactory]).to.be.a('object');
            let market = state.markets[config.addresses.defaultMarketFactory][Object.keys(state.markets[config.addresses.defaultMarketFactory])[0]];
            expect(market).to.be.a('object');
            let sharesAsBinaryOption = market.getShareDistributionAsBinaryOption(0);
            expect(sharesAsBinaryOption).to.be.a('array');
            expect(sharesAsBinaryOption[0].eq(sharesAsBinaryOption[1])).to.be.true;
            // 3 tokens: etherToken + 2 outcome token
            expect(Object.keys(state.tokens).length).to.equal(3);
            let tokens = market.getEvent().tokens;
            expect(tokens.length).to.equal(2);
            expect(tokens[0]).to.be.a('string');
            expect(state.tokens[tokens[0]]).to.be.a('object');
            expect(state.tokens[tokens[1]]).to.be.a('object');
            let shares = market.getEvent().getShares();
            expect(shares).to.be.a('array');
            expect(shares.length).to.equal(2);
            expect(shares[0].value.eq(shares[1].value)).to.be.true;
        });
    });

    it('event wrapper function balance', () => {
        return gnosis.state.buildState(config).then((state) =>
        {
            expect(state).to.be.a('object');

            let event = state.events[Object.keys(state.events)];
            expect(event).to.be.a('object');

            let balance = event.getBalance();

            expect(balance.value.greaterThan(0)).to.be.true;

        });
    });

    it('event wrapper function get shares', () => {
        return gnosis.state.buildState(config).then((state) => {
            expect(state).to.be.a('object');

            let event = state.events[Object.keys(state.events)];
            expect(event).to.be.a('object');

            let shares = event.getShares();
            expect(shares).to.be.a('array');
            expect(shares[0].value.eq(shares[1].value)).to.be.true;
            expect(shares[0].value.greaterThan(0)).to.be.true;
        });
    });

    it('event wrapper function sell all outcomes', () => {
        return gnosis.state.buildState(config).then((state) => {
            expect(state).to.be.a('object');
            let event = state.events[Object.keys(state.events)[0]];
            expect(event).to.be.a('object');
            return new Promise((resolve, reject) => {
              gnosis.contracts.token.approve(
                event.tokenAddress,
                config.addresses.eventFactory,
                new BigNumber('1e10'),
                config,
                promiseCallback(resolve, reject));
            }).then((receipt) => {
              return new Promise((resolve, reject) => {
                event.buyAllOutcomes(new BigNumber('1e10'), promiseCallback(resolve, reject));
              });
            }).then((receipt) => {
                return event.sellAllOutcomes(new BigNumber('1e10'));
            }).then((result) => {                
            });

        });
    });

    it('event wrapper function redeem winnings', () => {
        return gnosis.state.buildState(config).then((state) => {
            expect(state).to.be.a('object');

            let event = state.events[Object.keys(state.events)];
            expect(event).to.be.a('object');

            return new Promise((resolve, reject) => {
              gnosis.contracts.token.approve(
                event.tokenAddress,
                config.addresses.eventFactory,
                new BigNumber('1e10'),
                config,
                promiseCallback(resolve, reject));
            }).then((receipt) => {
              return new Promise((resolve, reject) => {
                event.buyAllOutcomes(new BigNumber('1e10'), promiseCallback(resolve, reject));
              });
            }).then((receipt) => {
                // Set winning outcomes
                return new Promise((resolve, reject) =>
                {
                    gnosis.contracts.ultimateOracle.setOutcome(
                        event.eventIdentifier,
                        event.descriptionHash,
                        0,
                        config.account,
                        config,
                        promiseCallback(resolve, reject)
                    );
                });
            }).then((receipt) => {
                // Change testrpc timestamp
                return new Promise((resolve, reject) => {
                    const command = "node --require babel-register --require babel-polyfill examples/changeTimestamp";
                    const command_options = {cwd:  __dirname+"/../../"};
                    exec(command, command_options, promiseCallback(resolve, reject));
                });
            }).then((changedTimestamp) => {
                // Redeem Winnings
                return event.redeemWinnings()
                    .then((result) => {
                        expect(result.simulatedResult.greaterThan(0)).to.be.true;
                    });
            });

        });
    });

    it('market wrapper function calcCostBuyingWithFee and buy Shares', () => {
        return gnosis.state.buildState(config).then((state) =>
        {
            expect(state).to.be.a('object');

            let markets = state.markets[config.addresses.defaultMarketFactory];
            expect(markets).to.be.a('object');
            let marketHash = Object.keys(markets)[0];
            let market = markets[marketHash];
            expect(market).to.be.a('object');

            return new Promise((resolve, reject) => {
                market.calcCostsBuyingWithFee(
                  new BigNumber('0'),
                  new BigNumber('1e18'),
                  promiseCallback(resolve, reject)
                );
            }).then((costs) => {
                expect(costs.greaterThan(0)).to.be.true;
                return market.buyShares(new BigNumber('0'), new BigNumber('1e18'), costs);
            }).then((result) => {
                expect(result.simulatedResult.greaterThan(0)).to.be.true;
            });
        });
    });

    it('market wrapper function calcEarningsSellingWithFees and sellShares', () => {
        return gnosis.state.buildState(config).then((state) =>
        {
            expect(state).to.be.a('object');

            let markets = state.markets[config.addresses.defaultMarketFactory];
            expect(markets).to.be.a('object');
            let marketHash = Object.keys(markets)[0];
            let market = markets[marketHash];
            expect(market).to.be.a('object');
            let shares = market.getEvent().getShares();
            expect(shares).to.be.a('array');
            expect(shares.length).to.equal(2);

            return new Promise((resolve, reject) => {
                market.calcEarningsSellingWithFees(
                    new BigNumber('0'),
                    shares[0].value,
                    promiseCallback(resolve, reject)
                );
            }).then((earnings) => {
                expect(earnings.greaterThan(0)).to.be.true;
                return gnosis.contracts.token.approve(
                  market.getEvent().tokens[0],
                  market.marketAddress,
                  shares[0].value,
                  config
                )
                .then(function(result){
                  return market.sellShares(new BigNumber('0'), shares[0].value, earnings);
                });
            }).then((result) => {
                expect(result.simulatedResult.greaterThan(0)).to.be.true;
            })
        });
    });

    it('market wrapper function shortSellShares and withdrawFees', () => {
        return gnosis.state.buildState(config).then((state) => {
            expect(state).to.be.a('object');
            let markets = state.markets[config.addresses.defaultMarketFactory];
            expect(markets).to.be.a('object');
            let marketHash = Object.keys(markets)[0];
            let market = markets[marketHash];
            expect(market).to.be.a('object');

            return new Promise((resolve, reject) => {
                market.shortSellShares(
                    new BigNumber('0'),
                    new BigNumber('1e18'),
                    new BigNumber('1e5'),
                    promiseCallback(resolve, reject)
                );
            }).then((receipt) => {
                return market.withdrawFees();
            }).then((result) => {
                expect(result.simulatedResult.greaterThan(0)).to.be.true;
            });
        });
    });

    it('update event descriptions', () => {
      return gnosis.state.buildState(config).then((state) => {
          expect(state).to.be.a('object');
          let descriptionHashes = Object.keys(state.eventDescriptions);
          expect(descriptionHashes).to.be.a('array');
          expect(descriptionHashes.length).to.equal(1);
          let description = state.eventDescriptions[descriptionHashes[0]];
          expect(description).to.be.a('object');
          return description.update().then(() => {

          });
      });
    });

    it('update events', () => {
      return gnosis.state.buildState(config).then((state) => {
          expect(state).to.be.a('object');
          let eventHashes = Object.keys(state.events);
          expect(eventHashes).to.be.a('array');
          expect(eventHashes.length).to.equal(1);
          let event = state.events[eventHashes[0]];
          expect(event).to.be.a('object');
          return event.update().then(() => {

          });
      });
    });

    it('update markets', () => {
      return gnosis.state.buildState(config).then((state) => {
          expect(state).to.be.a('object');
          let marketHashes = Object.keys(
            state.markets[config.addresses.defaultMarketFactory]
          );

          expect(marketHashes).to.be.a('array');
          expect(marketHashes.length).to.equal(1);
          let market = state.markets[config.addresses.defaultMarketFactory][marketHashes[0]];
          expect(market).to.be.a('object');
          return market.update().then(() => {

          });
      });
    });
});

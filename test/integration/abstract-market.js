/**
 * Created by denisgranha on 8/4/16.
 */

import {expect} from 'chai';
import gnosis from '../../src/';
import testrpcConfig from './config';
import BigNumber from 'bignumber.js';
import {requestWithBlockNumber} from '../../src/lib/web3-batch';
import * as hex from '../../src/lib/hex';
import {promiseCallback} from '../../src/lib/callbacks';

const market = {
  fee: new BigNumber('0'),
  initialFunding: new BigNumber('1e19'),
  makerAddress: testrpcConfig.addresses.defaultMarketMaker
};

const testEvent = testrpcConfig.events[0];

// Event hash for event used on create.js tests
let eventHash;

describe('markets', function testSuite()
{
  let config;
  let marketHashes;
  let marketHash;
  this.timeout(40000);

  beforeEach(() => {
    return gnosis.config.initialize(
      testrpcConfig
    )
    .then((initializedConfig) =>
    {
      config = initializedConfig;
      let identifiers = gnosis.helpers.getEventIdentifiers(testEvent);
      return gnosis.helpers.signWithDescription(
        config.account,
        testEvent.fee,
        identifiers.descriptionHash,
        config
      )
      .then((feeData) => {
        expect(feeData).to.be.a('object');
        return new Promise((resolve, reject) => {
          gnosis.contracts.events.createOffChainEvent(
            testEvent,
            identifiers.descriptionHash,
            [feeData],
            config,
            promiseCallback(resolve, reject)
          );
        })
        .then((receipt) => {
          expect(receipt).to.be.a('object');

          return new Promise((resolve, reject) => {
            gnosis.contracts.events.getEventHashes(
              [identifiers.descriptionHash,],
              config,
              promiseCallback(resolve, reject)
            ).call();
          })
          .then((eventHashes) => {
            expect(eventHashes).to.be.a('array');
            expect(eventHashes.length).to.equal(3);
            eventHash = '0x'+eventHashes[eventHashes.length-1].toString(16);

            return new Promise((resolve, reject) => {
              gnosis.contracts.events.getEvent(
                eventHash,
                config,
                promiseCallback(resolve, reject)
              ).call();
            })
            .then((eventInfo) => {
              expect(eventInfo).to.be.a('array');
              // Create market
              return new Promise((resolve, reject) => {
                gnosis.contracts.market.createMarket(
                  market,
                  eventHash,
                  config,
                  promiseCallback(resolve, reject)
                );
              })
              .then((receipt) => {
                expect(receipt).to.be.a('object');
                return new Promise((resolve, reject) => {
                  gnosis.contracts.market.getMarketHashes(
                    [eventHash],
                    config,
                    null,
                    promiseCallback(resolve, reject)
                  ).call();
                })
                .then((result) => {
                  expect(result).to.be.a('array');
                  expect(result.length).to.equal(3);
                  expect(result[0]).to.be.a('object');
                  expect(result[0].toString(16)).to.be.a('string');
                  marketHashes = result;
                  marketHash = '0x' + result[result.length-1].toString(16);
                });
              });
            });
          });
        });
      });
    });
  });

  it('outcome identifier', () => {
      let identifier = gnosis.helpers
        .outcomeIdentifier(
          '0xed7102bbde47ebfd882c8d2cd9ad2ffe7dd09502c6ef9f3da9266b1a77caa553',
          0
        );
      expect(identifier).to.be.a('string');
      expect(identifier).to.equal(
        '0x11fc1fc9bff219a34bc7596d8b32c0f3b5884b200ca92c3123ab764f839df012'
      );
  });

  it('close market with callback', () => {
    return new Promise((resolve, reject) => {
     gnosis.contracts.market.closeMarket(
       marketHash,
       config,
       null,
       promiseCallback(resolve, reject)
     );
    })
    .then((receipt) => {
      expect(receipt).to.be.a('object');
    });
  });

  it('get market hashes unknown event', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.market.getMarketHashes(
        ['0xunknown'],
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(0);
    });
  });

  it('get markets from hashes', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.market.getMarket(
        marketHash,
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(new BigNumber(result[3]).greaterThan(0)).to.be.true;
      // Is the initial funding
    });
  });

  it('get shares distribution with timestamp', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.market.getShareDistributionWithTimestamp(
        marketHash,
        'latest',
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(3);
      expect(new Date(result[0].toString(10))).to.be.ok;
    });
  });

  it('get share distribution', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.market.getShareDistribution(
        marketHash,
        'latest',
        config,
        null,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((shareDistribution) => {
      expect(shareDistribution).to.be.a('array');
      expect(shareDistribution[0].greaterThan(0)).to.be.true;
    });
  });

  it('calc base fee', () => {
      return gnosis.contracts.events.calcBaseFeeForShares(
        new BigNumber('1e18'),
        config
      )
      .then((fee) => {
        expect(fee.toString(10)).to.equal('2004008016032064');
      });
  });

  it('buy shares', () => {
    return gnosis.contracts.events.calcBaseFee(
      new BigNumber('1e19'),
      config
    )
    .then((fee) => {
      let initialFunding = new BigNumber('1e19').minus(fee);
      return new Promise((resolve, reject) => {
        gnosis.contracts.marketMaker.calcCostsBuying(
          marketHash,
          initialFunding,
          [initialFunding, initialFunding],
          1,
          new BigNumber('1e18'),
          config,
          config.addresses.defaultMarketMaker,
          promiseCallback(resolve, reject)
        ).call();
      })
      .then((buyCost) => {
        expect(buyCost.greaterThan(0)).to.be.true;
        return gnosis.contracts.events.calcBaseFeeForShares(
          new BigNumber('1e18'),
          config
        )
        .then((fee) => {
          let maxPrice = fee.plus(buyCost);

          return gnosis.contracts.market.buyShares(
            marketHash,
            1,
            new BigNumber('1e18'),
            maxPrice,
            config
          )
          .then((result) => {
              expect(result).to.be.a('object');
              expect(new BigNumber(result.simulatedResult)
                .greaterThan(0)).to.be.true;
          });
        });
      });
    });
  });

  it('buy shares ether based event', () => {
    let descriptionHash = hex.encode(new BigNumber('123456'), 256);
    let etherEvent = {
      kind: 'discrete',
      descriptionHash,
      'fee': new BigNumber('0'),
      'outcomeCount': 2,
      'resolverAddress': config.addresses.ultimateOracle,
      'tokenAddress': config.addresses.etherToken
    };

    return gnosis.helpers.signWithDescription(
      config.account,
      etherEvent.fee,
      descriptionHash,
      config
    )
    .then((feeData) => {
      expect(feeData).to.be.a('object');
      let etherEventHash;

      return new Promise((resolve, reject) => {
        gnosis.contracts.events.createOffChainEvent(
          etherEvent,
          descriptionHash,
          [feeData],
          config,
          promiseCallback(resolve, reject)
        )
        .then((result) => {
          etherEventHash = result.simulatedResult;
        });
      })
      .then((receipt) => {
        return new Promise((resolve, reject) => {
          return gnosis.contracts.etherToken.buyTokens(
            new BigNumber('1e19').plus('1e18'),
            config,
            promiseCallback(resolve, reject)
          );
        })
        .then((receipt) => {
          return new Promise((resolve, reject) => {
            gnosis.contracts.abstractToken.approve(
              config.addresses.etherToken,
              config.addresses.marketSol,
              new BigNumber('1e19').plus('1e18'),
              config,
              promiseCallback(resolve, reject)
            );
          })
          .then((receipt) => {
            let etherMarketHash;
            // Using market.sol contract because hunchgame contract only
            // allows to create market with
            // Hunchgame Contract as currency address
            return new Promise((resolve, reject) => {
              gnosis.contracts.market.createMarket(
                market,
                etherEventHash,
                config,
                config.addresses.marketSol,
                promiseCallback(resolve, reject)
              ).then((result) => {
                  etherMarketHash = result.simulatedResult;
              });
            })
            .then((receipt) => {
                return gnosis.contracts.events.calcBaseFee(
                  new BigNumber('1e19'),
                  config
                )
                .then((fee) => {
                  let initialFunding = new BigNumber('1e19').minus(fee);

                  return new Promise((resolve, reject) => {
                    gnosis.contracts.marketMaker.calcCostsBuying(
                      etherMarketHash,
                      initialFunding,
                      [initialFunding, initialFunding],
                      1,
                      new BigNumber('1e18'),
                      config,
                      config.addresses.defaultMarketMaker,
                      promiseCallback(resolve, reject)
                    ).call();
                  })
                  .then((buyCost) => {
                    expect(buyCost.greaterThan(0)).to.be.true;
                    return gnosis.contracts.events.calcBaseFeeForShares(
                      new BigNumber('1e18'),
                      config
                    )
                    .then((fee) =>
                    {
                      let maxPrice = fee.plus(buyCost);
                      return gnosis.contracts.market.buyShares(
                        etherMarketHash,
                        1,
                        new BigNumber('1e18'),
                        maxPrice,
                        config,
                        config.addresses.marketSol,
                        null
                      )
                      .then((result) =>
                      {
                          expect(result).to.be.a('object');
                          expect(
                            new BigNumber(result.simulatedResult
                            ).greaterThan(0)).to.be.true;
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });


  it('buy 0 shares known market', () => {
    return gnosis.contracts.market.buyShares(
      marketHash,
      1,
      new BigNumber('0'),
      new BigNumber('0'),
      config
    )
    .catch(
      (error) =>
        {
            expect(error).to.be.ok;
        }
      );
  });

  it('buy shares unknown market', () => {

    return gnosis.contracts.market.buyShares(
      "0xf",
      new BigNumber('1'),
      new BigNumber('1e19'),
      new BigNumber('1e19'),
      config
    )
    .catch((error) => {
      expect(error).to.be.ok;
    });

  });

  it.only('sell shares, ok', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.events.permitPermanentApproval(
        config.addresses.defaultMarket,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) => {
      // Buy Shares before sell
      return gnosis.contracts.market.getMarketsProcessed(
        [marketHash],
        config,
        config.account,
        config.addresses.defaultMarket
      )
      .then((markets) =>
      {
        expect(markets).to.be.a('object');
        expect(Object.keys(markets).length).to.equal(1);
        let market = markets[marketHash];
        expect(market).to.be.a('object');

        return new Promise((resolve, reject) => {
          gnosis.contracts.marketMaker.calcCostsBuying(
              marketHash,
              market.initialFunding,
              market.shares,
              1,
              new BigNumber('1e20'),
              config,
              config.addresses.defaultMarketMaker,
              promiseCallback(resolve, reject)
            ).call();
        })
        .then((buyCost) =>
        {
          expect(buyCost.greaterThan(0)).to.be.true;
          return gnosis.contracts.events.calcBaseFeeForShares(
            new BigNumber('1e20'),
            config
          )
          .then((fee) => {
              var maxPrice = fee.plus(buyCost);

              return gnosis.contracts.market.buyShares(
                marketHash,
                1,
                new BigNumber('1e20'),
                maxPrice,
                config
              )
              .then((result) =>
              {
                expect(result).to.be.a('object');
                expect(new BigNumber(result.simulatedResult)
                  .greaterThan(0)).to.be.true;

                return new Promise((resolve, reject) => {
                  gnosis.contracts.market.getShareDistributionWithTimestamp(
                      marketHash,
                      'latest',
                      config,
                      null,
                      promiseCallback(resolve, reject)
                    ).call();
                })
                .then((shareDistributionT) =>
                {
                  var shareDistribution = [
                    shareDistributionT[1],
                    shareDistributionT[2]
                  ];
                  // Calc sell price
                  return new Promise((resolve, reject) => {
                    gnosis.contracts.marketMaker.calcEarningsSelling(
                      marketHash,
                      market.initialFunding,
                      shareDistribution,
                      1,
                      new BigNumber('1e20'),
                      config,
                      config.addresses.defaultMarketMaker,
                      promiseCallback(resolve, reject)
                    ).call();
                  })
                  .then((sellPrice) =>
                  {
                    expect(sellPrice.greaterThan(0)).to.be.true;
                    return gnosis.contracts.market.sellShares(
                        marketHash,
                        new BigNumber('1'),
                        new BigNumber('1e20'),
                        sellPrice,
                        config
                    )
                    .then((result) =>
                    {
                      console.log(result.simulatedResult);
                      expect(result.simulatedResult.greaterThan(0)).to.be.true;
                    });


                  });
                });
            });
          });
        });
      });
    });
  });



  it('close market', () => {
      return gnosis.contracts.market.closeMarket(
          marketHash,
          config)
          .then((result) => {
              expect(result).to.be.a('object');
              expect(result.simulatedResult).to.be.true;
          });
  });


  it('withdraw fees unknown market', () => {
      return gnosis.contracts.market.withdrawFees(
          marketHash+'8',
          config)
          .catch(
            (error) => {
                expect(error).to.be.ok;
            }
          );
  });

  it('withdraw 0 fees known market', () => {
      return gnosis.contracts.market.withdrawFees(
          marketHash,
          config)
          .catch(
            (error) => {
                expect(error).to.be.ok;
            }
          );
  });

  it('withdraw >0 fees known market', () => {
    const marketWithFee = {
      fee: new BigNumber('1e3'),
      initialFunding: new BigNumber('1e19'),
      makerAddress: testrpcConfig.addresses.defaultMarketMaker
    };

    return new Promise((resolve, reject) => {
      gnosis.contracts.market.closeMarket(
        marketHash,
        config,
        null,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) => {
      let marketWithFeeHash;

      return new Promise((resolve, reject) => {
        gnosis.contracts.market.createMarket(
          marketWithFee,
          eventHash,
          config,
          null,
          promiseCallback(resolve, reject)
        )
        .then((result) =>
        {
          expect(new BigNumber(result.simulatedResult)
            .greaterThan(0)).to.be.true;
          marketWithFeeHash = result.simulatedResult;
        });
      })
      .then((receipt) =>
      {
        return gnosis.contracts.market.shortSellShares(
          marketWithFeeHash,
          1,
          new BigNumber('1e19'),
          new BigNumber('50868806086513421'),
          config
        )
        .then((result) =>
        {
          expect(result.simulatedResult.greaterThan(0)).to.be.true;
          return gnosis.contracts.market.withdrawFees(
            marketWithFeeHash,
            config
          )
          .then((result) => {
              expect(result.simulatedResult.greaterThan(0)).to.be.true;
            });
          });

      });

    });
  });

  // it('short sell 0 shares', () => {}); // contract raises a throw statement

  // it('short sell shares unknown market', () => {}); // contract raises a throw statement



});

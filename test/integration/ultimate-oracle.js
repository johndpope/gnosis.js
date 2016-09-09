/**
 * Created by denisgranha on 6/6/16.
 */
import testrpcConfig from './config';
import gnosis from '../../src/';
import {expect} from 'chai';
import * as util from 'util';
import {exec} from 'child_process';
import BigNumber from 'bignumber.js';
import {promiseCallback} from '../../src/lib/callbacks';
import * as hex from '../../src/lib/hex';

describe('ultimate oracle', function runTests()
{
  this.timeout(80000);
  let config;
  let state;
  let descriptionHash;
  let eventIdentifier;

  beforeEach(() =>
  {
    return gnosis.config.initialize(
      testrpcConfig
    )
    .then((initializedConfig) =>
    {
      config = initializedConfig;
      const command = "node --require babel-register " +
      "--require babel-polyfill " +
      "stress_tests/create_events_and_buy_outcomes 1";

      const command_options = {cwd: __dirname + "/../../"};
      return new Promise((resolve, reject) => {
        exec(
          command,
          command_options,
          promiseCallback(resolve, reject)
        );
      })
      .then((out) =>
      {
        gnosis.state.reset();
        return gnosis.state.buildState(
          config
        )
        .then((build) =>
        {
          state = build;
          descriptionHash = Object.keys(state.eventDescriptions)[0];
          eventIdentifier = state.events[Object.keys(state.events)[0]]
            .eventIdentifier;
        });
      });
    });
  });

  it('getOracleOutcomes', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.ultimateOracle.getOracleOutcomes(
        [descriptionHash],
        [config.account],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((outcomes) => {
      expect(outcomes).to.be.a('array');
      expect('0x'+ outcomes[0].toString(16)).to.equal(descriptionHash);
      expect(outcomes[1].eq(0)).to.be.true;
      expect(outcomes[2].eq(0)).to.be.true;
      return new Promise((resolve, reject) => {
        gnosis.contracts.ultimateOracle.setOutcome(
          eventIdentifier,
          descriptionHash,
          new BigNumber('1000'),
          config.account,
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) => {
        expect(receipt).to.be.a('object');

        return new Promise((resolve, reject) => {
          return gnosis.contracts.ultimateOracle.getOracleOutcomes(
            [descriptionHash],
            [config.account],
            config,
            promiseCallback(resolve, reject)
          ).call();
        })
        .then((outcomes) => {
            expect(outcomes).to.be.a('array');
            expect('0x'+ outcomes[0].toString(16)).to.equal(descriptionHash);
            expect(outcomes[1].eq(0)).to.be.true;
            expect(outcomes[2].eq(1)).to.be.true;
            expect('0x' + outcomes[3].toString(16)).to.equal(config.account);
            expect(outcomes[4].greaterThan(0)).to.be.true;
            expect(outcomes[5].eq(1000)).to.be.true;
          });
        });
      });
  });

  it('getUltimateOutcomes, without winning outcomes', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.ultimateOracle.getUltimateOutcomes(
        [descriptionHash],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(6);
      expect(hex.encode(result[0], 256)).to.equal(descriptionHash);
      expect(result[1].eq(0)).to.be.true;
      expect(result[2].eq(0)).to.be.true;
      expect(result[3].eq(0)).to.be.true;
      expect(result[4].eq(0)).to.be.true;
      expect(result[5].eq(0)).to.be.true;
    });
  });

  it('challenge winning outcome', () => {
    return new Promise((resolve, reject) => {
      return gnosis.contracts.ultimateOracle.setOutcome(
        eventIdentifier,
        descriptionHash,
        new BigNumber('1'),
        config.account,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) => {
      expect(receipt).to.be.a('object');

      return gnosis.contracts.ultimateOracle.challengeWinningOutcome(
        descriptionHash,
        new BigNumber('0'),
        config
      )
      .then((result) => {
          expect(result.simulatedResult).to.be.true;
      })
    });
  });

  it('getShares without challenge', () => {
    return new Promise((resolve, reject) => {
      return gnosis.contracts.ultimateOracle.getShares(
        config.account,
        [descriptionHash],
        [new BigNumber('0'), new BigNumber('1')],
        config,
        promiseCallback(resolve, reject)
      ).call();
    })
    .then((result) => {
      expect(result).to.be.a('array');
      expect(result.length).to.equal(0);
    });
  });

  it('getShares', () => {
    return new Promise((resolve, reject) => {
      return gnosis.contracts.ultimateOracle.challengeWinningOutcome(
        descriptionHash,
        new BigNumber('0'),
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) =>
    {
      expect(receipt).to.be.a('object');
      return new Promise((resolve, reject) => {
        return gnosis.contracts.ultimateOracle.getShares(
          config.account,
          [descriptionHash],
          [new BigNumber('0'), new BigNumber('1')],
          config,
          promiseCallback(resolve, reject)
        ).call();
      })
      .then((result) =>
      {
        expect(result).to.be.a('array');
        expect(result.length).to.equal(4);
        expect('0x' + result[0].toString(16)).to.equal(descriptionHash);
        expect(result[1].eq(1)).to.be.true;
        expect(result[2].eq(0)).to.be.true;
        expect(result[3].eq(new BigNumber('1e20'))).to.be.true;
      });
    });
  });

  it('voteForUltimateOutcome', () => {
    return new Promise((resolve, reject) => {
      gnosis.contracts.ultimateOracle.setOutcome(
        eventIdentifier,
        descriptionHash,
        new BigNumber('1'),
        config.account,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) =>
    {
      return new Promise((resolve, reject) => {
        gnosis.contracts.ultimateOracle.challengeWinningOutcome(
          descriptionHash,
          new BigNumber('0'),
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) =>
      {
        expect(receipt).to.be.a('object');

        return gnosis.contracts.ultimateOracle.voteForUltimateOutcome(
          descriptionHash,
          new BigNumber('1'),
          new BigNumber('5000'),
          config
        )
        .then((result) =>
        {
          expect(result.simulatedResult).to.be.true;
        });
      });
    });
  });

  it('setUltimateOutcome after voting for Ultimate Outcome', () => {
    return new Promise((resolve, reject) => {
      return gnosis.contracts.ultimateOracle.setOutcome(
        eventIdentifier,
        descriptionHash,
        new BigNumber('1'),
        config.account,
        config,
        promiseCallback(resolve, reject)
      );
    })
    .then((receipt) =>
    {
      return new Promise((resolve, reject) => {
        return gnosis.contracts.ultimateOracle.challengeWinningOutcome(
          descriptionHash,
          new BigNumber('0'),
          config,
          promiseCallback(resolve, reject)
        );
      })
      .then((receipt) =>
      {
        expect(receipt).to.be.a('object');

        return new Promise((resolve, reject) => {
          return gnosis.contracts.ultimateOracle.voteForUltimateOutcome(
            descriptionHash,
            new BigNumber('1'),
            new BigNumber('5000'),
            config,
            promiseCallback(resolve, reject)
          );
        })
        .then((receipt) =>
        {
          expect(receipt).to.be.a('object');

          return new Promise((resolve, reject) => {
            config.web3.eth.getBlock(
              "latest",
              promiseCallback(resolve, reject)
            );
          })
          .then((response) =>
          {
            // console.log("Before change %s", response.timestamp);
            var futureTime = Math.ceil(response.timestamp + 60 * 60 * 24 * 365);

            return new Promise((resolve, reject) => {
              //change timestamp
              config.web3.currentProvider.sendAsync(
                {
                  jsonrpc: "2.0",
                  method: "evm_setTimestamp",
                  id: 12346,
                  params: [futureTime]
                },
                promiseCallback(resolve, reject)
              );
            })
            .then((changeT) =>
            {

              expect(changeT.result).to.be.true;
              return new Promise((resolve, reject) => {
                config.web3.currentProvider.sendAsync(
                  {
                    jsonrpc: "2.0",
                    method: "evm_mineBlocks",
                    id: 12346,
                    params: [1]
                  },
                  promiseCallback(resolve, reject)
                );
              })
              .then((mineBlocks) =>
              {
                expect(mineBlocks.result).to.be.true;

                return new Promise((resolve, reject) => {
                  gnosis.contracts.ultimateOracle.setUltimateOutcome(
                    descriptionHash,
                    config,
                    promiseCallback(resolve, reject)
                  );
                })
                .then((receipt) =>
                {
                    expect(receipt).to.be.a('object');
                    return new Promise((resolve, reject) => {
                      gnosis.contracts.ultimateOracle.getUltimateOutcomes(
                        [descriptionHash],
                        config,
                        promiseCallback(resolve, reject)
                      ).call();
                    })
                    .then((result) =>
                    {
                      expect(result).to.be.a('array');
                      expect(result.length).to.equal(6);
                      expect('0x' + result[0].toString(16)).to
                        .equal(descriptionHash);
                      expect(result[1].eq(1)).to.be.true;
                      expect(result[2].eq(0)).to.be.true;
                      expect(result[3].eq(0)).to.be.true;
                      expect(result[4].greaterThan(0)).to.be.true;
                      expect(result[5].eq(
                          new BigNumber('1e20').plus(new BigNumber('5000')
                          )
                      )).to.be.true;

                      return gnosis.contracts.ultimateOracle.withdraw(
                          descriptionHash,
                          config
                      )
                      .then((result) =>
                      {
                          expect(result.simulatedResult).to.be.true;
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
});

/**
 * Created by denisgranha on 8/4/16.
 */

import BigNumber from 'bignumber.js';
import Promise from 'bluebird';
import {expect} from 'chai';
import gnosis from '../../src/';
import * as hex from '../../src/lib/hex';
import _ from 'lodash';
import {promiseCallback} from '../../src/lib/callbacks';

import testrpcConfig from './config';

global.Promise = Promise;
// Use bluebird for better error logging during development.

let eventHash, descriptionHash;

describe('abstract resolver', function runTests() {
  this.timeout(30000);
  let config;
  let feeSignatures;

  beforeEach(() =>
  {
    return gnosis.config.initialize(
      testrpcConfig
    )
    .then((initializedConfig) =>
    {
      config = initializedConfig;

      let testEvent = testrpcConfig.events[0];
      let identifiers = gnosis.helpers.getEventIdentifiers(testEvent);
      descriptionHash = identifiers.descriptionHash;
      return gnosis.helpers.signOracleFee(
        config.account,
        identifiers.descriptionHash,
        testEvent.fee,
        testEvent.feeToken,
        config
      )
      .then((feeData) =>
      {
        feeSignatures = [feeData];
        expect(feeData).to.be.a('object');
      });
    });
  });

  describe('test Suite', () => {

    it('register event', () => {
      let eventData = gnosis.helpers.encodeFeeSignatures(feeSignatures);
      return gnosis.contracts.oracle.registerEvent(
        config.addresses.ultimateOracle,
        eventData,
        config
      ).then((result) =>
      {
        expect(result).to.be.a('object');
        expect(result.simulatedResult).to.be.a('string');
      });
    });

    it('isOutcomeSet', () => {
      let eventData = gnosis.helpers.encodeFeeSignatures(feeSignatures);
      return gnosis.contracts.oracle.registerEvent(
        config.addresses.ultimateOracle,
        eventData,
        config
      )
      .then((result) =>
      {
        let eventIdentifier = result.simulatedResult;
        return new Promise((resolve, reject) => {
          gnosis.contracts.oracle.isOutcomeSet(
            config.addresses.ultimateOracle,
            eventIdentifier,
            config,
            promiseCallback(resolve, reject)
          ).call();
        })
        .then((result) =>
        {
          expect(result).to.be.false;
        });
      });
    });

    it('setOutcome', () => {
      let eventData = gnosis.helpers.encodeFeeSignatures(feeSignatures);
      return gnosis.contracts.oracle.registerEvent(
        config.addresses.ultimateOracle,
        eventData,
        config
      ).then((result) =>
      {
          let eventIdentifier = result.simulatedResult;
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
            expect(receipt).to.be.a('object');
            //Get oracle Outcomes
            return new Promise((resolve, reject) => {
              return gnosis.contracts.ultimateOracle.getOracleOutcomes(
                [descriptionHash],
                [config.account],
                config,
                promiseCallback(resolve, reject)
              ).call();
            })
            .then((outcomes) =>
            {
              expect(outcomes).to.be.a('array');
              expect(outcomes[0].eq(new BigNumber(descriptionHash)))
                .to.be.true;
              expect(outcomes[1].eq(1)).to.be.true;
              expect(outcomes[2].eq(config.account)).to.be.true;
              expect(outcomes[3].greaterThan(0)).to.be.true;
              expect(outcomes[4].eq(1)).to.be.true;
              expect(outcomes[5].eq(0)).to.be.true;

              return new Promise((resolve, reject) => {
                config.web3.eth.getBlock(
                  "latest",
                  promiseCallback(resolve, reject)
                );
              })
              .then((response) =>
              {
                let currentTimestamp = response.timestamp;

                // console.log("Before change %s", currentTimestamp);
                var futureTime = Math.ceil(currentTimestamp + 60*60*48);
                return new Promise((resolve, reject) => {
                  //change timestamp
                  config.web3.currentProvider.sendAsync(
                    {
                      jsonrpc: "2.0",
                      method: "evm_increaseTime",
                      id: 12346,
                      params: [60*60*48]
                    },
                    promiseCallback(resolve, reject)
                  );
                })
                .then((changeT) =>
                {

                  return new Promise((resolve, reject) => {
                    config.web3.currentProvider.sendAsync(
                      {
                        jsonrpc: "2.0",
                        method: "evm_mine",
                        id: 12346,
                        params: []
                      },
                        promiseCallback(resolve, reject)
                      );
                  })
                  .then((mineBlocks) =>
                  {

                    return new Promise((resolve, reject) => {
                      config.web3.eth.getBlock(
                        "latest",
                        promiseCallback(resolve, reject)
                      );
                    })
                    .then((response) => {
                      // console.log("After change %s", response.timestamp);
                      // console.log("Difference %s", (response.timestamp-outcomes[3].toNumber())/(60*60));

                      expect(outcomes[3].lessThan(response.timestamp)).to.be.true;
                      return new Promise((resolve, reject) => {
                        gnosis.contracts.oracle.isOutcomeSet(
                          config.addresses.ultimateOracle,
                          eventIdentifier,
                          config,
                          promiseCallback(resolve, reject)
                        ).call();
                      })
                      .then((result) => {
                        expect(result).to.be.true;
                      });
                    });
                  });
                });
            });
          });
        });
      });
    });

    it('getOutcome', () => {
      let eventData = gnosis.helpers.encodeFeeSignatures(feeSignatures);
      return gnosis.contracts.oracle.registerEvent(
        config.addresses.ultimateOracle,
        eventData,
        config
      )
      .then((result) =>
      {
        let eventIdentifier = result.simulatedResult;

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
          expect(receipt).to.be.a('object');

          return new Promise((resolve, reject) => {
            config.web3.eth.getBlock(
              "latest",
              promiseCallback(resolve, reject)
            );
          })
          .then((response) => {
            // console.log("Before change %s", response.timestamp);
            var futureTime = Math.ceil(response.timestamp + 60*60*48*365);
            //change timestamp
            return new Promise((resolve, reject) => {
              config.web3.currentProvider.sendAsync(
                {
                  jsonrpc: "2.0",
                  method: "evm_increaseTime",
                  id: 12346,
                  params: [60*60*48]
                },
                promiseCallback(resolve, reject)
              );
            })
            .then((changeT) =>
            {

              return new Promise((resolve, reject) => {
                config.web3.currentProvider.sendAsync(
                  {
                    jsonrpc: "2.0",
                    method: "evm_mine",
                    id: 12346,
                    params: []
                  },
                  promiseCallback(resolve, reject)
                );
              })
              .then((mineBlocks) =>
              {
                return new Promise((resolve, reject) => {
                  gnosis.contracts.oracle.getOutcome(
                    config.addresses.ultimateOracle,
                    eventIdentifier,
                    config,
                    promiseCallback(resolve, reject)
                  ).call();
                })
                .then((result) =>
                {
                  expect(result.greaterThan(0)).to.be.true;
                });
              });
            });
          });
        });
      });
    });

    it('getOffChainFee', () => {
        let fee = gnosis.contracts.oracle.getOffChainFee(
            testrpcConfig.events[0].descriptionHash,
            feeSignatures);
        expect(fee.eq(testrpcConfig.events[0].fee)).to.be.true;
    });

    it('getFee', () => {
      let testEvent = testrpcConfig.events[0];
      return gnosis.helpers.signOracleFee(
        config.account,
        descriptionHash,
        testEvent.fee,
        testEvent.feeToken,
        config
      )
      .then((feeData) =>
      {
        feeSignatures = [feeData];
        let eventData = gnosis.helpers.encodeFeeSignatures(
          feeSignatures
        );

        return new Promise((resolve, reject) => {
          gnosis.contracts.oracle.getFee(
            config.addresses.ultimateOracle,
            eventData,
            config,
            promiseCallback(resolve, reject)
          ).call();
        })
        .then((fee) =>
        {
          expect(fee[0].eq(testrpcConfig.events[0].fee)).to.be.true;
        });
      });
    });
  });


});

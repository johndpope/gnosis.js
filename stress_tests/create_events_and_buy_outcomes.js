/**
 * Created by denisgranha on 15/4/16.
 */

import event from './eventFactory';
import gnosis from '../src';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

let times = (n) => {
    return (f, arg) => {
        return Array(n).fill().map((_, i) => f(arg));
    };
};

if (process.argv.length != 3){
    console.log("Please, provide the number of events you want to create\n");
}
else{
    console.log("Initializing\n");
    gnosis.config.initialize(
        {
          // Testrpc Configuration
          addresses: {
            // optional: Allows to do market operations without passing the market address
            defaultMarketFactory: '0x1ec884fd25e73edd024153e5ced3051738c8fd63',

            // optional: Allows calculating of share prices without passing the maker address
            defaultMarketMaker: '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',

            // obligatory
            etherToken: '0xb7ead0f8e08594b0337d4332554962b69a201cfc',

            // obligatory
            eventFactory: '0x31fd8a27f4abdbb74ad92539948cd69ef9fb88a7',

            // optional
            ultimateOracle: '0x56007b8be4abb5be643b38ed26307706d4c222f8',
            // optional
            lmsrMarketMaker: '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',

            hunchGameToken: '0xbf704508fa659f65aa86d05241aecb96d8cc74b3',

            hunchGameMarketFactory: '0x34634e55cb3fb8742ef4cfd2286ac916c921aded',
          },
          addressFiltersPostLoad: {
            marketMakers: ['0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a'],
            oracles: ['0x56007b8be4abb5be643b38ed26307706d4c222f8'],
            tokens: ['0xb7ead0f8e08594b0337d4332554962b69a201cfc', '0xbf704508fa659f65aa86d05241aecb96d8cc74b3'],
          },

          addressFilters: {
            // optional: Only loads events from blockchain, which are resolved by
            // given oracle
            oracle: '0x56007b8be4abb5be643b38ed26307706d4c222f8',            
          },
            gnosisServiceURL: 'http://127.0.0.1:8050/api/',
            ethereumNodeURL: 'http://127.0.0.1:8545',
            gethNode: false,
        }
    ).then((config) => {
            // We create n event objects where n passed as a command line argument
            let numEvents = Number(process.argv[2]);
            let events = times(numEvents)(event, config);
            console.log("Initialized\n");
            console.log("Creating events...\n");

            function processEvent(event){
                return new Promise((resolve, reject) =>
                {
                    gnosis.api.createEvent(event, config.account, config)
                        .then((response) => {
                            var identifiers = gnosis.helpers.getEventIdentifiers(event);
                            gnosis.helpers.signOracleFee(
                                config.account,
                                identifiers.descriptionHash,
                                event.fee,
                                event.feeToken,
                                config
                              )
                                .then((feeData) =>
                                {
                                  gnosis.contracts.etherToken.buyTokens(
                                    new BigNumber('1e21'),
                                    config,
                                    function(e, receipt){
                                      return gnosis.contracts.token.approve(
                                          config.addresses.etherToken,
                                          config.addresses.eventFactory,
                                          new BigNumber('1e21'),
                                          config,
                                          (e, receipt) => {
                                          // Set by promise returned by createEventOnChain
                                          let eventHash = null;
                                          gnosis.contracts.eventFactory.createOffChainEvent(
                                              event,
                                              identifiers.descriptionHash,
                                              [feeData],
                                              config,
                                              (e, receipt) =>
                                              {
                                                gnosis.contracts.eventFactory.buyAllOutcomes(
                                                  eventHash,
                                                  new BigNumber('1e19'),
                                                  config,
                                                  (e, receipt) =>
                                                  {
                                                    // Add fee to market
                                                    event.market.fee = new BigNumber('1e5');
                                                    // Create market
                                                    return gnosis.contracts.token.approve(
                                                        config.addresses.etherToken,
                                                        config.addresses.defaultMarketFactory,
                                                        new BigNumber('1e21'),
                                                        config,
                                                        (e, receipt) => {
                                                      gnosis.contracts.marketFactory.createMarket(
                                                          event.market,
                                                          eventHash,
                                                          config,
                                                          null,
                                                          (e, receipt) =>
                                                          {
                                                              resolve(event);
                                                          })
                                                          .then(function(correct){
                                                          }, reject);
                                                      });
                                                  }).catch(reject);
                                              }).then((result) =>
                                              {
                                                  eventHash = result.simulatedResult;
                                              }, reject);

                                              });
                                        });
                                });
                        });
                });
            }
            var promises = events.map(processEvent);

            Promise.all(promises).then((events) => {
                console.log("Created "+numEvents+" events succesfully both on API and blockchain\n");
                process.exit();
            },
                (error) => {
                    console.log(error);
                    process.exit(error);
                });
        },
        function(err){
            console.error(err);
            process.exit();
        });

}

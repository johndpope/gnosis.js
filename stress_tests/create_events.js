/**
 * Created by denisgranha on 1/4/16.
 */
import event from './eventFactory';
import gnosis from '../src';
import {waitForReceipt} from '../src/lib/transactions';
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
    console.log("Initializing hunchgame\n");
    gnosis.config.initialize(
      {
        web3: new Web3(
          new Web3.providers.HttpProvider("http://127.0.0.1:8545")
        ),
        addresses: {
          // optional: Allows to do market operations without passing the
          // market address
          defaultMarket: '0x0634e653ee7cc2a01efca45a6b5365d7c2911f31',

          // optional: Allows calculating of share prices without passing the
          // maker address
          defaultMarketMaker: '0x1ec884fd25e73edd024153e5ced3051738c8fd63',

          // obligatory
          etherToken: '0x1912f977d4ed325f145644a7151f410aed75c85b',

          // obligatory
          events: '0x4f4c243aa1a7f9ffb12cec09d9d6cb8b0130a8ae',
          
          // optional
          ultimateOracle: '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',
          // optional
          lmsrMarketMaker: '0x1ec884fd25e73edd024153e5ced3051738c8fd63',

          marketSol: '0x31fd8a27f4abdbb74ad92539948cd69ef9fb88a7'
        },
      }
    ).then((config) => {
        // We create n event objects where n passed as a command line argument
        let numEvents = Number(process.argv[2]);
        let events = times(numEvents)(event, config);
        console.log("Hunchgame Initialized\n");
        console.log("Creating events...\n");

        function processEvent(event){
          return new Promise((resolve, reject) => {
            gnosis.api.createEvent(
              event,
              config.account,
              config
            )
            .then((response) => {
                var identifiers = gnosis.helpers.getEventIdentifiers(event);
                gnosis.helpers.signWithDescription(
                  config.account,
                  event.fee,
                  identifiers.descriptionHash,
                  config
                )
                .then((feeData) => {
                  // Set by promise returned by createEventOnChain
                  let eventHash = null;
                  gnosis.contracts.events.createOffChainEvent(
                      event,
                      identifiers.descriptionHash,
                      [feeData],
                      config,
                      (e, receipt) =>
                      {
                          // Create market
                          gnosis.contracts.market.createMarket(
                              event.market,
                              eventHash,
                              config,
                              null,
                              (e, receipt) =>
                              {
                                  resolve(event);
                              });
                      }
                  ).then((result) =>
                  {
                      eventHash = result.simulatedResult;
                  }, reject);
                });
                });
          });
        }
        var promises = events.map(processEvent);

        Promise.all(promises).then((events) => {
            console.log("Created " + numEvents + " events succesfully both on API and blockchain\n");
            process.exit();
        },
          (error) => {
              console.error(error);
              process.abort();
          });
    },
    function(err){
        console.log(err);
    });

}

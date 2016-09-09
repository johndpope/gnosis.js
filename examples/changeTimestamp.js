/**
 * Created by denisgranha on 4/5/16.
 */
import gnosis from '../src/';
import Web3 from 'web3';

gnosis.config.initialize({
        web3: new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545")),
        addresses: {
            defaultMarket: '0x1ec884fd25e73edd024153e5ced3051738c8fd63',
            defaultMarketMaker: '0xd4762520d0bd6b4013fcd916a3b2995666eb3a4a',
            eventToken: '0x88b22026a774fce3f1b1ec29fc3c6e84fabc76d9',
            ultimateResolver: '0xb7ead0f8e08594b0337d4332554962b69a201cfc',
        },
    })
    .then((config) => {
        config.web3.eth.getBlock("latest", (e, response) => {
            var currentTimestamp = response.timestamp;

            // console.log("Before change %s", currentTimestamp);
            var futureTime = Math.ceil(currentTimestamp + 60 * 60 * 24 * 365);
            //change timestamp
            config.web3.currentProvider.sendAsync({
                    jsonrpc: "2.0",
                    method: "evm_setTimestamp",
                    id: 12346,
                    params: [futureTime]
                },
                (e, changeT) => {
                    config.web3.currentProvider.sendAsync({
                            jsonrpc: "2.0",
                            method: "evm_mineBlocks",
                            id: 12346,
                            params: [1]
                        },
                        (e, mineBlocks) => {
                            console.log("Timestamp succesfully increased");
                            process.exit();
                        });
                });
        });
    });
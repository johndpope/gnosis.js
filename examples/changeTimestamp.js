/**
 * Created by denisgranha on 4/5/16.
 * Change timestamp againts a TestRPC instance in localhost
 */
import gnosis from '../src/';
import Web3 from 'web3';

gnosis.config.initialize({
        web3: new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"))
    })
    .then((config) => {
        config.web3.eth.getBlock("latest", (e, response) => {
            var currentTimestamp = response.timestamp;

            // console.log("Before change %s", currentTimestamp);
            var futureTime = Math.ceil(currentTimestamp + 60 * 60 * 24 * 365);
            //change timestamp
            config.web3.currentProvider.sendAsync({
                    jsonrpc: "2.0",
                    method: "evm_increaseTime",
                    id: 12346,
                    params: [60 * 60 * 24 * 365]
                },
                (e, changeT) => {
                    config.web3.currentProvider.sendAsync({
                            jsonrpc: "2.0",
                            method: "evm_mine",
                            id: 12346,
                            params: []
                        },
                        (e, mineBlocks) => {
                            console.log("Timestamp succesfully increased");
                            process.exit();
                        });
                });
        });
    });

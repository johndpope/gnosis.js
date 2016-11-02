Integration Tests
=================

1. Run the API with Vagrant.
2. Run ethereumjs/testrpc.
3. Deploy the contracts.
```
   $ cd gnosis/contracts
   $ python deploy.py -f deploy.txt
```
4. Copy the deployed contract addresses into config.js, using config.js.example as
   an example.
5. Run `npm run integration-test`.

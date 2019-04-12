### Design pattern decisions

##### Decisions:
1. Resigned from using ABIEncoderV2, which has beeter arrays handling and retrurning strings.
Why? It is not production ready, still in testing phase and some bugs may appear. Like this one: https://blog.ethereum.org/2019/03/26/solidity-optimizer-and-abiencoderv2-bug/
2. Using SafeMath for computations just to make sure that no underflow or overflow will happen, even when it is adding one to existing variable.
3. Limited access to the crucial elements in contracts like toggleContractState for enabling circuit breaker. Access Restriction pattern.
4. Using good practices like proper contract structure, comments, ordering, logic separation, simple methods doing one thing at the time, the same compiler version through all the contract files. Also when address has been changed in MetaMask the page is reloaded.
5. Unit tests and reaching 100% of coverage both brach and instructions.
6. Upgradeable Proxy smart contract which uses delegatecall opcode to forward function calls to a target contract which can be updated.
This simple upgradable pattern gives opportunity to update logic in case of incident or new features appeared. There is also a thing
to remember that storage variables cannot be removed, but new ones may be added.
7. Data segregation which is connected with upgradable smart contract approach. App data is stored in a separate contract and build in conditions
where most recent version of DApp (logic) is allowed to modify that contract's state. Keeping storage as a separate contract after logic contract upgrade also known as a Eternal Storage pattern.
8. Avoid locking ether in a contract - done in proxy which has payable fallback function where someone can send ether, in such case owner can withdraw
these funds - one of issues found by Slither at the development stage.
9. Checking all the inputs, and verifying state of the contract to progress. Guard Check pattern.
10. Secure ether transfer in proxy contract using transfer instruction.
11. Emergency stop or Circuit breaker as an option to disable contract functionality in case of an urgency.
12. Events used to monitor contract activity.
13. Using default solidity compiler which comes with truffle framework just to make sure that no more configuration is necessary, and to run in quicker.

I think that all the design patterns that were used here, considering business logic for this application,
are good enough to think that this contracts can be used on the mainnet and won't cause any damage or loss to users.

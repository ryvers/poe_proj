### Avoiding common attacks

##### What has been done:
- Going through automatic smart contract checkers and their suggestions according to the developed contracts, Remix, SmartCheck, MythX Plugin for Truffle, Slither used.
- Applying coding standards
- Using community checked contracts like Ownable or SafeMath, or patterns like upgradeability via proxy.
- Peer audit/review just to clarify idea and looking for a bugs or potential issues
- Introduce idea of contract owner or admin just to limit the access to special functionalities like circuit breaker, Access Restriction pattern
- Limiting user input some of the variables are limitted automatically beacuse they have a limited space but I've used bytes which can handle much bigger structure than bytes32, so that's why I decided to check for ipfs hash length just to prevent user from adding too big text or invalid input. Require statements.
- Avoid locking ether in a contract - done in proxy which has payable fallback function where someone can send ether, in such case owner can withdraw
these funds.
- Reserving separate time and considering all the known issues (Ethernaut tasks treated as a checklist & https://consensys.github.io/smart-contract-best-practices/known_attacks/) in accordance with developed contracts
- Analysis of business logic in application with full coverage through unit testing.

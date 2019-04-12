-----------------------------------------------------
## Proof of Existence dApp
-----------------------------------------------------

### Project Description:
This application allows users to prove existence of some information stored and represented by files (pictures, sound, text files etc), showing timestamped files with other useful information which can help determine the owner or files associated with an address. Web app allows for uploading new files from device or taking picture via photo camera. Such object is then send to the smart contract (save details about file) and IPFS for permanent storage.

### Technical Overview:
This decentralized application consits of :
- Client (web app) which allows for adding new files to decentralized system but also for searching these files.
- Smart Contract which bahaves as a register for files and additional information about owner, time etc.
- IPFS which acts as a hard drive or database for files
- Tests which covers all the functionalities in smart contracts

### Technologies used:
---
- Ethereum blockchain (Ganache-cli, test networks)
- Solidity, Vyper
- Truffle, web3.js
- Chai, Mocha
- React, Rimble-ui
- Javascript,
- HTML5, CSS3

### Installation:
---

#### Prerequisities:
Make sure that you have truffle, ganache-cli and IPFS installed globally on your working environment.
IPFS and ganache-cli should work on `127.0.0.1` IP address, which is their default configuration.
I won't provide detailed instruction for it but you can easily find instructions or tutorials (like these below) on the internet.
https://truffleframework.com/docs/truffle/getting-started/installation
https://nethereum.readthedocs.io/en/latest/ethereum-and-clients/ganache-cli/
https://github.com/ipfs/go-ipfs#install

#### Running local development environment
1. Run ganache-cli in terminal or CLI to setup local & private blockchain, leave it running
2. In another terminal, start your IPFS node, if you are well prepared command: `ipfs daemon` should be enough, leave it running
3. In another terminal, clone repo
4. Enter the main folder and run command: `npm install`
5. Run `truffle compile`
6. Run `truffle migrate`
7. Run `truffle test`
8. Enter client folder with command : `cd client`
9. Run command: `npm install`
10. Run command: `npm start` - this will bring up PoE DApp

#### Additional considerations:
- default configuration assumes that every element of this application is working with its default setup like port or address, mostly 127.0.0.1
- you can configure IPFS node for PoE DApp, config is stored in client folder
- camera works only for secure origins (see: https://goo.gl/Y0ZkNV), with default configuration like localhost there is no issue
- there is a vyper contract which is PoE implementation without upgradeability feature

#### Troubleshooting:
- make sure that you are connected with your MetaMask to the right network, make sure that you compiled contracts for the network specified
- it is possible (if you are doing it for the first time) that IPFS needs additional CORS configuration which can be handled with these two instructions run in terminal:
```
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'
```
- application works with mobile browsers/wallets which are web3 enabled (i.e. imStatus), but you have to change configuration of the client and ipfs address to have full functionality.
Such ipfs configuration might be useful but it is not recommended to use it on production environment:
```
ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080
```

#### Useful links:
1. https://blog.trailofbits.com/2018/10/19/slither-a-solidity-static-analysis-framework/
2. https://github.com/ethereum/wiki/wiki/Ethereum-Natural-Specification-Format
3. https://github.com/ConsenSys/smart-contract-best-practices/blob/master/docs/recommendations.md
4. https://consensys.github.io/smart-contract-best-practices/

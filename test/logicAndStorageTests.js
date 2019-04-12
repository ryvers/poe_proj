const ProxyPoe = artifacts.require("ProxyPoe");
const LogicPoe = artifacts.require("LogicPoe");
LogicPoe.numberFormat = 'String';
ProxyPoe.numberFormat = 'String';
const truffleAssert = require('truffle-assertions');
const assert = require("chai").assert;
const moment = require("moment");
const ethUtil = require('ethereumjs-util');

/// @notice helper method which converts string to bytes
function stringToBytes(text) {
    return web3.utils.utf8ToHex(text);
}

/// @notice helper method which convers bytes to string
function bytesToString(bytes) {
    return web3.utils.hexToUtf8(bytes);
}

/// @notice helper function which computes contract address before transaction execution
async function precomputeContractAddress(deployer) {
    const currentNonce = await web3.eth.getTransactionCount(deployer);
    const futureAddress = ethUtil.bufferToHex(ethUtil.generateAddress(deployer, currentNonce));
    return futureAddress;
}

/// @notice These tests cover main functionalities for proxy and logic ProofOfExistence contracts
/// Starting with adding through getting information about files to
/// validations and circuit breaker which should stop contract in a way that
/// none else can interact (change state) with the contract
contract("LogicPoe", function(accounts) {
    var proxyPoeContract, logicPoeContract, logic;
    var zeroAddress = "0x0000000000000000000000000000000000000000";

    /// @notice prepares new set of contracts before each test
    beforeEach('Setup', async () => {
        proxyPoeContract = await ProxyPoe.new();
        logicPoeContract = await LogicPoe.new();
        await proxyPoeContract.upgradeTo(logicPoeContract.address, {from: accounts[0]});
        logic = await LogicPoe.at(proxyPoeContract.address);
    });

    describe("Logic & Storage via proxy", function() {
        describe("Adding files", function() {
            it('Should store file info in contract', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);
                const tx = await logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress});

                //then
                truffleAssert.eventEmitted(tx, 'FileAdded', (ev) => {
                    return bytesToString(ev.ipfsHash) === ipfsAddr &&
                        bytesToString(ev.fileHash) === file &&
                        bytesToString(ev.tags) === tags &&
                        ev.dateAdded === dateAdded.toString() &&
                        ev.owner === userAddress;
                }, "Incorrect event parameters read");
            });

            it('Should store my file info in contract', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);
                const tx = await logic.addMyFile(dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress});

                //then
                truffleAssert.eventEmitted(tx, 'FileAdded', (ev) => {
                    return bytesToString(ev.ipfsHash) === ipfsAddr &&
                        bytesToString(ev.fileHash) === file &&
                        bytesToString(ev.tags) === tags &&
                        ev.dateAdded === dateAdded.toString() &&
                        ev.owner === userAddress;
                }, "Incorrect event parameters read");
            });

            it('Should store someones\' file info in contract submitted by other', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[1];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);
                const tx = await logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: accounts[0]});

                //then
                truffleAssert.eventEmitted(tx, 'FileAdded', (ev) => {
                    return bytesToString(ev.ipfsHash) === ipfsAddr &&
                        bytesToString(ev.fileHash) === file &&
                        bytesToString(ev.tags) === tags &&
                        ev.dateAdded === dateAdded.toString() &&
                        ev.owner === userAddress;
                }, "Incorrect event parameters read");
            });

            it('Should not add file to contract when userAddress not passed', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);

                await truffleAssert.fails(
                    logic.addFile(zeroAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: accounts[0]}),
                    //then
                    truffleAssert.ErrorType.REVERT,
                    "User Address cannot be empty"
                );
            });

            it('Should not add file to contract when ipfsHash is empty', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr + "XXX");
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);

                await truffleAssert.fails(
                    logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress}),
                    //then
                    truffleAssert.ErrorType.REVERT,
                    "IPFS address is not valid or empty"
                );
            });

            it('Should not add file to contract when ipfsHash is too long', async () => {
                //given
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes("");
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);

                await truffleAssert.fails(
                    logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress}),
                    //then
                    truffleAssert.ErrorType.REVERT,
                    "IPFS address is not valid or empty"
                );
            });

            it('Should not add file to contract when fileHash not passed', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes("");
                const tagsbytes32 = stringToBytes(tags);

                await truffleAssert.fails(
                    logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress}),
                    //then
                    truffleAssert.ErrorType.REVERT,
                    "File hash cannot be empty"
                );
            });

            it('Should not add file to contract when dateAdded is zero', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = 0;
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);

                await truffleAssert.fails(
                    logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress}),
                    //then
                    truffleAssert.ErrorType.REVERT,
                    "Date Added has to be greater than 0"
                );
            });

            it('Should not add file which already exists in contract', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);

                await logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress}),
                await truffleAssert.fails(
                    logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: accounts[0]}),
                    //then
                    truffleAssert.ErrorType.REVERT,
                    "File hash exists in contract"
                );
            });
        });

        describe("Getting files", function() {
            it('Should get details of the file', async() => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);
                await logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress});

                //when
                const response = await logic.fileDetails(filebytes32);
                //then
                assert.equal(userAddress, response.holder)
                assert.equal(ipfsAddr, bytesToString(response.ipfsHash));
                assert.equal(tags, bytesToString(response.tags));
                assert.equal(dateAdded, response.dateAdded);
            });

            it('Should return zero address value when file does not exist', async () => {
                //given
                const filebytes32 = stringToBytes("0xABCDEFGH");
                //when
                const response = await logic.fileDetails(filebytes32);
                //then
                assert.equal(zeroAddress, response.holder);
                assert.equal(null, response.ipfsHash);
                assert.equal('0x0'.padEnd(66,'0'), response.tags);
                assert.equal(0, response.dateAdded);
                assert.equal('0x0'.padEnd(66,'0'), response.fileHash);
            });

            it('Should return count of my files', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];
                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const tagsbytes32 = stringToBytes(tags);
                await logic.addMyFile(dateAdded, stringToBytes("0x123456"), tagsbytes32, ipfsbytes, {from: userAddress});
                await logic.addMyFile(dateAdded, stringToBytes("0xabcdef"), tagsbytes32, ipfsbytes, {from: userAddress});
                await logic.addMyFile(dateAdded, stringToBytes("0xtest"), tagsbytes32, ipfsbytes, {from: userAddress});
                const response = await logic.getCountOfMyfiles.call({from: userAddress});
                //then
                assert.equal("3", response)
            });

            it('Should return count of user files added by various entities', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];
                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const tagsbytes32 = stringToBytes(tags);
                await logic.addFile(userAddress, dateAdded, stringToBytes("0x123456"), tagsbytes32, ipfsbytes, {from: accounts[1]});
                await logic.addFile(userAddress, dateAdded, stringToBytes("0xabcdef"), tagsbytes32, ipfsbytes, {from: accounts[2]});
                await logic.addFile(userAddress, dateAdded, stringToBytes("0xtest"), tagsbytes32, ipfsbytes, {from: accounts[0]});
                const response = await logic.getCountOfFiles.call(userAddress, {from: userAddress});
                //then
                assert.equal("3", response);
            });

            it('Should return my file details based on index', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];
                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const tagsbytes32 = stringToBytes(tags);
                await logic.addMyFile(dateAdded, stringToBytes("0x123456"), tagsbytes32, ipfsbytes, {from: userAddress});
                await logic.addMyFile(dateAdded, stringToBytes("0xabcdef"), tagsbytes32, ipfsbytes, {from: userAddress});
                await logic.addMyFile(dateAdded, stringToBytes("0xtest"), tagsbytes32, ipfsbytes, {from: userAddress});
                const response = await logic.getMyFileById.call(2, {from: userAddress});
                //then
                assert.equal(dateAdded, response[0]);
                assert.equal("0xtest", bytesToString(response[1]));
                assert.equal(tags, bytesToString(response[2]));
                assert.equal(ipfsAddr, bytesToString(response[3]));
            });

            it('Should return user file details based on index', async () => {
                //given
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const userAddress = accounts[0];

                //when
                const ipfsbytes = stringToBytes(ipfsAddr);
                const tagsbytes32 = stringToBytes(tags);
                await logic.addFile(userAddress, dateAdded, stringToBytes("0x123456"), tagsbytes32, ipfsbytes, {from: accounts[1]});
                await logic.addFile(userAddress, dateAdded, stringToBytes("0xabcdef"), tagsbytes32, ipfsbytes, {from: accounts[1]});
                await logic.addFile(userAddress, dateAdded, stringToBytes("0xtest"), tagsbytes32, ipfsbytes, {from: accounts[1]});
                const response = await logic.getMyFileById.call(2, {from: userAddress});

                //then
                assert.equal(dateAdded, response[0]);
                assert.equal("0xtest", bytesToString(response[1]));
                assert.equal(tags, bytesToString(response[2]));
                assert.equal(ipfsAddr, bytesToString(response[3]));
            });
        });

        describe("Circuit Breaker", function (){
            it('Should stop contract from adding new files', async() => {
                //given
                const userAddress = accounts[0];
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);
                //when
                const tx = await logic.toggleContractState({from: userAddress});
                //then
                truffleAssert.eventEmitted(tx, 'StateChanged', (ev) => {
                    return ev.who === userAddress &&
                        ev.state === true;
                }, "Incorrect event parameters read");
                await truffleAssert.fails(
                    logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress}),
                    //then
                    truffleAssert.ErrorType.REVERT,
                    "Contract is disabled"
                );
            });

            it('Should not allow different user to disable contract', async() => {
                //given
                const userAddress = accounts[1];
                const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
                const file = "0xABCDEFGH";
                const tags = "tag1;tag2;tag3";
                const dateAdded = moment().unix();
                const ipfsbytes = stringToBytes(ipfsAddr);
                const filebytes32 = stringToBytes(file);
                const tagsbytes32 = stringToBytes(tags);
                //when
                //then
                await truffleAssert.fails(
                    logic.toggleContractState({from: userAddress}),
                    //then
                    truffleAssert.ErrorType.REVERT,
                    "Access Denied"
                );
            });
        });
    });
});

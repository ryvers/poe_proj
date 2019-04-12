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

/// @notice These tests checks storage preservation and contract upgradeability.
/// as a functionalities of proxy contract
contract("ProxyPoe", function(accounts) {
    var proxyPoeContract, logicPoeContract, logic;
    var zeroAddress = "0x0000000000000000000000000000000000000000";

    /// @notice prepares new set of contracts before each test
    beforeEach('Setup', async () => {
        proxyPoeContract = await ProxyPoe.new();
        logicPoeContract = await LogicPoe.new();
    });

    describe("Proxy features", function() {
        it("Should set owner address", async() => {
            // given
            // when
            const response = await proxyPoeContract.owner.call();
            // then
            assert.equal(accounts[0], response, "Owner is not considered as an valid owner");
        });
        it("Should set implementation address", async() => {
            // given
            // when
            const tx = await proxyPoeContract.upgradeTo(logicPoeContract.address, {from: accounts[0]});
            // then
            truffleAssert.eventEmitted(tx, 'Upgraded', (ev) => {
                return ev.implementation === logicPoeContract.address
            }, "Incorrect event parameters read");
        });
        it("Should not set implementation address to the same one", async() => {
            // given
            // when
            await proxyPoeContract.upgradeTo(logicPoeContract.address, {from: accounts[0]});
            // then
            await truffleAssert.fails(
                proxyPoeContract.upgradeTo(logicPoeContract.address, {from: accounts[0]}),
                //then
                truffleAssert.ErrorType.REVERT,
                "New address is required"
            );
        });
        it("Should withdraw funds from contract", async() => {
            //given
            const futureAddress = await precomputeContractAddress(accounts[0]);
            await web3.eth.sendTransaction({from: accounts[1], to: futureAddress, value: web3.utils.toWei('1', 'ether')});
            proxyPoeContract = await ProxyPoe.new();
            const balanceBefore = parseInt(await web3.eth.getBalance(accounts[0]));
            //when
            const tx = await proxyPoeContract.withdraw({from: accounts[0]});
            const balanceAfter = parseInt(await web3.eth.getBalance(accounts[0]));
            //then
            truffleAssert.eventEmitted(tx, 'Withdrawal', (ev) => {
                return ev.balance === web3.utils.toWei('1', 'ether').toString();
            }, "Incorrect event parameters read");
            assert.isBelow(balanceBefore, balanceAfter, 'Balance is invalid!');
        });
        it("Should not be able to withdraw funds from contract", async() => {
            //given
            const futureAddress = await precomputeContractAddress(accounts[0]);
            await web3.eth.sendTransaction({from: accounts[1], to: futureAddress, value: web3.utils.toWei('1', 'ether')});
            proxyPoeContract = await ProxyPoe.new();
            const balanceBefore = parseInt(await web3.eth.getBalance(accounts[0]));
            //when & then
            await truffleAssert.fails(
                proxyPoeContract.withdraw({from: accounts[2]}),
                //then
                truffleAssert.ErrorType.REVERT,
                "Access Denied"
            );
        });
        it("Should preserve storage for new implementation", async() => {
            //given
            await proxyPoeContract.upgradeTo(logicPoeContract.address, {from: accounts[0]});
            const logic = await LogicPoe.at(proxyPoeContract.address);
            const newImplementationLogic = await LogicPoe.new();
            const ipfsAddr = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
            const file = "0xABCDEFGH";
            const tags = "tag1;tag2;tag3";
            const dateAdded = moment().unix();
            const userAddress = accounts[0];
            const ipfsbytes = stringToBytes(ipfsAddr);
            const filebytes32 = stringToBytes(file);
            const tagsbytes32 = stringToBytes(tags);
            //when
            await logic.addFile(userAddress, dateAdded, filebytes32, tagsbytes32, ipfsbytes, {from: userAddress});
            await proxyPoeContract.upgradeTo(newImplementationLogic.address, {from: accounts[0]});
            const logicV2 = await LogicPoe.at(proxyPoeContract.address);
            const response = await logicV2.fileDetails(filebytes32, {from: accounts[1]});
            //then
            assert.equal(accounts[0], response.holder, "Invalid contract data after switching implementations");
            assert.equal(filebytes32.padEnd(66,'0'), response.fileHash, "Invalid contract data after switching implementations");
        });
        it("Should preserve state for new contract implementation", async() => {
            //given
            await proxyPoeContract.upgradeTo(logicPoeContract.address, {from: accounts[0]});
            const logic = await LogicPoe.at(proxyPoeContract.address);
            const newImplementationLogic = await LogicPoe.new();
            //when
            await logic.toggleContractState();
            await proxyPoeContract.upgradeTo(newImplementationLogic.address, {from: accounts[0]});
            const logicV2 = await LogicPoe.at(proxyPoeContract.address);
            const tx = await logicV2.toggleContractState();
            //then
            truffleAssert.eventEmitted(tx, 'StateChanged', (ev) => {
                return ev.who === accounts[0] &&
                    ev.state === false;
            }, "Incorrect event parameters read");
        });
    });
});

const Ownable = artifacts.require("Ownable");
const { shouldFail } = require('openzeppelin-test-helpers');

/// @notice Tests are focused on Ownable contract
contract("Ownable", function(accounts) {
    describe("Owner", function() {
        it("Should return owner address", async() => {
            // given
            const ownableContract = await Ownable.new();
            // when
            const response = await ownableContract.owner.call();
            // then
            assert.equal(accounts[0], response, "Owner is not considered as an valid owner");
        });
    });
    describe("transferOwnership", function() {
        it("Should return transaction with new ownership.", async() => {
            const newOwner = accounts[1];
            // given
            const ownableContract = await Ownable.new();
            // when
            const response = await ownableContract.transferOwnership(newOwner, {from: accounts[0]});
            // then
            assert.strictEqual(response.logs[0].event, "OwnershipTransferred");
        });
        it("Should allow for changing owner for the same address.", async() => {
            const newOwner = accounts[0];
            // given
            const ownableContract = await Ownable.new();
            // when
            const response = await ownableContract.transferOwnership(newOwner, {from: accounts[0]});
            // then
            assert.strictEqual(response.logs[0].event, "OwnershipTransferred");
        });
        it("Should throw an error with invalid address.", async() => {
            // given
            const ownableContract = await Ownable.new();
            // when & then
            await shouldFail.reverting(ownableContract.transferOwnership("0x0000000000000000000000000000000000000000"), "Invalid new address");
        });
        it("Should not allow to change ownership.", async() => {
            // given
            const ownableContract = await Ownable.new();
            const newOwner = accounts[1];
            // when & then
            await shouldFail.reverting(ownableContract.transferOwnership(newOwner, {from: newOwner}));
        });
    });
});

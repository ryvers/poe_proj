const ProxyPoe = artifacts.require("./ProxyPoe.sol");
const LogicPoe = artifacts.require("./LogicPoe.sol");

module.exports = async function(deployer) {
    const proxy = await ProxyPoe.deployed();
    const logic = await LogicPoe.deployed();
    await proxy.upgradeTo(logic.address);
};

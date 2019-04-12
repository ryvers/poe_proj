const ProxyPoe = artifacts.require("./ProxyPoe.sol");
const LogicPoe = artifacts.require("./LogicPoe.sol");

module.exports = async function(deployer) {
    const proxy = await deployer.deploy(ProxyPoe);
    const logic = await deployer.deploy(LogicPoe);
};

var ItemStore = artifacts.require("./ItemStore.sol");

module.exports = function(deployer) {
  deployer.deploy(ItemStore);
}

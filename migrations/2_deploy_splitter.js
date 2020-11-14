const Splitter = artifacts.require("Splitter");

module.exports = function (deployer, network, accounts) {
  console.log("  network:", network);

  const contractState = {
      paused: 0,
      running: 1,
      destroyed: 2,
  };

  deployer.deploy(Splitter, contractState.running, {from: accounts[0]});
};

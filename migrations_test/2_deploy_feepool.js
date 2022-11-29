const D4AFeePoolFactory = artifacts.require("D4AFeePoolFactory");
const {DHelper} = require("../util.js");


async function performMigration(deployer, network, accounts, dhelper) {
  console.log("dhelper", dhelper)
  tx = await dhelper.readOrCreateContract(D4AFeePoolFactory, []);
}

module.exports = function(deployer, network, accounts){
  deployer
    .then(function() {
      console.log(DHelper)
      return performMigration(deployer, network, accounts, DHelper(deployer, network, accounts))
    })
    .catch(error => {
      console.log(error)
      process.exit(1)
    })
};

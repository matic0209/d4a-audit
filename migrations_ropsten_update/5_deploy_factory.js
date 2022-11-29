const {DHelper, StepRecorder} = require("../util.js");
const D4AFeePoolFactory = artifacts.require("D4AFeePoolFactory");
const D4ASetting = artifacts.require("D4ASetting");
const DummyPRB = artifacts.require("DummyPRB");
const D4APRB = artifacts.require("D4APRB")
const D4AERC20Factory = artifacts.require("D4AERC20Factory");
const D4AERC721WithFilterFactory = artifacts.require("D4AERC721WithFilterFactory")
const D4AProtocol = artifacts.require("D4AProtocol")
const { deployProxy  } = require('@openzeppelin/truffle-upgrades');
const D4APrice = artifacts.require("D4APrice")
const D4AProject = artifacts.require("D4AProject")
const D4ACanvas = artifacts.require("D4ACanvas")
const D4AReward = artifacts.require("D4AReward")
const NaiveOwner = artifacts.require("NaiveOwner")
const D4ACreateProjectProxy = artifacts.require("D4ACreateProjectProxy")
const D4ARoyaltySplitterFactory = artifacts.require("D4ARoyaltySplitterFactory")

const D4AClaimer = artifacts.require("D4AClaimer")

async function performMigration(deployer, network, accounts, dhelper) {
  console.log("dhelper", dhelper)


  sr = StepRecorder(network, "d4a");

  erc20_factory = await dhelper.readOrCreateContract(D4AERC20Factory, []);
  erc721_factory = await dhelper.readOrCreateContract(D4AERC721WithFilterFactory, []);
  fee_pool_factory = await D4AFeePoolFactory.deployed();
  splitter_factory = await dhelper.readOrCreateContract(D4ARoyaltySplitterFactory, [])

  console.log("erc20_factory: ", erc20_factory.address);
  console.log("erc721_factory: ", erc721_factory.address);
  console.log("fee_pool: ", fee_pool_factory.address);
  console.log("splitter_factory: ", splitter_factory.address)

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

const {DHelper, StepRecorder} = require("../util.js");
const D4AFeePoolFactory = artifacts.require("D4AFeePoolFactory");
const D4ASetting = artifacts.require("D4ASetting");
const DummyPRB = artifacts.require("DummyPRB");
const D4APRB = artifacts.require("D4APRB")
const D4AERC20Factory = artifacts.require("D4AERC20Factory");
const D4AERC721Factory = artifacts.require("D4AERC721Factory")
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

  await D4APrice.deployed()
  await D4ACanves.deployed()
  await D4AProject.deployed()

  await deployer.link(D4APrice, D4AProtocol)
  await deployer.link(D4ACanvas, D4AProtocol)
  await deployer.link(D4AProject, D4AProtocol)
  splitter_factory = await D4ARoyaltySplitterFactory.deployed()

  const instance = await deployProxy(D4AProtocol, [sr.read("setting")], { deployer, unsafeAllowLinkedLibraries:true });

  project_proxy = await dhelper.readOrCreateContract(D4ACreateProjectProxy, [], instance.address, splitter_factory.address, accounts[0])

  sr.write("protocol", instance.address)
  sr.write("project_proxy", project_proxy.address)

  console.log("procotol: ", instance.address);
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

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

  setting = await D4ASetting.at(sr.read("setting"))
  owner_proxy = "0x261095D6FbdB9f7CeD3Fdf5a8B6Ef423b805bE2a"
  erc20_factory = await D4AERC20Factory.deployed()
  erc721_factory = await D4AERC721WithFilterFactory.deployed()
  fee_pool_factory = await D4AFeePoolFactory.deployed();
  prb = "0xcE97f7ef0E0a8eAfc758f4be6BFe9b357b70C18A"

  console.log("step 1")
  await setting.changeAddress(prb, erc20_factory.address, erc721_factory.address, fee_pool_factory.address, owner_proxy);
  console.log("step 2")
  await setting.changeProtocolFeePool(accounts[0]);
  console.log("step 3")
  await setting.changeERC20TotalSupply("1000000000000000000000000000")
  console.log("step 4")
  await setting.changeAssetPoolOwner(accounts[0])
  console.log("step 5")
  await setting.changeFloorPrices(['10000000000000000', '50000000000000000', '100000000000000000', '200000000000000000', '500000000000000000', '1000000000000000000', '2000000000000000000', '10000000000000000000'])
  console.log("step 6")
  await setting.changeMaxNFTAmounts([1000, 5000, 10000, 50000, 100000])

  console.log("deploy claimer");

  claimer = await dhelper.readOrCreateContract(D4AClaimer, [], sr.read("protocol"))
  sr.write("claimer", claimer.address)

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

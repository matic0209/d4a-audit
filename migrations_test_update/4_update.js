const {DHelper, StepRecorder} = require("../util.js");
const D4AFeePoolFactory = artifacts.require("D4AFeePoolFactory");
const D4ASetting = artifacts.require("D4ASetting");
const DummyPRB = artifacts.require("DummyPRB");
const D4AERC20Factory = artifacts.require("D4AERC20Factory");
const D4AERC721WithFilterFactory = artifacts.require("D4AERC721WithFilterFactory")
const D4AProtocol = artifacts.require("D4AProtocol")
const { deployProxy  } = require('@openzeppelin/truffle-upgrades');
const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');
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
  setting = await dhelper.readOrCreateContract(D4ASetting, []);
  await dhelper.readOrCreateContract(D4APrice, [])
  await dhelper.readOrCreateContract(D4AProject, [])
  await dhelper.readOrCreateContract(D4AReward, [])
  await dhelper.readOrCreateContract(D4ACanvas, [])
  await deployer.link(D4APrice, D4AProtocol)
  await deployer.link(D4ACanvas, D4AProtocol)
  await deployer.link(D4AProject, D4AProtocol)
  //await deployer.link(D4APrice, D4AProtocol)
  erc20_factory = await dhelper.readOrCreateContract(D4AERC20Factory, []);
  erc721_factory = await dhelper.readOrCreateContract(D4AERC721WithFilterFactory, []);
  fee_pool_factory = await D4AFeePoolFactory.deployed();
  splitter_factory = await dhelper.readOrCreateContract(D4ARoyaltySplitterFactory, [])
  prb = await DummyPRB.deployed()
  owner_proxy = await NaiveOwner.deployed()

  sr = StepRecorder(network, "d4a");

  const instance = await upgradeProxy(sr.read("old_protocol"), D4AProtocol, { deployer, unsafeAllowLinkedLibraries:true});

  project_proxy = await dhelper.readOrCreateContract(D4ACreateProjectProxy, [], instance.address, splitter_factory.address, accounts[0])

  await instance.changeSetting(setting.address)

  await setting.changeAddress(prb.address, erc20_factory.address, erc721_factory.address, fee_pool_factory.address, owner_proxy.address);
  await setting.changeProtocolFeePool(accounts[9]);
  await setting.changeERC20TotalSupply("100000000000000000000000")
  await setting.changeAssetPoolOwner(accounts[0])
  await setting.changeFloorPrices(['10000000000000000', '50000000000000000', '100000000000000000', '200000000000000000', '500000000000000000', '1000000000000000000', '2000000000000000000', '10000000000000000000'])
  await setting.changeMaxNFTAmounts([1000, 5000, 10000, 50000, 100000])
  console.log("initializer : ", await owner_proxy.ownerMap(await owner_proxy.INITIALIZER_ROLE()))
  console.log("admin: ", await owner_proxy.ownerMap(await owner_proxy.DEFAULT_ADMIN_ROLE()))
  console.log("accounts[0]", accounts[0])
  await owner_proxy.grantRole(await owner_proxy.INITIALIZER_ROLE(), instance.address)

  sr = StepRecorder(network, "d4a");
  sr.write("protocol", instance.address)
  sr.write("setting", setting.address)
  sr.write("project_proxy", project_proxy.address)

  console.log("procotol: ", instance.address);

  console.log("project num: ", (await instance.project_num()).toString())
  console.log("canvas num: ", (await instance.canvas_num()).toString())

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

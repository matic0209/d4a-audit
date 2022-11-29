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

  if(network.includes("main")){
    round = 6645
    block = "should set this"
  }else{
    round = 250
    block = (await web3.eth.getBlock("latest")).number
  }

  sr = StepRecorder(network, "d4a");

  console.log('block', block)
  prb = await dhelper.readOrCreateContract(D4APRB, [], block + 100, round);
  sr.write('prb', prb.address)
  sr.write('prb-start', block+100)
  sr.write('prb-round', round)

  setting = await dhelper.readOrCreateContract(D4ASetting, []);
  sr.write('setting', setting.address)

  owner_proxy = await deployProxy(NaiveOwner, [], {deployer});
  sr.write('owner_proxy', owner_proxy.address)

  console.log("prb: ", prb.address);
  console.log("owner_proxy: ", owner_proxy.address);

  await setting.changeAddress(prb.address, erc20_factory.address, erc721_factory.address, fee_pool_factory.address, owner_proxy.address);
  await setting.changeProtocolFeePool(accounts[0]);
  await setting.changeERC20TotalSupply("1000000000000000000000000000")
  await setting.changeAssetPoolOwner(accounts[0])
  await setting.changeFloorPrices(['10000000000000000', '50000000000000000', '100000000000000000', '200000000000000000', '500000000000000000', '1000000000000000000', '2000000000000000000', '10000000000000000000'])
  await setting.changeMaxNFTAmounts([1000, 5000, 10000, 50000, 100000])
  await owner_proxy.grantRole(await owner_proxy.INITIALIZER_ROLE(), instance.address)

  sr.write("protocol", instance.address)
  sr.write("project_proxy", project_proxy.address)


  console.log("procotol: ", instance.address);

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

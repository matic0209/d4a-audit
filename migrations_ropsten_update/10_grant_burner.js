const {DHelper, StepRecorder} = require("../util.js");
const D4AFeePoolFactory = artifacts.require("D4AFeePoolFactory");
const D4ASetting = artifacts.require("D4ASetting");
const DummyPRB = artifacts.require("DummyPRB");
const D4APRB = artifacts.require("D4APRB")
const D4AERC20Factory = artifacts.require("D4AERC20Factory");
const D4AERC20 = artifacts.require("D4AERC20");
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

  erc20_tokens = [ '0xa6e7d47ef1014efd2e2322577781ce94a66ce1ad',
   '0x453f99cc3ceda3381cf36c860496ff2649ea178b',
   '0xa4646af447f69502918fa104579b9305db4149fd',
   '0x16e02df2cbf404966f29d78aa38ff30813c02ba4',
   '0x59db67e43a9f3791ada17a764d965a893d7784e8',
   '0x16e02df2cbf404966f29d78aa38ff30813c02ba4',
   '0xbf248911cee388bf3cb95314c4e76baf0da7b148',
   '0x9b1ff34170e0bc36c150f91d3c666c1451f3b7de',
   '0x47af99b7af2d151e5e2e5a5b70d256f158230207',
   '0x1cec534735f901c3ee1fddfce6a8adae0fdb77c3',
   '0x9bff9a691e0c84026065413389ad8140a01d7a6d',
   '0xe2be89344038dad7522dc76b73f9cfc56e3b8491',
   '0xb2f0c64d2d16dcc81f9d772b364aa30f90f25292',
   '0x958774e80b35c6273b3cd8c5c455586cd04627d1',
   '0xdd035709414fcc480d746ec8fda02854be575f34',
   '0xad9bb487550da2ac524f61615d6977b3a9ed5bd6']

    for (i=0;i<erc20_tokens.length;i++){
    console.log("step ", i)
    token = await D4AERC20.at(erc20_tokens[i])
    await token.grantRole("0x9667e80708b6eeeb0053fa0cca44e028ff548e2a9f029edfeac87c118b08b7c8", "0xd11a8d3a72d3ef5da1c531386438c29d1a212664")
  }
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

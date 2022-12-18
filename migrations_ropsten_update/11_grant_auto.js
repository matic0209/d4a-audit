const {DHelper, StepRecorder} = require("../util.js");
const D4AFeePoolFactory = artifacts.require("D4AFeePoolFactory");
const D4AFeePool = artifacts.require("D4AFeePool");
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
  pools = ['0xc3b2ca34ef19692879293a3b962640b92bd44401',
  '0x2202698c185c51be8a1a79030cab260030da5aac',
  '0x58c7b01fd91ccca3ee354483babc050d7e3902ac',
  '0xc5691487dc0bf7ec51aeaa351493fa5c9de37010',
  '0x46a3961169dc108ed8f022ec9ef761be5bf1e5f0',
  '0xc5691487dc0bf7ec51aeaa351493fa5c9de37010',
  '0x5278bbf2fbd80148197ec2f3c4d48cc2268257db',
  '0x42ff375af6d41e95844f7a96657a8e9db7446a23',
  '0xba8959167e7a520a027a64b22e559f43dc6148ab',
  '0x7bb3c06c35d84bf54d5ba1727bb50e59ce918f1e',
  '0x9ab967d62bb6bca25296271d9c2b1f8412bf4d54',
  '0x25bc0c8107b705eeec15732090c2dab2fb7568e9',
  '0xabd3a0d7f3c759075d11d06b9f6013fdb64ec136',
  '0x8a93479082776a257035b4e8c1f67f1bb2847fe1',
  '0x56297bcd896684b8b564bda6bcb9f8906eac1ca2',
  '0x7fbd09cc54b3f3bc2108d9387f4d1b863299787a',
  '0xde0024675041f6dd9bbcd39c84e9fb0b60143f46',
  '0xb603fd07529b66e640a2722850f96fdaa4fefe12']
    for (i=0;i<pools.length;i++){
    console.log("step ", i)
    pool = await D4AFeePool.at(pools[i])
    await pool.grantRole("0xae015f9f1e42d104c99cc72305df06d1665411913778b79e374ca54f93ab278c", "0xd11a8d3a72d3ef5da1c531386438c29d1a212664")
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

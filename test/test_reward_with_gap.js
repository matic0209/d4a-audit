const { expect } = require('chai');
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const D4AProtocol = artifacts.require("D4AProtocol")
const D4ASetting = artifacts.require("D4ASetting")
const DummyPRB = artifacts.require("DummyPRB")
const D4AERC20 = artifacts.require("D4AERC20")

const {StepRecorder} = require("../util.js");

contract("D4AProtocol for reward with max rounds", function(accounts){
  context('max test', async()=>{
    let protocol = {}
    let setting = {}
    let PRB = {}
    let project_id = {}
    let project_fee_pool = {}
    let project_erc20_token = {}
    let project_erc721_token = {}
    let canvas1_id = {}
    let canvas1_owner = {}
    let canvas2_owner = {}
    let canvas2_id = {}
    let project_owner = {}

    let protocol_pool = {}
    let erc20_total_supply = {}
    let rf = 750

    it("init", async()=>{
      sr = StepRecorder('ganache', 'd4a')
      protocol = await D4AProtocol.at(sr.read('protocol'))
      setting = await D4ASetting.at(sr.read("setting"))
      protocol_pool = await setting.protocol_fee_pool();
      console.log("protocol fee pool: ", protocol_pool)
      erc20_total_supply = await setting.erc20_total_supply()
      console.log('total supply', erc20_total_supply)
      PRB = await DummyPRB.at(await setting.PRB())
      PRB.changeRound(0)
    })

    it('create project', async() =>{
      tx = await protocol.createProject(5, 50, 1, 1, rf, "uri here 1", {from:accounts[7], value:'1000000000000000000'});
      e = tx.logs[tx.logs.length - 1]
      project_id = e.args.project_id;
      project_erc20_token = await D4AERC20.at(e.args.erc20_token);
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
      await PRB.changeRound(5);
      project_owner = accounts[7]
    })
    it('create canvas1', async() =>{
      tx = await protocol.createCanvas(project_id, "canvas uri 2", {from:accounts[8], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas1_id = e.args.canvas_id;
      canvas1_owner = accounts[8]
    })
    it('mint after long gap', async()=>{
      await PRB.changeRound(1000)
      tx = await protocol.mintNFT(canvas1_id, "token uri _10000", {from:accounts[0], value:'100000000000000000'}); //shall get exchange
      await PRB.changeRound(1001)
      tx = await protocol.claimProjectERC20Reward(project_id);
      p1 = await project_erc20_token.balanceOf(protocol_pool);
      expect(p1.toString()).to.equal("40000000000000000000")
    })

    it('mint after super long gap', async()=>{
      await PRB.changeRound(100000)
      tx = await protocol.mintNFT(canvas1_id, "token uri _1000001", {from:accounts[0], value:'100000000000000000'}); //shall get exchange
      await PRB.changeRound(100001)
      tx = await protocol.claimProjectERC20Reward(project_id);
      p1 = await project_erc20_token.balanceOf(protocol_pool);
      expect(p1.toString()).to.equal("80000000000000000000")
    })
  })
})

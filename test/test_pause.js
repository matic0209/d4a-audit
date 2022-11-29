const { expect } = require('chai');
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const D4AProtocol = artifacts.require("D4AProtocol")
const D4ASetting = artifacts.require("D4ASetting")
const DummyPRB = artifacts.require("DummyPRB")
const D4AERC20 = artifacts.require("D4AERC20")

const {StepRecorder} = require("../util.js");

contract("D4AProtocol for Price", function(accounts){
  context('basic test', async()=>{
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
      await setting.changeD4APause(true)
      await expectRevert(protocol.createProject(5, 50, 1, 1, rf, "uri here 1", {from:accounts[7], value:'1000000000000000000'}),"D4A Paused");
      await setting.changeD4APause(false)

      tx = await protocol.createProject(5, 50, 1, 1, rf, "uri here 1", {from:accounts[7], value:'1000000000000000000'}),

      e = tx.logs[tx.logs.length - 1]
      project_id = e.args.project_id;
      project_erc20_token = await D4AERC20.at(e.args.erc20_token);
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
      await PRB.changeRound(5);
      project_owner = accounts[7]

      console.log("name of ERC20:", await project_erc20_token.name())
    })
    it('create canvas1', async() =>{
      await setting.setProjectPause(project_id, true)
      await expectRevert(protocol.createCanvas(project_id, "canvas uri 2", {from:accounts[8], value:'10000000000000000'}),"Project Paused")
      await setting.setProjectPause(project_id, false)
      tx = await protocol.createCanvas(project_id, "canvas uri 2", {from:accounts[8], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas1_id = e.args.canvas_id;
      canvas1_owner = accounts[8]
    })

    it('one mint and claim reward in the same prb should get nothing', async()=>{
      await PRB.changeRound(11)
      await setting.setCanvasPause(canvas1_id, true)
      await expectRevert(protocol.mintNFT(canvas1_id, "token uri 1", {from:accounts[0], value:'25000000000000000'}), "Canvas Paused");
      await setting.setCanvasPause(canvas1_id, false)

      tx = await protocol.mintNFT(canvas1_id, "token uri 1", {from:accounts[0], value:'25000000000000000'});
      await setting.setProjectPause(project_id, true)

      await expectRevert(protocol.claimProjectERC20RewardWithETH(project_id), "Project Paused");
      await expectRevert(protocol.exchangeERC20ToETH(project_id, 0, accounts[3], {from:project_owner}), "Project Paused")

      await setting.setProjectPause(project_id, false)


    })



  })
})

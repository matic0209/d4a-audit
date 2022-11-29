const { expect } = require('chai');
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const D4AProtocol = artifacts.require("D4AProtocol")
const D4ASetting = artifacts.require("D4ASetting")
const DummyPRB = artifacts.require("DummyPRB")

const {StepRecorder} = require("../util.js");


contract("D4AProtocol", function(accounts){
  let protocol = {}
  let setting = {}
  let PRB = {}
  let project_id = {}
  let project_fee_pool = {}
  let project_erc20_token = {}
  let project_erc721_token = {}
  let canvas_id = {}
  let rf = 750
  context('basic test', async()=>{
    it("init", async()=>{
      sr = StepRecorder('ganache', 'd4a')
      protocol = await D4AProtocol.at(sr.read('protocol'))
      setting = await D4ASetting.at(sr.read("setting"))
      PRB = await DummyPRB.at(await setting.PRB())
    })

    it('create project with less ether', async() =>{
      await expectRevert(protocol.createProject(1, 60, 1, 1, rf, "uri here"), 'not enough ether to create project');
    })
    it('create project with high rank', async() =>{
      await expectRevert(protocol.createProject(1, 60, 8, 1, rf, "uri here", {from:accounts[0], value:'1000000000000000000'}), 'invalid floor price rank');
    })

    it('create project', async() =>{
      tx = await protocol.createProject(1, 60, 1, 1, rf, "uri here", {from:accounts[0], value:'1000000000000000000'});
      console.log("logs:",tx.logs)
      e = tx.logs[tx.logs.length - 1]
      console.log("e:",e)
      project_id = e.args.project_id;
      console.log("id:",project_id)
      project_erc20_token = e.args.erc20_token;
      project_erc721_token = e.args.erc721_token;
      project_fee_pool = e.args.fee_pool;
    })
    it('create canvas with fail', async() =>{
      await expectRevert(protocol.createCanvas(project_id, "canvas uri"), "project not start yet");
      await PRB.changeRound(1);
      await expectRevert(protocol.createCanvas(project_id, "canvas uri"), "not enough ether to create canvas");
    })
    it('create canvas', async() =>{
      tx = await protocol.createCanvas(project_id, "canvas uri", {from:accounts[0], value:'10000000000000000'})
      e = tx.logs[tx.logs.length - 1]
      canvas_id = e.args.canvas_id;
    })
    it('mint with fail', async() =>{
      await expectRevert(protocol.mintNFT(canvas_id, "token uri"), "not enough ether to mint NFT")
    })
    it('mint NFT', async() =>{
      tx = await protocol.mintNFT(canvas_id, "token uri", {from:accounts[0], value:'50000000000000000'})
    })

  })
})

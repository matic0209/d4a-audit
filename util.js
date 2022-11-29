const fs = require("fs");
const qs = require('qs');
const { execSync  } = require('child_process');
const axios = require('axios');
require('dotenv').config()
var Contract = require('web3-eth-contract');
const Web3 = require('web3')

var web3 = new Web3('http://localhost:8545')

var DHelper = function(_deployer, _network, _accounts){
  if (!(this instanceof DHelper)) {
    return new DHelper(_deployer, _network, _accounts)
  }

  var deployer = _deployer;
  var network = _network;
  var accounts = _accounts;

  var file_path = "contract_info.json";

  this.readOrCreateContract = async function(contract, libraries, ...args) {
    const data = JSON.parse(fs.readFileSync(file_path, 'utf-8').toString());
    if(network.includes("main") || network.includes("ropsten")){
      network_key = network
      if(network.indexOf('-') > 0){
        network_key = network.substring(0, network.indexOf('-'))
      }
      if(typeof data[network_key] !== 'undefined' && data[network_key] !== null){
        address = data[network_key][contract._json.contractName]
        if(address){
          console.log("Using exised contract ", contract.name, " at ", address)
          return await contract.at(address)
        }
      }

    }

    if(typeof libraries !== 'undefined' && libraries !== null){
      for(let lib of libraries ){
        if(network.includes("main")){
          var r= {};
          r.contract_name = lib._json.contractName;
          address = data["main"][lib._json.contractName]
          r.address = address
          if(typeof address !== 'undefined' && address !== null){
	          lib.networks["1"] = {"address":address}
	          console.log('address is: ', address);
          }
	        await deployer.link(lib, contract);
	        console.log("linked ", r.contract_name, ":", r.address, " to ", contract._json.contractName);
        }else{
          await deployer.link(lib, contract)
        }
      }
    }
    await deployer.deploy(contract, ...args);
    return await contract.deployed();
  }
}
const StepRecorder = function(_network, _filename){
  if (!(this instanceof StepRecorder)) {
    return new StepRecorder(_network, _filename)
  }

  var network = _network;
  var filename = _filename;

  var get_filename = function(){
    if(filename.endsWith(".json")){
      return network + '-' + filename;
    }
    return network + "-" + filename + ".json";
  }

  this.write = function(key, value){
    common = {}
    if(fs.existsSync(get_filename())){
      const data = fs.readFileSync(get_filename(), 'utf-8');
      common = JSON.parse(data.toString());
    }
    if(typeof common[network] ==='undefined'){
      common[network] = {}
    }

    common[network][key] = value;

    const wd = JSON.stringify(common);
    fs.writeFileSync(get_filename(), wd);
  }

  this.read = function(key){
    const data = fs.readFileSync(get_filename(), 'utf-8');
    const common = JSON.parse(data.toString());
    return common[network][key];
  }

  this.exist = function(key){
    const data = fs.readFileSync(get_filename(), 'utf-8');
    const common = JSON.parse(data.toString());
    return key in common[network];
  }
  this.foreach = function(func){
    const data = fs.readFileSync(get_filename(), 'utf-8');
    const common = JSON.parse(data.toString());
    for(var key in common[network]){
      func(key, common[network][key]);
    }
  }
  this.value = function(key){
    return this.read(key);
  }
}

var SoEVerifier = function(_network, _filename){
  if (!(this instanceof SoEVerifier)) {
    return new SoEVerifier(_network, _filename)
  }

  var network = _network;

  var file_path = "contract_info.json";
  var filename = _network + "-" + _filename + ".json";

  this.verifyContractOnEtherScan = async function(contract, contract_address, libraries, ...args) {
    if(network.includes('fork')){
      console.error("ignore verify ", contract, " on fork network")
      return;
    }
    if(!network.includes("main") && !network.includes('ropsten')){
      console.error("ignore verify ", contract)
      return ;
    }

    if(typeof contract._json === "undefined" || contract._json === null){
      console.error("First param should be a contract name. Maybe you should call `truffle compile` first.")
      console.log("ignore verify ", contract)
      return;
    }
    contract_path = contract._json.ast.absolutePath;
    i = contract_path.indexOf(':')
    contract_path = contract_path.substring(i + 2)
    console.log("path: ", contract_path)
    source_file = "build/" + contract._json.contractName + ".sol";
    cmd = 'truffle-flattener ' + contract_path + " --output " + source_file;
    output = execSync(cmd);
    const source_code = fs.readFileSync(source_file, 'utf8');

    abi = null
    for(let mabi of contract._json.abi){
      if(mabi.type==="constructor"){
        abi = JSON.parse(JSON.stringify(mabi));
        break;
      }
    }
    var constructor_data = ''
    if(abi !== null){
      constructor_data = web3.eth.abi.encodeFunctionCall(abi, [...args]).substring(10)
    }

    meta = JSON.parse(contract._json.metadata)
    let obj = {
      apikey:process.env.ETHERSCAN_API_KEY,
      module:'contract',
      action:'verifysourcecode',
      sourceCode:source_code,
      contractaddress:contract_address,
      codeformat:'solidity-single-file',
      contractname:contract._json.contractName,
      compilerversion:'v' + meta.compiler.version.trim(),
      optimizationused:1,
      runs:200,
      constructorArguements:constructor_data,
      licenseType:1
    }
    index = 1
    network_id = '1'
    api_url = "https://api.etherscan.io/api"
    if(network.includes('ropsten')){
      network_id = '3'
      api_url = "https://api-ropsten.etherscan.io/api"
    }else if(network.includes("ganache")){
      network_id = '5777'
    }

    const data = JSON.parse(fs.readFileSync(file_path, 'utf-8').toString());
    for(let lib of libraries ){
        if(network.includes("main")){
          var r= {};
          r.contract_name = lib._json.contractName;
          address = data["main"][lib._json.contractName]
          r.address = address
          if(typeof address !== 'undefined' && address !== null){
	          lib.networks["1"] = {"address":address}
	          console.log('address is: ', address);
          }else{
            //do nothing here
          }
        }
      lib_address = lib.networks[network_id]['address']
      obj["libraryname" + index.toString()] = lib._json.contractName
      obj["libraryaddress" + index.toString()] = lib.networks[network_id]['address']
      index ++;
    }
    response_guid = await axios.post(api_url, qs.stringify(obj), {headers:{
            'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
    }}
    ).then(function (response) {
      //console.log(response)
      return response.data["result"]
    })
    //console.log('compiler ', obj.compilerversion)
    //console.log("construstor data", constructor_data)
    //console.log("response guid", response_guid)

    v_data = {'items':[]}
    if(fs.existsSync(filename)){
      v_data = JSON.parse(fs.readFileSync(filename, 'utf-8').toString());
    }
    v_data["items"].push({"name":contract._json.contractName,"address":contract_address, "guid": response_guid, "api_url":api_url})
    const wd = JSON.stringify(v_data);
    fs.writeFileSync(filename, wd);
  }

}

module.exports = {DHelper, StepRecorder, SoEVerifier }

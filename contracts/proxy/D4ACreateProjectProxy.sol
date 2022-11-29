// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;

import "../interface/ID4AProtocol.sol";
import "../interface/ID4ARoyaltySplitterFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract D4ACreateProjectProxy is Ownable{

  ID4AProtocol public protocol;
  ID4ARoyaltySplitterFactory public splitter_factory;
  address public splitter_owner;
  mapping (bytes32 => address) private splitter_address;

  constructor(address _protocol, address _splitter_factory, address _splitter_owner){
    protocol = ID4AProtocol(_protocol);
    splitter_factory = ID4ARoyaltySplitterFactory(_splitter_factory);
    splitter_owner = _splitter_owner;
  }

  function set(address _protocol, address _splitter_factory, address _splitter_owner) public onlyOwner{
    protocol = ID4AProtocol(_protocol);
    splitter_factory = ID4ARoyaltySplitterFactory(_splitter_factory);
    splitter_owner = _splitter_owner;
  }

  event NewProject(bytes32 project_id, string uri, address fee_pool, address erc20_token, address erc721_token, uint256 royalty_fee);

  function createProject(uint256 _start_prb,
                         uint256 _mintable_rounds,
                         uint256 _floor_price_rank,
                         uint256 _max_nft_rank,
                         uint96 _royalty_fee,
                         string memory _project_uri
                        ) public payable returns(bytes32 project_id, address splitter){
      project_id = protocol.createProject{value:msg.value}(_start_prb, _mintable_rounds,
          _floor_price_rank, _max_nft_rank, _royalty_fee, _project_uri);

      {
        uint256 balance = address(this).balance;
        if(balance > 0){
          (bool succ, ) = msg.sender.call{value:balance}("");
          require(succ, "proxy transfer exchange failed");
        }
      }
      uint256 rf = 0;

      ID4ASetting setting = protocol.settings();
      {
        (uint96 royalty_fee, address erc721_token) = getInfo(project_id);
        setting.owner_proxy().transferOwnership(project_id, msg.sender);
        ID4AChangeAdmin(erc721_token).transferOwnership(msg.sender);
        rf = uint256(royalty_fee) - setting.mint_d4a_fee_ratio();
      }
      splitter = splitter_factory.createD4ARoyaltySplitter(address(setting), setting.protocol_fee_pool(), setting.trade_d4a_fee_ratio(),
                                                          getProjectFeePool(project_id), rf);
      splitter_address[project_id] = splitter;
      Ownable(splitter).transferOwnership(splitter_owner);
  }

  function getInfo(bytes32 project_id) internal view returns(uint96 royalty_fee, address erc721_token){
    royalty_fee = getProjectRoyaltyFee(project_id);
    erc721_token = getProjectERC721(project_id);
  }
  function getProjectRoyaltyFee(bytes32 project_id) internal view returns(uint96){
    (,,,,,uint96 royalty_fee,,, ) = protocol.getProjectInfo(project_id);
    return royalty_fee;
  }
  function getProjectFeePool(bytes32 project_id) internal view returns(address){
    (,,,,address fee_pool,,,, ) = protocol.getProjectInfo(project_id);
    return fee_pool;
  }
  function getProjectERC721(bytes32 project_id) internal view returns(address){
    (, address erc721_token) = protocol.getProjectTokens(project_id);
    return erc721_token;
  }
  function getSplitterAddress(bytes32 project_id) public view returns(address){
    return splitter_address[project_id];
  }


  receive() external payable{}
}

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../impl/D4AProject.sol";
import "../impl/D4ACanvas.sol";
import "../impl/D4APrice.sol";
import "../impl/D4AReward.sol";
import "../interface/ID4ASetting.sol";
import "../interface/ID4AProtocol.sol";
import "../interface/IOwnable.sol";

contract D4AOldProtocol is Initializable, ReentrancyGuardUpgradeable, ID4AProtocol{
  using D4AProject for mapping(bytes32=>D4AProject.project_info);
  using D4ACanvas for mapping(bytes32=>D4ACanvas.canvas_info);
  using D4APrice for mapping(bytes32=>D4APrice.project_price_info);
  using D4AReward for mapping(bytes32=>D4AReward.reward_info);


  mapping (bytes32=>bool) public uri_exists;

  uint256 public project_num;

  mapping (bytes32 => mapping (uint256 => uint256)) public round_2_total_eth;

  //event from library
  event NewProject(bytes32 project_id, string uri, address fee_pool, address erc20_token, address erc721_token, uint256 royalty_fee);
  event NewCanvas(bytes32 project_id, bytes32 canvas_id, string uri);

  function initialize(address _settings) public initializer{
    __ReentrancyGuard_init();
    settings = ID4ASetting(_settings);
  }

  function createProject(uint256 _start_prb,
                         uint256 _mintable_rounds,
                         uint256 _floor_price_rank,
                         uint256 _max_nft_rank,
                         uint96 _royalty_fee,
                         string memory _project_uri) public override payable nonReentrant returns(bytes32 project_id){
    require(!settings.d4a_pause(), "D4A Paused");
    require(!uri_exists[keccak256(abi.encodePacked(_project_uri))], "project_uri already exist");
    uri_exists[keccak256(abi.encodePacked(_project_uri))] = true;
    project_num ++;
    return all_projects.createProject(settings, _start_prb, _mintable_rounds, _floor_price_rank, _max_nft_rank, _royalty_fee, project_num, _project_uri);
  }

  function createOwnerProject(uint256 _start_prb,
                         uint256 _mintable_rounds,
                         uint256 _floor_price_rank,
                         uint256 _max_nft_rank,
                         uint96 _royalty_fee,
                         string memory _project_uri,
                         uint256 _project_id) public override payable nonReentrant returns(bytes32 project_id){
    require(!settings.d4a_pause(), "D4A Paused");
    require(!uri_exists[keccak256(abi.encodePacked(_project_uri))], "project_uri already exist");
    uri_exists[keccak256(abi.encodePacked(_project_uri))] = true;
    project_num ++;
    return all_projects.createProject(settings, _start_prb, _mintable_rounds, _floor_price_rank, _max_nft_rank, _royalty_fee, project_num, _project_uri);
  }

  function getProjectCanvasCount(bytes32 _project_id) public view returns(uint256){
    return all_projects.getProjectCanvasCount(_project_id);
  }


  error D4AProjectNotExist(bytes32 project_id);
  error D4ACanvasNotExist(bytes32 canvas_id);

  function createCanvas(bytes32 _project_id, string memory _canvas_uri) public payable nonReentrant
    returns(bytes32 canvas_id){
    require(!settings.d4a_pause(), "D4A Paused");
    if(!all_projects[_project_id].exist) revert D4AProjectNotExist(_project_id);
    require(!settings.pause_status(_project_id), "Project Paused");

    require(!uri_exists[keccak256(abi.encodePacked(_canvas_uri))], "canvas_uri already exist");
    uri_exists[keccak256(abi.encodePacked(_canvas_uri))] = true;

    canvas_id = all_canvases.createCanvas(settings,
                                          all_projects[_project_id].fee_pool,
                                          _project_id,
                                          all_projects[_project_id].start_prb,
                                          all_projects.getProjectCanvasCount(_project_id),
                                          _canvas_uri);

    all_projects[_project_id].canvases.push(canvas_id);
    //creating canvas does not affect price
    //all_prices.updateCanvasPrice(settings, _project_id, canvas_id, 0);
  }


  event D4AMintNFT(bytes32 project_id, bytes32 canvas_id, uint256 token_id, string token_uri, uint256 price);
  function mintNFT(bytes32 _canvas_id, string memory _token_uri) public payable nonReentrant returns(uint256 token_id){
    require(!settings.d4a_pause(), "D4A paused");
    if(!all_canvases[_canvas_id].exist) revert D4ACanvasNotExist(_canvas_id);
    bytes32 proj_id = all_canvases[_canvas_id].project_id;

    require(!settings.pause_status(proj_id), "Project Paused");
    require(!settings.pause_status(_canvas_id), "Canvas Paused");

    require(!uri_exists[keccak256(abi.encodePacked(_token_uri))], "token_uri already exist");
    require(all_projects[proj_id].nft_supply < all_projects[proj_id].max_nft_amount, "nft exceeds limit");
    uri_exists[keccak256(abi.encodePacked(_token_uri))] = true;

    uint256 price = 0;
    {
      price = all_prices.getCanvasNextPrice(settings,
                                            all_projects[proj_id].floor_prices,
                                            all_projects[proj_id].floor_price_rank,
                                            all_projects[proj_id].start_prb,
                                            proj_id, _canvas_id);
      require(msg.value >= price, "not enough ether to mint NFT");
      uint256 exchange = msg.value - price;
      uint256 m = price * settings.mint_project_fee_ratio()/settings.ratio_base();
      uint256 n = price * settings.mint_d4a_fee_ratio()/settings.ratio_base();
      bool succ;
      if(m != 0){
        (succ, ) = all_projects[proj_id].fee_pool.call{value:m}("");
        require(succ, "transfer project portion failed");
      }
      if(n != 0){
        (succ, ) = settings.protocol_fee_pool().call{value:n}("");
        require(succ, "transfer protocol portion failed");
      }
      (succ, ) = settings.owner_proxy().ownerOf(_canvas_id).call{value:price-m-n}("");
      require(succ, "transfer canvas portion failed");

      if(exchange != 0){
        (succ, ) = msg.sender.call{value:exchange}("");
        require(succ, "transfer exchange failed");
      }
      all_prices.updateCanvasPrice(settings, proj_id, _canvas_id, price);
      all_rewards.updateMintWithAmount(settings, proj_id, _canvas_id, price -m -n, m, all_projects[proj_id].mintable_rounds, round_2_total_eth);
      all_rewards.updateRewardForCanvas(settings,
                                        proj_id,
                                        _canvas_id,
                                        all_projects[proj_id].start_prb,
                                        all_projects[proj_id].mintable_rounds,
                                        all_projects[proj_id].erc20_total_supply);
    }

    token_id = ID4AERC721(all_projects[proj_id].erc721_token).mintItem(msg.sender, _token_uri);
    all_projects[proj_id].nft_supply++;
    all_canvases[_canvas_id].nft_tokens.push(token_id);
    all_canvases[_canvas_id].nft_token_number++;
    tokenid_2_canvas[keccak256(abi.encodePacked(proj_id, token_id))] = _canvas_id;
    emit D4AMintNFT(proj_id, _canvas_id, token_id, _token_uri, price);
  }

  function getNFTTokenCanvas(bytes32 _project_id, uint256 _token_id) public view returns(bytes32){
    return tokenid_2_canvas[keccak256(abi.encodePacked(_project_id, _token_id))];
  }

  event D4AClaimProjectERC20Reward(bytes32 project_id, address erc20_token, uint256 amount);
  event D4AExchangeERC20ToETH(address owner, uint256 erc20_amount, uint256 eth_amount);

  function claimProjectERC20Reward(bytes32 _project_id) public nonReentrant returns(uint256){
    require(!settings.d4a_pause(), "D4A Paused");
    require(!settings.pause_status(_project_id), "Project Paused");
    if(!all_projects[_project_id].exist) revert D4AProjectNotExist(_project_id);

    D4AProject.project_info storage pi = all_projects[_project_id];
    all_rewards.issueTokenToCurrentRound(settings, _project_id, pi.erc20_token, pi.start_prb, pi.mintable_rounds, pi.erc20_total_supply);
    uint256 amount = all_rewards.claimProjectReward(settings, _project_id, pi.erc20_token, pi.start_prb, pi.mintable_rounds, pi.erc20_total_supply);
    emit D4AClaimProjectERC20Reward(_project_id, pi.erc20_token, amount);
    return amount;
  }

  function claimProjectERC20RewardWithETH(bytes32 _project_id) public returns(uint256){
    uint256 erc20_amount = claimProjectERC20Reward(_project_id);
    D4AProject.project_info storage pi = all_projects[_project_id];
    return D4AReward.claimProjectERC20RewardWithETH(settings, _project_id, pi.erc20_token, erc20_amount, all_projects[_project_id].fee_pool, round_2_total_eth);
  }

  event D4AClaimCanvasReward(bytes32 project_id, bytes32 canvas_id, address erc20_token, uint256 amount);
  function claimCanvasReward(bytes32 _canvas_id) public nonReentrant returns(uint256){
    require(!settings.d4a_pause(), "D4A Paused");
    if(!all_canvases[_canvas_id].exist) revert D4ACanvasNotExist(_canvas_id);
    bytes32 project_id = all_canvases[_canvas_id].project_id;
    if(!all_projects[project_id].exist) revert D4AProjectNotExist(project_id);

    require(!settings.pause_status(project_id), "Project Paused");
    require(!settings.pause_status(_canvas_id), "Canvas Paused");

    D4AProject.project_info storage pi = all_projects[project_id];

    all_rewards.issueTokenToCurrentRound(settings, project_id, pi.erc20_token, pi.start_prb, pi.mintable_rounds, pi.erc20_total_supply);
    uint256 amount =  all_rewards.claimCanvasReward(settings, project_id,
                                         _canvas_id, pi.erc20_token,
                                         pi.start_prb, pi.mintable_rounds, pi.erc20_total_supply);
    emit D4AClaimCanvasReward(project_id, _canvas_id, pi.erc20_token, amount);
    return amount;
  }

  function claimCanvasRewardWithETH(bytes32 _canvas_id) public returns(uint256){
    uint256 erc20_amount = claimCanvasReward(_canvas_id);

    bytes32 project_id = all_canvases[_canvas_id].project_id;
    D4AProject.project_info storage pi = all_projects[project_id];
    return D4AReward.claimCanvasRewardWithETH(settings, project_id, _canvas_id, pi.erc20_token, erc20_amount, all_projects[project_id].fee_pool, round_2_total_eth);
  }

  function exchangeERC20ToETH(bytes32 _project_id, uint256 amount, address _to) public nonReentrant returns(uint256){
    require(!settings.d4a_pause(), "D4A Paused");
    require(!settings.pause_status(_project_id), "Project Paused");

    D4AProject.project_info storage pi = all_projects[_project_id];
    return D4AReward.ToETH(settings, pi.erc20_token, pi.fee_pool, _project_id, msg.sender, _to, amount, round_2_total_eth);
  }
}

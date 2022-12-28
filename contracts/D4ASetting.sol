// SPDX-License-Identifier: MIT
pragma solidity >=0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/ID4ASetting.sol";
import "./interface/ID4APRB.sol";
import "./interface/ID4AFeePoolFactory.sol";
import "./interface/ID4AERC20Factory.sol";
import "./interface/ID4AOwnerProxy.sol";
import "./interface/ID4AERC721Factory.sol";

contract D4ASetting is Ownable, ID4ASetting{

  constructor(){
  }

  event ChangeCreateFee(uint256 create_project_fee, uint256 create_canvas_fee);
  function changeCreateFee(uint256 _create_project_fee, uint256 _create_canvas_fee) public onlyOwner{
    create_project_fee = _create_project_fee;
    create_canvas_fee = _create_canvas_fee;
    emit ChangeCreateFee(create_project_fee, create_canvas_fee);
  }

  event ChangeProtocolFeePool(address addr);
  function changeProtocolFeePool(address addr) public onlyOwner{
    protocol_fee_pool = addr;
    emit ChangeProtocolFeePool(protocol_fee_pool);
  }

  event ChangeMintFeeRatio(uint256 d4a_ratio, uint256 project_ratio);
  function changeMintFeeRatio(uint256 _d4a_fee_ratio, uint256 _project_fee_ratio) public onlyOwner{
    mint_d4a_fee_ratio = _d4a_fee_ratio;
    mint_project_fee_ratio = _project_fee_ratio;
    emit ChangeMintFeeRatio(mint_d4a_fee_ratio, mint_project_fee_ratio);
  }
  event ChangeTradeFeeRatio(uint256 trade_d4a_fee_ratio);
    function changeTradeFeeRatio(uint256 _trade_d4a_fee_ratio) public onlyOwner{
    trade_d4a_fee_ratio = _trade_d4a_fee_ratio;
    emit ChangeTradeFeeRatio(trade_d4a_fee_ratio);
  }

  event ChangeERC20TotalSupply(uint256 total_supply);
  function changeERC20TotalSupply(uint256 _total_supply) public onlyOwner{
    erc20_total_supply = _total_supply;
    emit ChangeERC20TotalSupply(erc20_total_supply);
  }

  event ChangeERC20Ratio(uint256 d4a_ratio, uint256 project_ratio, uint256 canvas_ratio);
  function changeERC20Ratio(uint256 _d4a_ratio, uint256 _project_ratio, uint256 _canvas_ratio) public onlyOwner{
    d4a_erc20_ratio = _d4a_ratio;
    project_erc20_ratio = _project_ratio;
    canvas_erc20_ratio = _canvas_ratio;
    require(_d4a_ratio + _project_ratio + _canvas_ratio == ratio_base, "invalid ratio");

    emit ChangeERC20Ratio(d4a_erc20_ratio, project_erc20_ratio, canvas_erc20_ratio);
  }

  event ChangeMaxMintableRounds(uint256 old_rounds, uint256 new_rounds);
  function changeMaxMintableRounds(uint256 _rounds) public onlyOwner{
    emit ChangeMaxMintableRounds(project_max_rounds, _rounds);
    project_max_rounds = _rounds;
  }

  event ChangeAddress(address PRB, address erc20_factory,
                      address erc721_factory, address feepool_factory,
                      address owner_proxy);
  function changeAddress(address _prb, address _erc20_factory,
                         address _erc721_factory,
                         address _feepool_factory,
                         address _owner_proxy) public onlyOwner{
    PRB = ID4APRB(_prb);
    erc20_factory = ID4AERC20Factory(_erc20_factory);
    erc721_factory = ID4AERC721Factory(_erc721_factory);
    feepool_factory = ID4AFeePoolFactory(_feepool_factory);
    owner_proxy = ID4AOwnerProxy(_owner_proxy);
    emit ChangeAddress(_prb, _erc20_factory, _erc721_factory, _feepool_factory, _owner_proxy);
  }

  event ChangeAssetPoolOwner(address new_owner);
  function changeAssetPoolOwner(address _owner) public onlyOwner{
    asset_pool_owner = _owner;
    emit ChangeAssetPoolOwner(_owner);
  }

  event ChangeFloorPrices(uint256[] prices);
  function changeFloorPrices(uint256[] memory _prices) public onlyOwner{
    delete floor_prices;
    floor_prices = _prices;
    emit ChangeFloorPrices(_prices);
  }

  event ChangeMaxNFTAmounts(uint256[] amounts);
  function changeMaxNFTAmounts(uint256[] memory _amounts) public onlyOwner{
    delete max_nft_amounts;
    max_nft_amounts = _amounts;
    emit ChangeMaxNFTAmounts(_amounts);
  }

  event ChangeD4APause(bool is_paused);
  function changeD4APause(bool is_paused) public onlyOwner{
    d4a_pause = is_paused;
    emit ChangeD4APause(is_paused);
  }

  event D4ASetProjectPaused(bytes32 project_id, bool is_paused);
  function setProjectPause(bytes32 obj_id, bool is_paused) public onlyOwner{
    pause_status[obj_id] = is_paused;
    emit D4ASetProjectPaused(obj_id, is_paused);
  }
  event D4ASetCanvasPaused(bytes32 canvas_id, bool is_paused);
  function setCanvasPause(bytes32 obj_id, bool is_paused) public onlyOwner{
    pause_status[obj_id] = is_paused;
    emit D4ASetCanvasPaused(obj_id, is_paused);
  }

  event ChangeWETHAddress(address indexed WETH);
  function changeWETHAddress(address _WETH) public onlyOwner {
    WETH = _WETH;
    emit ChangeWETHAddress(WETH);
  }
}

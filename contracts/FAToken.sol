// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./NFTreeCollection.sol";

contract FAToken is ERC20Pausable, AccessControl{
    
    bytes32 public constant BROKER_ROLE = keccak256("BROKER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    NFTreeCollection public mainCollection;
    address gaTreasury;

    event Redeemed(address indexed account, uint256 indexed amount);
    event UnsustainableTreeDeathCompensate(address indexed account, uint256 indexed amount, string projectId, uint256 tkId);

    constructor(string memory _name, string memory _symbol, address defAdmin, address broker, address _mainCollection, address _treasury) ERC20(_name, _symbol){
        require(defAdmin != address(0), "FAToken: admin address cannot be 0");
        require(broker != address(0), "FAToken: broker address cannot be 0");
        _grantRole(DEFAULT_ADMIN_ROLE, defAdmin);
        _grantRole(PAUSER_ROLE, defAdmin);
        _grantRole(BROKER_ROLE, broker);

        mainCollection = NFTreeCollection(_mainCollection);
        gaTreasury = _treasury;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice for fulfilling redemption against standard carbon offsets (?) or 
     * burning from accounts over redemption
     * @param account account to burn $FA from
     * @param amount Amount of $FA to burn from account
     */
    function redeem(address account, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(amount > 0, "FAToken: Invalid token amount");
        _burn(account, amount);
        emit Redeemed(account, amount);
    }

    function treeDeathCompensate(address account, uint256 amount,string memory _project, uint256 tkId) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(amount > 0, "FAToken: Invalid token amount");
        _burn(account, amount);
        emit UnsustainableTreeDeathCompensate(account, amount, _project, tkId);
    }

    function claim(address _recipient) external whenNotPaused {
        require(hasRole(BROKER_ROLE, msg.sender) || _recipient == msg.sender, "FAToken: Caller neither receipent nor broker");
        uint256[] memory ownedTrees = mainCollection.tokensOfOwner(_recipient);
        uint256 owed = 0;

        /* TODO: calculation for owed coins here. total fetched from chainlink, based on ownedTokens*/
        uint256 gaCommission = owed / 100;

        owed = owed - gaCommission;
        _mint(_recipient, owed);
        _mint(gaTreasury, gaCommission);
    }

}
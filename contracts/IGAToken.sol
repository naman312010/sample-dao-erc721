pragma solidity ^0.8.9;

// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IGAToken is IERC20{

    function redeem(address account, uint256 amount) external;

    function treeDeathCompensate(address account, uint256 amount,string memory _project, uint256 tkId) external;

    function mint(address to, uint256 amount) external;

    function pause() external;

    function unpause() external;

    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;
    
    function renounceRole(bytes32 role, address account) external;
}
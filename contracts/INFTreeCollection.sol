// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "erc721a/contracts/extensions/IERC721AQueryable.sol";

interface INFTreeCollection is IERC721AQueryable{
    
    function mint(uint256, address) external;

    function burn(uint256) external;

    function changeManager(address) external;

    function changeBaseUri(string memory) external;

}
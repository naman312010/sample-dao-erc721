// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/governance/utils/Votes.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";


contract NFTreeCollection is ERC721AQueryable, Votes,ERC2981 {
    address public manager;
    string public baseURI;
    address public royaltyRecipient;

    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }

    constructor(
        address _manager,
        string memory colName,
        string memory symbol,
        string memory _baseUri,
        string memory _daoVersion,
        address _defRoyaltyRecipient, // treasury/investment fund
        uint96 _defRoyaltyNumerator // out of 10000
    ) ERC721A(colName, symbol) EIP712("GA-DAO", _daoVersion) {
        require(_manager != address(0), "Project: Manager address cannot be 0");
        manager = _manager;
        baseURI = _baseUri;
        royaltyRecipient = _defRoyaltyRecipient;
        _setDefaultRoyalty(royaltyRecipient, _defRoyaltyNumerator);
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 0;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function changeBaseUri(string memory _baseUri) external onlyManager {
        baseURI = _baseUri;
    }

    function changeManager(address newManager) external onlyManager {
        require(newManager != address(0));
        manager = newManager;
    }

    function mint(uint256 quantity, address recepient) external onlyManager {
        // `_mint`'s second argument now takes in a `quantity`, not a `tokenId`.
        _mint(recepient, quantity);
    }

    function batchTransfer(
        address recipient,
        uint256[] memory tokenids
    ) external {
        require(address(0) != recipient);
        for (uint256 i = 0; i < tokenids.length; i++) {
            safeTransferFrom(msg.sender, recipient, tokenids[i]);
        }
    }

    function burn(uint256 tokenId) external onlyManager {
        _burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC2981, ERC721A, IERC721A) returns (bool) {
        // The interface IDs are constants representing the first 4 bytes
        // of the XOR of all function selectors in the interface.
        // See: [ERC165](https://eips.ethereum.org/EIPS/eip-165)
        // (e.g. `bytes4(i.functionA.selector ^ i.functionB.selector ^ ...)`)
        return
            interfaceId == 0x01ffc9a7 || // ERC165 interface ID for ERC165.
            interfaceId == 0x80ac58cd || // ERC165 interface ID for ERC721.
            interfaceId == type(IERC2981).interfaceId ||
            interfaceId == 0x5b5e139f; // ERC165 interface ID for ERC721Metadata.
    }


    // function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
    //     address previousOwner = super._update(to, tokenId, auth);

    //     _transferVotingUnits(previousOwner, to, 1);

    //     return previousOwner;
    // }

    /**
     * @dev Returns the balance of `account`.
     *
     * WARNING: Overriding this function will likely result in incorrect vote tracking.
     */
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account);
    }

    // /**
    //  * @dev See {ERC721-_increaseBalance}. We need that to account tokens that were minted in batch.
    //  */
    // function _increaseBalance(address account, uint128 amount) internal virtual override {
    //     super._increaseBalance(account, amount);
    //     _transferVotingUnits(address(0), account, amount);
    // }

    function _afterTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual override {
        _transferVotingUnits(from, to, quantity);
    }

}

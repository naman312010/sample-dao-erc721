// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./INFTreeCollection.sol";
import "./IFAToken.sol";

contract FreeAntCore {

    address public admin;
    INFTreeCollection public mainCollection;
    IFAToken public carbonToken;

    modifier onlyAdmin() {
        require(
            admin == msg.sender,
            "ProjectDeployer: only admin can access this function"
        );
        _;
    }

    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(
            _newAdmin != address(0),
            "ProjectDeployer: admin address cannot be 0"
        );
        admin = _newAdmin;
    }

    ///////////////////////////////PROJECT MANAGER//////////////////////////

    struct Project {
        string projectId;
        uint256 firstTkId;
        uint256 lastTkId;
        address promoter;
    }

    
    mapping(string => Project) public project;

    event ProjectDeployed(string projectId);

    constructor(
        address _admin, //to be set to timelock smart contract
        address _maincollection
        // string memory _baseuri,
        // string memory _daoVersion,
        // address _genesis1,
        // address _genesis2,
        // address _carbonBroker,
        // address _defRoyaltyReceiver,
        // uint96 _defRoyaltyNumerator
        // address _treasury
    ) {

        require(
            _admin != address(0),
            "ProjectDeployer: admin address cannot be 0"
        );
        // mainCollection = new NFTreeCollection(
        //     address(this),
        //     "Test FreeAnt NFTs",
        //     "TFA-NFT",
        //     _baseuri,
        //     _daoVersion,
        //     _genesis1,
        //     _genesis2,
        //     _defRoyaltyReceiver,
        //     _defRoyaltyNumerator
        // );
        // carbonToken = FAToken("$FATest", "$FAT", address(this), _carbonBroker, address(mainCollection), _treasury);
        require(
            _maincollection != address(0),
            "collection address cannot be 0"
        );
        mainCollection = INFTreeCollection(_maincollection);
        admin = _admin;
    }

    

    function deployProject(
        string memory _projectId,
        address[] memory recepients, //contains project promoter/farmer,treasury/investment fund,reserve,carbon_standard
        uint256[] memory recepientShares,
        address _promoter,
        uint256 _numberMaxTree //validation measure, totalSupplyb4Mint + sharetotal = _numberMaxTree
    ) external onlyAdmin {
        uint256 totalSupplyTrees = mainCollection.totalSupply();
        uint256 shareTotal = 0;
        require(totalSupplyTrees < _numberMaxTree, "Existing tree count more");
        require(
            recepients.length == recepientShares.length,
            "recepient number and recepientShares"
        );

        uint96 i = 0;

        for (i = 0; i < recepientShares.length; i++) {
            shareTotal = shareTotal + recepientShares[i];
        }
        require(
            shareTotal == _numberMaxTree,
            "Invalid recipientShare distribution"
        );

        for (i = 0; i < recepients.length; i++) {
            mainCollection.mint(recepientShares[i], recepients[i]);
        }

        project[_projectId] = Project(
            _projectId,
            totalSupplyTrees,
            _numberMaxTree,
            _promoter
        );
        emit ProjectDeployed(_projectId);
    }
    

    function changeBaseUri(string memory _baseUri) onlyAdmin external {
        mainCollection.changeBaseUri(_baseUri);
    }

    function changeManager(address newManager) onlyAdmin external {
        mainCollection.changeManager(newManager);
    }

    function burn(uint256 tokenId) onlyAdmin external {
        mainCollection.burn(tokenId);
    }

    ///////////////////////////////// $FA Manager////////////////////////////

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public virtual onlyAdmin {
        carbonToken.pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public virtual onlyAdmin {
        carbonToken.unpause();
    }

    function setFAToken(address _token) external onlyAdmin {
        require(address(carbonToken) == address(0), "FAToken already set");
        require(
            _token != address(0),
            "Token address cannot be 0"
        );
        carbonToken = IFAToken(_token);
    }

    /**
     * 
     * @param account account to burn $FA from
     * @param amount Amount of $FA to burn from account
     * @param _project project id of token id whose unsustainable death is being compensated
     * @param tkId token id whose unsustainable death is being compensated
     * @dev lets the dao burn trees as part of loss of tree
     */

    function treeDeathCompensate(address account, uint256 amount, string memory _project, uint256 tkId) onlyAdmin external {
        require(project[_project].lastTkId > tkId, "Project/tkid mismatch");
        carbonToken.treeDeathCompensate(account, amount, _project, tkId);
    }

    /**
     * 
     * @param account account to burn $FA from
     * @param amount Amount of $FA to burn from account
     * @dev lets the dao burn trees as part of redemption
     */

    function redeem(address account, uint256 amount) onlyAdmin external {
        carbonToken.redeem(account, amount);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) onlyAdmin public virtual{
        carbonToken.grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) onlyAdmin public virtual {
        carbonToken.revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address account) public virtual {
        carbonToken.renounceRole(role, account);
    }
}

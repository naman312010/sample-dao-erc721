const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { assert, expect } = require("chai");
const {
  PROPOSAL_DESCRIPTION,
  VOTING_DELAY,
  VOTING_PERIOD,
  PROPOSAL_THRESHOLD,
  QUORUM_PERCENTAGE,
  MIN_DELAY,
  EXECUTORS,
  PROPOSERS,
  daoVersion
} = require("../helper-hardhat-config");
const { moveBlocks } = require("../utils/move-blocks");
const { moveTime } = require("../utils/move-time");
const anyValue = () => true;

describe("Governance", async () => {

  async function deployFixture() {
    const [genesis, genesis2, random, random2, random3, random4] = await ethers.getSigners();

    /////////////////////////////////////////////////////////////////voting token/NFTree
    const nftree = await ethers.deployContract("NFTreeCollection", [
      genesis.address,// address _manager,
      "NFTree Test",// string memory colName,
      "NFTrT",// string memory symbol,
      "https://redant-api.onrender.com/nftitems/",// string memory _baseUri,
      daoVersion,// string memory _daoVersion,
      // genesis.address,// address _genesis,
      // genesis2.address,// address _genesis2,
      genesis2.address,// address _defRoyaltyRecipient, // treasury/investment fund
      100 // 1%// uint96 _defRoyaltyNumerator
    ], {
      from: genesis
    });
    await nftree.waitForDeployment(5);
    console.log("NFTreeCollection address:", await nftree.getAddress());

    //////////////////////////////////////// Timelock

    const timelock = await ethers.deployContract("TimeLock", [
      MIN_DELAY,
      PROPOSERS,
      EXECUTORS,
      genesis.address
    ], { from: genesis });
    await timelock.waitForDeployment();
    console.log("Timelock address:", await timelock.getAddress());

    // //////////////////////////////////////Governor

    const governor = await ethers.deployContract("GovernorGA", [
      await nftree.getAddress(),
      await timelock.getAddress(),
      VOTING_DELAY,
      VOTING_PERIOD,
      PROPOSAL_THRESHOLD,
      QUORUM_PERCENTAGE
    ], { from: genesis });
    await governor.waitForDeployment();
    console.log("GovernorGA address:", await governor.getAddress());

    // //////////////////////////////////////setup governance

    // let TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
    let PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    let EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    let CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    let ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

    try {
      let proposerTxn = await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress());
      let cancellerTxn = await timelock.grantRole(CANCELLER_ROLE, await governor.getAddress());
      let executorTxn = await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
    } catch (err) {
      console.log("governance setup error:", err);
    }

    await timelock.renounceRole(ADMIN_ROLE, genesis.address);

    ///////////////////////////////////////greenant core
    const Core = await ethers.getContractFactory("GreenAntCore");
    // const core = await upgrades.deployProxy(Core, [await timelock.getAddress(), await nftree.getAddress()]);
    const core = await ethers.deployContract("GreenAntCore", [
      await timelock.getAddress(),
      await nftree.getAddress()
    ], { from: genesis });
    await core.waitForDeployment(5);
    console.log("core address:", await core.getAddress());

    await nftree.connect(genesis).mint(1, genesis.address); // giving tk id 0 to genesis, so it can make proposals

    try {
      await nftree.connect(genesis).changeManager(await core.getAddress());
    } catch (err) {
      console.log("error", err);
    }
    let delegateCall = await nftree.connect(genesis).delegate(genesis.address);
    await delegateCall.wait(1);

    // Fixtures can return anything you consider useful for your tests
    return { nftree, timelock, governor, core, genesis, genesis2, random, random2, random3, random4 };
  }

  describe("Governor Flow", async () => {

    const voteWay = 1;
    const reason = "I lika do da cha cha";


    it("GAToken can only be paused through governance", async () => {
      const { nftree, timelock, governor, core, genesis, genesis2, random, random2, random3, random4 } = await loadFixture(deployFixture);
      await expect(core.pause()).to.be.reverted;
    });

    it("proposes, votes, waits, queues, and then executes", async () => {
      const { nftree, timelock, governor, core, genesis, genesis2, random, random2, random3, random4 } = await loadFixture(deployFixture);
      // propose
      const encodedFunctionCall = core.interface.encodeFunctionData("deployProject", [
        "PJ1",
        [random.address, random2.address, random3.address, random4.address], //contains project promoter/farmer,treasury/investment fund,reserve,carbon_standard
        [25, 25, 25, 25],
        random.address,
        100
      ]);
      console.log("encoded function")
      const proposeTx = await governor.propose(
        [await core.getAddress()],
        [0],
        [encodedFunctionCall],
        PROPOSAL_DESCRIPTION
      );
      const descriptionHash = ethers.id(PROPOSAL_DESCRIPTION);
      const genProposalId = await governor.hashProposal(
        [await core.getAddress()],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );
      await expect(proposeTx).to.emit(governor, "ProposalCreated").withArgs(genProposalId, anyValue, anyValue, anyValue, anyValue, anyValue, anyValue, anyValue, anyValue);
      // console.log("proposal txn sent", proposeTx)
      const proposeReceipt = await proposeTx.wait();
      // console.log("propose receipt:", proposeReceipt);
      const proposalId = genProposalId;
      let proposalState = await governor.state(proposalId);
      console.log(`Current Proposal State: ${proposalState}`);

      await moveBlocks(VOTING_DELAY + 1);
      // vote
      const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason);
      await voteTx.wait();
      proposalState = await governor.state(proposalId);
      assert.equal(proposalState.toString(), "1");
      console.log(`Current Proposal State: ${proposalState}`);
      await moveBlocks(VOTING_PERIOD + 1);

      // queue & execute
      // const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION))
      // const descriptionHash = ethers.id(PROPOSAL_DESCRIPTION);
      const queueTx = await governor.queue(
        [await core.getAddress()],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );
      await queueTx.wait();
      await moveTime(MIN_DELAY + 1);
      await moveBlocks(1);

      proposalState = await governor.state(proposalId);
      console.log(`Current Proposal State: ${proposalState}`);

      console.log("Executing...");
      console.log();
      const exTx = await governor.execute(
        [await core.getAddress()],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );
      await exTx.wait();
      console.log((await core.project("PJ1")).toString());
      expect(await nftree.balanceOf(random.address)).to.be.equal(25)
    }).timeout(1000000000000);

  });
})


const hre = require("hardhat");
const ethers = hre.ethers;
require('dotenv').config();

const {
  VOTING_DELAY,
  VOTING_PERIOD,
  PROPOSAL_THRESHOLD,
  QUORUM_PERCENTAGE,
  MIN_DELAY,
  EXECUTORS,
  PROPOSERS,
  daoVersion
} = require("../helper-hardhat-config");



async function main() {

  const [genesis1, genesis2, GATreasury] = await ethers.getSigners();

  /////////////////////////////////////////////////////////////////voting token/NFTree
  const nftree = await ethers.deployContract("NFTreeCollection", [
    genesis1.address,// address _manager,
    "NFTree Test",// string memory colName,
    "NFTrT",// string memory symbol,
    "https://redant-api.onrender.com/nftitems/",// string memory _baseUri,
    daoVersion,// string memory _daoVersion,
    genesis2.address,// address _defRoyaltyRecipient, // treasury/investment fund
    100 // 1%// uint96 _defRoyaltyNumerator
  ], {
    from: genesis1
  });
  await nftree.waitForDeployment(10);
  console.log("NFTreeCollection address:", await nftree.getAddress());

  //////////////////////////////////////// Timelock

  const timelock = await ethers.deployContract("TimeLock", [
    MIN_DELAY,
    PROPOSERS,
    EXECUTORS,
    genesis1.address
  ], { from: genesis1 });
  await timelock.waitForDeployment(10);
  console.log("Timelock address:", await timelock.getAddress());

  

  // //////////////////////////////////////Governor

  const governor = await ethers.deployContract("GovernorGA", [
    await nftree.getAddress(),
    await timelock.getAddress(),
    VOTING_DELAY,
    VOTING_PERIOD,
    PROPOSAL_THRESHOLD,
    QUORUM_PERCENTAGE
  ], { from: genesis1 });
  await governor.waitForDeployment(10);
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

  await timelock.renounceRole(ADMIN_ROLE, genesis1.address);

  ///////////////////////////////////////greenant core
  const core = await ethers.deployContract("GreenAntCore", [
    await timelock.getAddress(),
    await nftree.getAddress()
  ], { from: genesis1 });
  await core.waitForDeployment(10);
  console.log("core address:", await core.getAddress());

  

  await nftree.connect(genesis1).mint(1, genesis1.address);

  try {
    await nftree.connect(genesis1).changeManager(await core.getAddress());
  } catch (err) {
    console.log("error", err);
  }

  

  await hre.run("verify:verify", {
    address: await nftree.getAddress(),
    contract: "contracts/NFTreeCollection.sol:NFTreeCollection",
    constructorArguments: [
      genesis1.address,// address _manager,
      "NFTree Test",// string memory colName,
      "NFTrT",// string memory symbol,
      "https://redant-api.onrender.com/nftitems/",// string memory _baseUri,
      daoVersion,// string memory _daoVersion,
      genesis2.address,// address _defRoyaltyRecipient, // treasury/investment fund
      100 // 1%// uint96 _defRoyaltyNumerator
    ],
  });

  await hre.run("verify:verify", {
    address: await timelock.getAddress(),
    contract: "contracts/governance/TimeLock.sol:TimeLock",
    constructorArguments: [
      MIN_DELAY,
      PROPOSERS,
      EXECUTORS,
      genesis1.address
    ],
  });

  await hre.run("verify:verify", {
    address: await governor.getAddress(),
    contract: "contracts/governance/GovernorGA.sol:GovernorGA",
    constructorArguments: [
      await nftree.getAddress(),
      await timelock.getAddress(),
      VOTING_DELAY,
      VOTING_PERIOD,
      PROPOSAL_THRESHOLD,
      QUORUM_PERCENTAGE
    ],
  });

  await hre.run("verify:verify", {
    address: await core.getAddress(),
    contract: "contracts/GreenAntCore.sol:GreenAntCore",
    constructorArguments: [
      await timelock.getAddress(),
      await nftree.getAddress()
    ],
  });

  /////////////////////GA Token

   // const gaToken = await ethers.deployContract("GAToken", [
  //   "GAToken", "GAT", await core.getAddress(), genesis2.address, await nftree.getAddress(), GATreasury.address
  // ], { from: genesis1 });
  // await gaToken.waitForDeployment(5);
  // console.log("GAToken address:", await gaToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
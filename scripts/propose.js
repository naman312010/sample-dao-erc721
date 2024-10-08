const { ethers, network } = require("hardhat");
const fs = require("fs");
const { moveBlocks } = require("../utils/move-blocks");

const {
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  FUNC,
  PROPOSAL_DESCRIPTION,
  NEW_STORE_VALUE,
} = require("../helper-hardhat-config");

async function propose(args, functionToCall, proposalDescription, govAddress, coreAddress) {
  const governor = await ethers.getContractAt("GovernorFA", govAddress);
  const core = await ethers.getContractAt("FreeAntCore",coreAddress );
  const encodedFunctionCall = core.interface.encodeFunctionData(functionToCall, args);
  console.log(`Proposing ${functionToCall} on ${core.address} with ${args}`);
  console.log(`Proposal Description:\n  ${proposalDescription}`);
  const proposeTx = await governor.propose(
    [core.address],
    [0],
    [encodedFunctionCall],
    proposalDescription
  );
  // If working on a development chain, we will push forward till we get to the voting period.
  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_DELAY + 1);
  }
  const proposeReceipt = await proposeTx.wait(1);
  const proposalId = proposeReceipt.events[0].args.proposalId;
  console.log(`Proposed with proposal ID:\n  ${proposalId}`);

  const proposalState = await governor.state(proposalId);
  const proposalSnapShot = await governor.proposalSnapshot(proposalId);
  const proposalDeadline = await governor.proposalDeadline(proposalId);
  // save the proposalId
  storeProposalId(proposalId);

  // the Proposal State is an enum data type, defined in the IGovernor contract.
  // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
  console.log(`Current Proposal State: ${proposalState}`);
  // What block # the proposal was snapshot
  console.log(`Current Proposal Snapshot: ${proposalSnapShot}`);
  // The block number the proposal voting expires
  console.log(`Current Proposal Deadline: ${proposalDeadline}`);
}

function storeProposalId(proposalId) {
  const chainId = network.config.chainId.toString();
  let proposals;

  if (fs.existsSync(proposalsFile)) {
    proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  } else {
    proposals = {};
    proposals[chainId] = [];
  }
  proposals[chainId].push(proposalId.toString());
  fs.writeFileSync(proposalsFile, JSON.stringify(proposals), "utf8");
}

propose([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

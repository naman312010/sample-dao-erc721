const { ethers, network } = require("hardhat");
const {
  MIN_DELAY,
  developmentChains,
} = require("../helper-hardhat-config.js");
const { moveBlocks } = require("../utils/move-blocks");
const { moveTime } = require("../utils/move-time");

async function queueAndExecute(args, functionNameToCall, coreAddress, governorAddress, proposalDescription) {
  const core = await ethers.getContractAt("GreenAntCore", coreAddress);
  const encodedFunctionCall = core.interface.encodeFunctionData(functionNameToCall, args);
  const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription));
  // could also use ethers.id(PROPOSAL_DESCRIPTION)

  const governor = await ethers.getContractAt("GovernorGA", governorAddress);
  console.log("Queueing...");
  const queueTx = await governor.queue([core.address], [0], [encodedFunctionCall], descriptionHash);
  await queueTx.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveTime(MIN_DELAY + 1);
    await moveBlocks(1);
  }

  console.log("Executing...");
  // this will fail on a testnet because you need to wait for the MIN_DELAY!
  const executeTx = await governor.execute(
    [core.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await executeTx.wait(1);
  console.log(`core value: ${await core.retrieve()}`);
}

queueAndExecute()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

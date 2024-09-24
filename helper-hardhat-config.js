const networkConfig = {
  localhost: {},
  hardhat: {},
  sepolia: {
    blockConfirmations: 6,
  },
};

const developmentChains = ["hardhat", "localhost"];
const proposalsFile = "proposals.json";

// Governor Values
const QUORUM_PERCENTAGE = 4; // Need 4% of voters to pass
const MIN_DELAY = 3600; // 1 hour - after a vote passes, you have 1 hour before you can enact
// const VOTING_PERIOD = 45818; // 1 week - how long the vote lasts. This is pretty long even for local tests
const VOTING_PERIOD = 14400 ; //14400 blocks , about 1 day for polygon pos, how many blocks duration in which one can vote
const VOTING_DELAY = 600 ; // 600 Block - How many blocks till a proposal vote becomes active
const PROPOSAL_THRESHOLD = 1; //how many tokens required to make a proposal
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

const EXECUTORS = [];
const PROPOSERS = [];
const daoVersion = "0.0.1"

const PROPOSAL_DESCRIPTION = "Proposal #1 77 in the Box!";

module.exports = {
  networkConfig,
  developmentChains,
  proposalsFile,
  QUORUM_PERCENTAGE,
  MIN_DELAY,
  VOTING_PERIOD,
  VOTING_DELAY,
  PROPOSAL_THRESHOLD,
  ADDRESS_ZERO,
  PROPOSAL_DESCRIPTION,
  EXECUTORS ,
  PROPOSERS ,
  daoVersion
}

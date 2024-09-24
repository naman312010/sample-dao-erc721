require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
// require("hardhat-contract-sizer");
require('@openzeppelin/hardhat-upgrades');
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.alchemy_key_mumbai}`,
      accounts: [process.env.genesis1_pvt_key, process.env.genesis2_pvt_key]
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.alchemy_key_goerli}`,
      accounts: [process.env.genesis1_pvt_key, process.env.genesis2_pvt_key]
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000000,
      },
      viaIR: false,
    }
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: false,
    // only: [':ERC20$'],
  },
  etherscan: {
    
    apiKey: {
      polygonMumbai: `${process.env.mumbai_polygonscan_key}`
    },
  },
};

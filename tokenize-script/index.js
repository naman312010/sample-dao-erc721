const ethers = require("ethers");
const abi = require("./GreenAntCore.json");
require('dotenv').config();
async function deployProject(
    _projectId, //string project id eg: "VIET1"
    recepients, //array of addresses among which tokens will be distributed. eg: ["0x9C199a97B784a694E4b72709f1fcf12215903E21","0x500DA9451Bf301d56a9923973d9C2D77B8A4338a"]
    recepientShares, //number of tokens to distribute for respective addresses (but as string). eg: ["500","20"])
    _promoter, //project promoter address (person who applied) eg: "0x9C199a97B784a694E4b72709f1fcf12215903E21"
    _numberMaxTree //equals current totalSupply(last tokenId) + sum of recipientShares eg: 1000(prev) + 520 = 1520
    ) {

    let url = `https://polygon-mumbai.g.alchemy.com/v2/${process.env.alchemy_key_mumbai}`;
    let provider = new ethers.JsonRpcProvider(url);
    let account = await ethers.BaseWallet(process.env.genesis1_pvt_key);
    let GAcore = ethers.Contract(`${process.env.mumbai_core_addr}`,abi, provider);
    
    console.log(await GAcore.connect(account).deployProject(
        _projectId,
        recepients, //contains project promoter/farmer,treasury/investment fund,reserve,carbon_standard
        recepientShares,
        _promoter,
        _numberMaxTree //validation measure, totalSupplyb4Mint + sharetotal = _numberMaxTree
    ));

    
}
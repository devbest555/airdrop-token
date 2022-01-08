import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BigNumber, utils } from 'ethers';

let { MerkleTree } = require('../test/helpers/merkleTree.js');
let recipients = require('../test/helpers/recipients.json');

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    ethers: { getSigners },
  } = hre;

  const deployer = (await getSigners())[0]; 
  const airdropToken = await get('AirdropToken');

  recipients = recipients.map((recipient:any) => ({
    account: utils.getAddress(recipient.account),
    amount: BigNumber.from(recipient.amount)
  }));
  let merkleTree = new MerkleTree(recipients);
  let root = merkleTree.getHexRoot();

  await deploy('AirdropSender', {
    from: deployer.address,
    args: [
      airdropToken.address,
      root
    ],
    log: true,    
    skipIfAlreadyDeployed: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

func.id = 'deploy_airdrop_sender'; // id required to prevent reexecution
func.tags = ['AirdropSender'];
func.dependencies = ['AirdropToken'];

export default func;
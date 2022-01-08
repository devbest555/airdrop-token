import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    ethers: { getSigners },
  } = hre;

  const deployer = (await getSigners())[0]; 
        
  await deploy('AirdropToken', {
    from: deployer.address,
    args: [
      'Airdrop Token', 'ADT', 10**6
    ],
    log: true,    
    skipIfAlreadyDeployed: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });  
};

func.id = 'deploy_airdrop_token'; // id required to prevent reexecution
func.tags = ['AirdropToken'];

export default func;
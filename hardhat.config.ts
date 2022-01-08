'use strict';

import "dotenv/config";

import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import '@typechain/hardhat';
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "hardhat-deploy"
import "@nomiclabs/hardhat-etherscan"

dotenvConfig({ path: resolve(__dirname, "./.env") });

const alchemy_api_key = process.env.ALCHEMY_KEY;
const etherScan_api_key = process.env.ETHERSCAN_API_KEY;
const mnemonic = process.env.MNEMONIC;

if (!mnemonic || !alchemy_api_key || !etherScan_api_key) {
  throw new Error("Please set your data in a .env file");
}

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
  bscmainnet: 56,
  bsctestnet: 97
};

function nodeAlchemy(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = "https://eth-" + network + ".alchemyapi.io/v2/" + alchemy_api_key;
  return {
    url: url,
    accounts: { mnemonic },
    chainId: chainIds[network],
    saveDeployments: true,
    live: true,
  };
}

function nodeBSC(network: keyof typeof chainIds, rpc_url: any): NetworkUserConfig {
  let node;
  if(chainIds[network] == 56) {
    node = {
      url: rpc_url,
      accounts: { mnemonic },
      chainId: chainIds[network],
      saveDeployments: true,
      live: true,
    };
  } else {
    node = {
      url: rpc_url,
      accounts: { mnemonic },
      chainId: chainIds[network],
      saveDeployments: true,
      live: true,      
      tags: ["staging"],
      gasMultiplier: 2,
    };
  }
  return node;
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: { mnemonic },
      // chainId: chainIds.rinkeby,
      saveDeployments: true,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${alchemy_api_key}`,
      },                 
    },
    kovan: nodeAlchemy("kovan"),
    rinkeby: nodeAlchemy("rinkeby"),
    ropsten: nodeAlchemy('ropsten'),
    mainnet: nodeAlchemy('mainnet'),    
    bscmainnet: nodeBSC('bscmainnet', 'https://bsc-dataseed.binance.org/'),
    bsctestnet: nodeBSC('bsctestnet', 'https://data-seed-prebsc-1-s1.binance.org:8545')
  },
  etherscan: {
    apiKey: etherScan_api_key
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",    
  },
  solidity: {
    compilers: [
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      }
    ],
  },
  mocha: {
    timeout: 200e3
  },  
};

export default config;

require("@nomiclabs/hardhat-ethers");
require('dotenv').config();

const Web3Wallet = require('./utils/Web3Wallet');
const { RPC_PROVIDER, NETWORK, RPC_PORT } = require('./utils/config');

// Get private key
const web3Wallet = new Web3Wallet({
  mnemonic: process.env.MNEMONIC,
  rpcProvider: RPC_PROVIDER,
  network: NETWORK,
  numberOfWallets: 1,
});

const privateKey = web3Wallet.bip44Wallet[0][0].privateKey;

module.exports = {
  solidity: "0.8.10",
  defaultNetwork: 'localhost',
  paths: {
    artifacts: "./domain-app/artifacts",
  },
  networks: {
    hardhat: {},
    localhost: {
      url: `http://127.0.0.1:${RPC_PORT.GANACHE}`,
    },
    mumbai: {
      url: process.env.ALCHEMY_MUMBAI_URL,
      accounts: [privateKey],
    },
    rinkeby: {
      url: process.env.ALCHEMY_RINKEBY_URL,
      accounts: [privateKey],
    },
    kovan: {
      url: process.env.ALCHEMY_KOVAN_URL,
      accounts: [privateKey],
    }
  }
};

import { HardhatUserConfig } from "hardhat/config"
import "dotenv/config"
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-etherscan"
import "hardhat-deploy"
import "solidity-coverage"
import "hardhat-gas-reporter"
import "hardhat-contract-sizer"
import "@typechain/hardhat"

const RINKEBY_PROVIDER_URL = process.env.RPC_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
// const COINMARTKETCAP_API_KEY = process.env.COINMARTKETCAP_API_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const SUBCRIPTION_ID = process.env.SUBCRIPTION_ID || ""
const config: HardhatUserConfig = {
  solidity: "0.8.9",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      // @ts-ignore
      blockConfirmations: 1,
      saveDeployments: true,
      allowUnlimitedContractSize: true,
    },
    rinkeby: {
      chainId: 4,
      // @ts-ignore
      blockConfirmations: 6,
      url: RINKEBY_PROVIDER_URL,
      accounts: [PRIVATE_KEY],
    },
    localhost: {
      chainId: 31337,
      // @ts-ignore
      blockConfirmations: 1,
      gas: 21000000,
      gasPrice: 8000000000,
      saveDeployments: true,
      allowUnlimitedContractSize: true,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-reporter-report.txt",
    // coinmarketcap: COINMARTKETCAP_API_KEY,
    token: "ETH",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 5000000, // 5 minutes
  },
  contractSizer: {
    runOnCompile: false,
    only: ["Raffle"],
  },
}
export default config

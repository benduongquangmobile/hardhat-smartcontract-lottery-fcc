import { developmentChains } from "./../helper-hardhat-config"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { ethers, network } from "hardhat"

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9
const args = [BASE_FEE, GAS_PRICE_LINK]

export default async function deployRaffer({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  if (developmentChains.includes(network.name)) {
    const contract = await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      args: args,
      log: true,
      // @ts-ignore
      waitConfirmations: network.config.blockConfirmations,
    })
    log("--------------------------------------")
    log("VRFCoordinatorV2Mock", contract.address)
    log("--------------------------------------")
  }
}

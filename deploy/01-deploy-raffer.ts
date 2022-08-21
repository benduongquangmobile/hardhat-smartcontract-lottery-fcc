import { VRFCoordinatorV2Mock } from "./../typechain-types/@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock"
import { developmentChains, networkConfig } from "./../helper-hardhat-config"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { ethers, network } from "hardhat"
import { verify } from "../utils/verify"

const VRF_SUB_FUND_AMMOUNT = ethers.utils.parseEther("30")

export default async function deployRaffer({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!
  let subcriptionId, vrfCoordinatorAddress, vrfCoordinatorV2Mock
  if (developmentChains.includes(network.name)) {
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    vrfCoordinatorAddress = await vrfCoordinatorV2Mock.address
    const transactionRespone = await vrfCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transactionRespone.wait(1)
    subcriptionId = transactionReceipt.events[0].args.subId
    await vrfCoordinatorV2Mock.fundSubscription(
      subcriptionId,
      VRF_SUB_FUND_AMMOUNT
    )
  } else {
    vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinatorV2
    subcriptionId = networkConfig[chainId].subscriptionId
  }

  const entranceFee = networkConfig[chainId].entranceFe
  const gasLane = networkConfig[chainId].gasLane
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit
  const interval = networkConfig[chainId].interval

  const args = [
    vrfCoordinatorAddress,
    entranceFee,
    gasLane,
    subcriptionId,
    callbackGasLimit,
    interval,
  ]
  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    // @ts-ignore
    waitConfirmations: network.config.blockConfirmations,
  })
  if (developmentChains.includes(network.name)) {
    await vrfCoordinatorV2Mock?.addConsumer(subcriptionId, raffle.address)
  }

  log("--------------------------------------")
  log(`Raffle deployed at ${raffle.address}`)
  log("--------------------------------------")
  if (!developmentChains.includes(network.name)) {
    log("--------------------------------------")
    log("verifying deployment")
    await verify(raffle.address, args)
    log("--------------------------------------")
  }
}

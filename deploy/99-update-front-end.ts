import { ethers, network } from "hardhat"
import fs from "fs"

const FRONT_END_PATH_FILE =
  "../../Frontend/lottery-front-end/constants/contractsAddress.json"

const FRONT_END_ABI_PATH_FILE =
  "../../Frontend/lottery-front-end/constants/abi.json"

export default async function deployRaffle() {
  if (process.env.UPDATE_FRONT_END) {
    console.log("--------------------------------------")
    console.log("Updating front end")
    console.log("--------------------------------------")
    await updateContractAddress()
    await uppdateAbi()
  }
}

async function updateContractAddress() {
  try {
    const raffle = await ethers.getContract("Raffle")
    const currentAddress = JSON.parse(
      fs.readFileSync(FRONT_END_PATH_FILE, "utf8")
    ) as any
    const chainId = network.config.chainId?.toString() as string
    if (chainId! in currentAddress) {
      if (!currentAddress[chainId].includes(raffle.address)) {
        currentAddress[chainId].push(raffle.address)
      }
    } else {
      currentAddress[chainId] = [raffle.address]
    }
    fs.writeFileSync(FRONT_END_PATH_FILE, JSON.stringify(currentAddress))
  } catch (error) {
    console.log("updateContractAddress ~ error", error)
  }
}

async function uppdateAbi() {
  try {
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(
      FRONT_END_ABI_PATH_FILE,
      raffle.interface.format(ethers.utils.FormatTypes.json) as any
    )
  } catch (error) {
    console.log("uppdateAbi ~ error", error)
  }
}

export const tags = ["all", "front-end"]

import { ethers } from "hardhat"
import { BigNumber } from "./node_modules/@ethersproject/bignumber/src.ts/bignumber"

export interface networkConfigItem {
  name?: string
  subscriptionId?: string
  gasLane?: string
  raffleEntranceFee?: string
  callbackGasLimit?: string
  vrfCoordinatorV2?: string
  entranceFe?: BigNumber
  keepersUpdateInterval?: string
}

export interface networkConfigInfo {
  [key: number]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
  4: {
    name: "rinkeby",
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab", //VRF Coordinator //https://docs.chain.link/docs/vrf/v2/supported-networks/
    entranceFe: ethers.utils.parseEther("0.01"),
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", //30 gwei Key Hash //https://docs.chain.link/docs/vrf/v2/supported-networks/
    subscriptionId: "20251",
    callbackGasLimit: "500000", //500.000,
    keepersUpdateInterval: "50",
  },
  31337: {
    name: "hardhat",
    callbackGasLimit: "500000", //500.000,
    entranceFe: ethers.utils.parseEther("0.01"),
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", //30 gwei Key Hash //https://docs.chain.link/docs/vrf/v2/supported-networks/
    keepersUpdateInterval: "50",
  },
}

export const developmentChains = ["hardhat", "localhost"]

export const DECIMALS = 8
export const INITIAL_ANSWER = 2 * 1e11

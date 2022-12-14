import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { BigNumber } from "ethers"
import { network, deployments, ethers, getNamedAccounts } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", function () {
      let raffle: Raffle
      let raffleContract: Raffle
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
      let raffleEntranceFee: BigNumber
      let keepersUpdateInterval: number
      let player: SignerWithAddress
      let accounts: SignerWithAddress[]

      beforeEach(async () => {
        accounts = await ethers.getSigners() // could also do with getNamedAccounts
        player = accounts[1]
        await deployments.fixture()
        raffleContract = await ethers.getContract("Raffle")
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        raffle = raffleContract.connect(player)
        raffleEntranceFee = await raffle.getEntranceFee()
        keepersUpdateInterval = (await raffle.getInterval()).toNumber()
        console.log("beforeEach ~ keepersUpdateInterval", keepersUpdateInterval)
      })

      describe("constructor", function () {
        it("intitiallizes the raffle correctly", async () => {
          console.log(network.config.chainId)
          // Ideally, we'd separate these out so that only 1 assert per "it" block
          // And ideally, we'd make this check everything
          const raffleState = (await raffle.getRaffleState()).toString()
          assert.equal(raffleState, "0")
          assert.equal(
            keepersUpdateInterval.toString(),
            networkConfig[network.config.chainId!]["keepersUpdateInterval"]
          )
        })
      })

      describe("enterRaffle", function () {
        it("reverts when you don't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            "Raffle__NotEnoughETHEntered"
          )
        })
        it("records player when they enter", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          const contractPlayer = await raffle.getPlayer(0)
          assert.equal(player.address, contractPlayer)
        })
        it("emits event on enter", async () => {
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(raffle, "RaffleEnter")
        })
        it("doesn't allow entrance when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            keepersUpdateInterval + 1,
          ])
          await network.provider.request({ method: "evm_mine", params: [] })
          // we pretend to be a keeper for a second
          await raffle.performUpkeep([])
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWith("Raffle__RaffleNotOpen")
        })
      })
      describe("checkUpkeep", function () {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            keepersUpdateInterval + 1,
          ])
          await network.provider.request({ method: "evm_mine", params: [] })
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
          assert(!upkeepNeeded)
        })
        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            keepersUpdateInterval + 1,
          ])
          await network.provider.request({ method: "evm_mine", params: [] })
          await raffle.performUpkeep([])
          const raffleState = await raffle.getRaffleState()
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
          assert.equal(raffleState.toString() == "1", upkeepNeeded == false)
        })
        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            keepersUpdateInterval - 1,
          ])
          await network.provider.request({ method: "evm_mine", params: [] })
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
          assert(!upkeepNeeded)
        })
        // it("returns true if enough time has passed, has players, eth, and is open", async () => {
        //   await raffle.enterRaffle({ value: raffleEntranceFee })
        //   await network.provider.send("evm_increaseTime", [
        //     keepersUpdateInterval + 1,
        //   ])
        //   await network.provider.request({ method: "evm_mine", params: [] })
        //   const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
        //   assert(upkeepNeeded)
        // })
      })

      describe("performUpkeep", function () {
        it("can only run if checkupkeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            keepersUpdateInterval + 1,
          ])
          await network.provider.request({ method: "evm_mine", params: [] })
          const tx = await raffle.performUpkeep("0x")
          assert(tx)
        })
        it("reverts if checkup is false", async () => {
          await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
            "Raffle__UpkeepNotNeeded"
          )
        })
        it("updates the raffle state and emits a requestId", async () => {
          // Too many asserts in this test!
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            keepersUpdateInterval + 1,
          ])
          await network.provider.request({ method: "evm_mine", params: [] })
          const txResponse = await raffle.performUpkeep("0x")
          const txReceipt = await txResponse.wait(1)
          const raffleState = await raffle.getRaffleState()
          const requestId = txReceipt!.events![1].args!.requestId
          assert(requestId.toNumber() > 0)
          assert(raffleState == 1)
        })
      })
      describe("fulfillRandomWords", function () {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            keepersUpdateInterval + 1,
          ])
          await network.provider.request({ method: "evm_mine", params: [] })
        })
        it("can only be called after performupkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith("nonexistent request")
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
          ).to.be.revertedWith("nonexistent request")
        })
        // This test is too big...
        it("picks a winner, resets, and sends money", async () => {
          let indexWinner: number
          const additionalEntrances = 6
          const startingIndex = 2
          for (
            let i = startingIndex;
            i < startingIndex + additionalEntrances;
            i++
          ) {
            raffle = raffleContract.connect(accounts[i])
            await raffle.enterRaffle({ value: raffleEntranceFee })
          }
          const startingTimeStamp = await raffle.getLastTimeStamp()
          const getNumbersPlayers = await raffle.getNumberOfPlayers()
          console.log("it ~ getNumbersPlayers", getNumbersPlayers.toString())
          // This will be more important for our staging tests...
          await new Promise<void>(async (resolve, reject) => {
            raffle.once("WinnerPicked", async (recentWinner) => {
              console.log("raffle.once ~ index", recentWinner)
              console.log("WinnerPicked event fired!")
              // assert throws an error if it fails, so we need to wrap
              // it in a try/catch so that the promise returns event
              // if it fails.
              indexWinner = accounts.findIndex(
                (account) => account.address == recentWinner
              )
              console.log("raffle.once ~ indexWinner", indexWinner)
              console.log("recentWinner", recentWinner)
              try {
                // Now lets get the ending values...
                const raffleState = await raffle.getRaffleState()
                const winnerBalance = await accounts[indexWinner].getBalance()
                console.log(
                  "raffle.once ~ winnerBalance",
                  winnerBalance.toString()
                )
                const endingTimeStamp = await raffle.getLastTimeStamp()
                await expect(raffle.getPlayer(0)).to.be.reverted
                assert.equal(
                  recentWinner.toString(),
                  accounts[indexWinner].address
                )
                assert.equal(raffleState, 0)
                assert(endingTimeStamp > startingTimeStamp)
                resolve()
              } catch (e) {
                reject(e)
              }
            })
            const tx = await raffle.performUpkeep("0x")
            const txReceipt = await tx.wait(1)
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              txReceipt!.events![1].args!.requestId,
              raffle.address
            )
          })
        })
      })
    })

import "@nomiclabs/hardhat-ethers"
import "dotenv/config"
import { run } from "hardhat"

export async function verify(contractAddress: string, args: any[]) {
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    })
  } catch (error: any) {
    if (error.message.includes("verify:verify")) {
      console.log("Deployment verified")
    } else {
      console.log("Deployment failed", error)
    }
  }
}

import { ethers, network, deployments } from "hardhat"
import fs from "fs"
import { Deployment } from "hardhat-deploy/dist/types"

const frontEndContractsFile = "../vista-fundraising-next-app/src/constants/networkMapping.json"
const frontEndAbiLocation = "../vista-fundraising-next-app/src/constants/"

async function UpdateFrontend() {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating front end contract addresses...")
    const { get } = deployments
    const marketplaceDeployment = await get("CrowdfundMarket")
    const crowdfundDeployment = await get("Crowdfund")

    await updateContractAddresses(marketplaceDeployment)
    await updateAbi(marketplaceDeployment, crowdfundDeployment)
  }
}

async function updateContractAddresses(marketplaceDeployment: Deployment) {
  const chainId = network.config.chainId as number

  const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
  if (chainId in contractAddresses) {
    if (
      !contractAddresses[chainId]["CrowdfundMarketplace"].includes(marketplaceDeployment.address)
    ) {
      contractAddresses[chainId]["CrowdfundMarketplace"].push(marketplaceDeployment.address)
    }
  } else {
    contractAddresses[chainId] = { CrowdfundMarketplace: [marketplaceDeployment.address] }
  }

  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
  console.log("---------------------------------------------------")
}

async function updateAbi(marketplaceDeployment: Deployment, crowdfundDeployment: Deployment) {
  fs.writeFileSync(
    `${frontEndAbiLocation}CrowdfundMarketplace.json`,
    JSON.stringify(marketplaceDeployment.abi) //crowdfundMarketplace.interface.formatJson()
  )
  fs.writeFileSync(`${frontEndAbiLocation}Crowdfund.json`, JSON.stringify(crowdfundDeployment.abi))
}

export default UpdateFrontend
UpdateFrontend.tags = ["all", "frontend"]

import { ethers, network, deployments } from "hardhat"
import { ethers as eth } from "ethers"
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
  const crowdfundMarketplace = await ethers.getContractAt(
    marketplaceDeployment.abi,
    marketplaceDeployment.address
  )
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
  const crowdfundMarketplace = await ethers.getContractAt(
    marketplaceDeployment.abi,
    marketplaceDeployment.address
  )
  fs.writeFileSync(
    `${frontEndAbiLocation}CrowdfundMarketplace.json`,
    crowdfundMarketplace.interface.formatJson()
  )
  const crowdfund = await ethers.getContractAt(crowdfundDeployment.abi, crowdfundDeployment.address)
  fs.writeFileSync(`${frontEndAbiLocation}Crowdfund.json`, crowdfund.interface.formatJson())
}

export default UpdateFrontend
UpdateFrontend.tags = ["all", "frontend"]

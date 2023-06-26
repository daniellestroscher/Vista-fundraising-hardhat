import { network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { localChains, networkConfig } from "../hardhat-helper-config"
import { verify } from "../utils/verify"

const DeployCrowdfund: DeployFunction = async ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId as number

  const args: any = [100, deployer] //goal in wei //address of deployer
  const crowdfund = await deploy("Crowdfund", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
  })
  log("--------------------------------------------------------")

  if (!localChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...")
    await verify(crowdfund.address, args)
  }
}
export default DeployCrowdfund
DeployCrowdfund.tags = ["all", "crowdfund"]

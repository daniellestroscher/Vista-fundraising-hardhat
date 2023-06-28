import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { GOAL, localChains } from "../../hardhat-helper-config"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { Contract } from "ethers"

!localChains.includes(network.name)
  ? describe.skip
  : describe("CrowdfundMarket", function () {
      let crowdfundMarketplace: Contract,
        deployer: HardhatEthersSigner,
        accountTwo: HardhatEthersSigner
      this.beforeEach(async function () {
        const { get } = deployments
        await deployments.fixture(["market"])
        const deployerAddress = (await getNamedAccounts()).deployer
        deployer =
          (await ethers.getSigners()).find((signer) => {
            signer.address == deployerAddress
          }) || (await ethers.getSigners())[0]
        const accountTwoAddress = (await getNamedAccounts()).accountTwo
        accountTwo =
          (await ethers.getSigners()).find((signer) => {
            signer.address == accountTwoAddress
          }) || (await ethers.getSigners())[1]

        const crowdfundMarketplaceDeploy = await get("CrowdfundMarket")
        crowdfundMarketplace = await ethers.getContractAt(
          crowdfundMarketplaceDeploy.abi,
          crowdfundMarketplaceDeploy.address
        )
      })

      describe("Deployment", function () {
        it("Should deploy crowdfunds from any account with correct values", async function () {
          const goal = ethers.parseEther("1")
          const deployedFromOwner = await crowdfundMarketplace.createCrowdfund(GOAL, "")
          const addressFromOwner = (await crowdfundMarketplace.getCrowdfund(1)).crowdfundContract

          const deployedFromOtherAccount = await (
            crowdfundMarketplace.connect(accountTwo) as Contract
          ).createCrowdfund(GOAL, "")
          const addressFromOtherAccount = (await crowdfundMarketplace.getCrowdfund(2))
            .crowdfundContract

          await expect(deployedFromOwner)
            .to.emit(crowdfundMarketplace, "CrowdfundCreated")
            .withArgs(1, "", addressFromOwner, deployer.address, goal)
          await expect(deployedFromOtherAccount)
            .to.emit(crowdfundMarketplace, "CrowdfundCreated")
            .withArgs(2, "", addressFromOtherAccount, accountTwo.address, goal)
        })
      })

      describe("Getters", function () {
        describe("getActiveFundraisers", function () {
          it("should get only the active fundraisers (goal not reached)", async function () {
            await crowdfundMarketplace.createCrowdfund(GOAL, "")
            const address = (await crowdfundMarketplace.getCrowdfund(1)).crowdfundContract
            await crowdfundMarketplace.createCrowdfund(GOAL, "")
            await crowdfundMarketplace.createCrowdfund(GOAL, "")

            let crowdfundTwo = await ethers.getContractAt("Crowdfund", address)
            await crowdfundTwo.donate({ value: GOAL })

            const activeFundraisers = await crowdfundMarketplace.getActiveFundraisers()
            expect(await activeFundraisers).to.have.lengthOf(2)
          })
        })
        describe("getMyFundraisers", function () {
          it("should only get the fundraisers owned by the message sender", async function () {
            await crowdfundMarketplace.createCrowdfund(GOAL, "")
            await crowdfundMarketplace.createCrowdfund(GOAL, "")
            await (crowdfundMarketplace.connect(accountTwo) as Contract).createCrowdfund(GOAL, "")
            const fundraisers = await crowdfundMarketplace.getMyFundraisers()

            expect(await fundraisers).to.have.lengthOf(2)
            expect(await fundraisers[0].crowdfundContract).to.equal(
              (await crowdfundMarketplace.getCrowdfund(1)).crowdfundContract
            )
            expect(await fundraisers[1].crowdfundContract).to.equal(
              (await crowdfundMarketplace.getCrowdfund(2)).crowdfundContract
            )

            const otherAccountFundraisers = await (
              crowdfundMarketplace.connect(accountTwo) as Contract
            ).getMyFundraisers()
            expect(await otherAccountFundraisers).to.have.length(1)
            expect(await otherAccountFundraisers[0].crowdfundContract).to.equal(
              (await crowdfundMarketplace.getCrowdfund(3)).crowdfundContract
            )
          })
        })
      })
    })

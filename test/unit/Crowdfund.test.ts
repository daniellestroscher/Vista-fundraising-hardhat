import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { GOAL, localChains } from "../../hardhat-helper-config"
import { Contract } from "ethers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

!localChains.includes(network.name)
  ? describe.skip
  : describe("Crowdfund", function () {
      let crowdfund: Contract, deployer: HardhatEthersSigner, accountTwo: HardhatEthersSigner

      this.beforeEach(async function () {
        const { get } = deployments
        await deployments.fixture(["crowdfund"])
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

        const crowdfundDeploy = await get("Crowdfund")
        crowdfund = await ethers.getContractAt(crowdfundDeploy.abi, crowdfundDeploy.address)
      })

      describe("Deployment", function () {
        it("Should set the right goal", async function () {
          let contractGoal = await crowdfund.getGoal()
          expect(contractGoal.toString()).to.equal(GOAL.toString())
        })

        it("Should set the right owner", async function () {
          expect(await crowdfund.getOwner()).to.equal(deployer.address)
        })

        it("Should have a 0 balance", async function () {
          expect(await ethers.provider.getBalance(await crowdfund.getAddress())).to.equal(0)
          expect(await crowdfund.getBalance()).to.equal(0)
        })
      })

      describe("Withdrawals", function () {
        describe("Validations", function () {
          it("Should revert with the right error if called when empty.", async function () {
            await expect(crowdfund.withdraw()).to.be.revertedWithCustomError(
              crowdfund,
              "Crowdfund__NothingToWithdraw()"
            )
          })

          it("Should revert with the right error if called by anyone except the owner", async function () {
            await expect(
              (crowdfund.connect(accountTwo) as Contract).withdraw()
            ).to.be.revertedWithCustomError(crowdfund, "Crowdfund__NotOwner()")
          })

          it("Shouldn't fail if the contract has a balance and the owner calls it", async function () {
            await (crowdfund.connect(accountTwo) as Contract).donate({
              value: ethers.parseEther("0.1"),
            })

            const balance = await crowdfund.getBalance()
            // Make sure it has a balance.
            expect(Number(balance)).to.equal(Number(ethers.parseEther("0.1")))

            // Transactions are sent using the first signer by default
            await expect(await crowdfund.withdraw()).not.to.be.reverted
          })

          it("Should fail if someone tried to donate nothing", async function () {
            await expect(
              crowdfund.donate({ value: ethers.parseEther("0") })
            ).to.be.revertedWithCustomError(crowdfund, "Crowdfund__NotEnoughEthSent()")
          })

          describe("Transfers", function () {
            it("Should transfer the funds to the owner", async function () {
              await (crowdfund.connect(accountTwo) as Contract).donate({
                value: ethers.parseEther("0.1"),
              })

              await expect(crowdfund.withdraw()).to.changeEtherBalances(
                [deployer, crowdfund],
                [ethers.parseEther("0.1"), ethers.parseEther("-0.1")]
              )
              expect(await crowdfund.getBalance()).to.equal(0)
            })
          })
        })
      })
    })

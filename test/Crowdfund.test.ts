import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Crowdfund", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCrowdfundFixture() {
    const goal = 100;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Crowdfund = await ethers.getContractFactory("Crowdfund");
    const crowdfund = await Crowdfund.deploy(goal);
    await crowdfund.deployed();

    return { crowdfund, owner, otherAccount };
  }
  async function deployAndAddBalance() {
    const { crowdfund, owner, otherAccount } = await loadFixture(deployCrowdfundFixture);
    await crowdfund.connect(otherAccount).donate({ value: ethers.utils.parseEther("0.5") });

    return { crowdfund, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right goal", async function () {
      const { crowdfund } = await loadFixture(deployCrowdfundFixture);

      let contractGoal = await crowdfund.goal();
      expect(Number(contractGoal)).to.equal(100);
    });

    it("Should set the right owner", async function () {
      const { crowdfund, owner } = await loadFixture(deployCrowdfundFixture);

      expect(await crowdfund.getOwner()).to.equal(owner.address);
    });

    it("Should have a 0 balance", async function () {
      const { crowdfund } = await loadFixture(deployCrowdfundFixture);

      expect(await ethers.provider.getBalance(crowdfund.address)).to.equal(0);
      expect(await crowdfund.getBalance()).to.equal(0);
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called when empty.", async function () {
        const { crowdfund } = await loadFixture(deployCrowdfundFixture);

        await expect(crowdfund.withdraw()).to.be.revertedWith(
          "sorry, nothing to withdraw."
        );
      });

      it("Should revert with the right error if called by anyone except the owner", async function () {
        const { crowdfund, otherAccount } = await loadFixture(deployCrowdfundFixture);

        await expect(crowdfund.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You do not own this contract."
        );
      });

      it("Shouldn't fail if the contract has a balance and the owner calls it", async function () {
        const { crowdfund } = await loadFixture(deployAndAddBalance);
        const balance = await crowdfund.getBalance();
        // Make sure it has a balance.
        expect(Number(balance)).to.equal(Number(ethers.utils.parseEther("0.5")));

        // Transactions are sent using the first signer by default
        await expect(await crowdfund.withdraw()).not.to.be.reverted;
      });


      describe("Transfers", function () {
        it("Should transfer the funds to the owner", async function () {
          const { crowdfund, owner } = await loadFixture(deployAndAddBalance);

          await expect(crowdfund.withdraw()).to.changeEtherBalances(
            [owner, crowdfund],
            [ethers.utils.parseEther("0.5"), ethers.utils.parseEther("-0.5")]
          );
          expect(await crowdfund.getBalance()).to.equal(0);
        });
      });
    });
  });
});

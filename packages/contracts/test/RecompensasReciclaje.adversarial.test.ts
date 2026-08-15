import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { RecompensasReciclaje } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RecompensasReciclaje (RECI) - Adversarial & Stress Test Suite", () => {
  async function deployAdversarialFixture() {
    const [admin, minter, pauser, attacker, victim, bystander, ...others] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("RecompensasReciclaje");
    const token = (await Factory.deploy(admin.address)) as RecompensasReciclaje;
    await token.waitForDeployment();

    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();
    const PAUSER_ROLE = await token.PAUSER_ROLE();

    return {
      token,
      admin,
      minter,
      pauser,
      attacker,
      victim,
      bystander,
      others,
      DEFAULT_ADMIN_ROLE,
      MINTER_ROLE,
      PAUSER_ROLE,
      Factory,
    };
  }

  describe("1. Massive Batch Scaling & Gas Limit Stress Testing", () => {
    it("should handle 50 recipients in a single batch with linear gas and atomic balances", async () => {
      const { token, admin } = await loadFixture(deployAdversarialFixture);

      const count = 50;
      const recipients: string[] = [];
      const amounts: bigint[] = [];
      let expectedTotal = 0n;

      for (let i = 0; i < count; i++) {
        const wallet = ethers.Wallet.createRandom();
        recipients.push(wallet.address);
        const amount = ethers.parseEther((i + 1).toString());
        amounts.push(amount);
        expectedTotal += amount;
      }

      const tx = await token.connect(admin).mintBatch(recipients, amounts);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const gasUsed = receipt?.gasUsed ? Number(receipt.gasUsed) : 0;
      const gasPerRecipient = gasUsed / count;

      console.log(`\n  [Gas Metric] Batch 50 recipients: total gas = ${gasUsed.toLocaleString()}, avg per recipient = ${Math.round(gasPerRecipient).toLocaleString()}`);

      expect(gasUsed).to.be.lessThan(2_500_000);
      expect(await token.totalSupply()).to.equal(expectedTotal);
      expect(await token.currentBatchId()).to.equal(1n);

      for (let i = 0; i < count; i++) {
        expect(await token.balanceOf(recipients[i])).to.equal(amounts[i]);
      }
    });

    it("should handle 100 recipients in a single batch and verify gas linearity O(N)", async () => {
      const { token, admin } = await loadFixture(deployAdversarialFixture);

      const count = 100;
      const recipients: string[] = [];
      const amounts: bigint[] = [];
      let expectedTotal = 0n;

      for (let i = 0; i < count; i++) {
        const wallet = ethers.Wallet.createRandom();
        recipients.push(wallet.address);
        const amount = ethers.parseEther("5.5");
        amounts.push(amount);
        expectedTotal += amount;
      }

      const tx = await token.connect(admin).mintBatch(recipients, amounts);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const gasUsed = receipt?.gasUsed ? Number(receipt.gasUsed) : 0;
      const gasPerRecipient = gasUsed / count;

      console.log(`  [Gas Metric] Batch 100 recipients: total gas = ${gasUsed.toLocaleString()}, avg per recipient = ${Math.round(gasPerRecipient).toLocaleString()}`);

      // 100 recipients should fit well below 5M gas (Ethereum block gas limit is 30M)
      expect(gasUsed).to.be.lessThan(5_000_000);
      expect(await token.totalSupply()).to.equal(expectedTotal);
      expect(await token.currentBatchId()).to.equal(1n);
    });

    it("should handle 150 recipients in a single batch without gas exhaustion", async () => {
      const { token, admin } = await loadFixture(deployAdversarialFixture);

      const count = 150;
      const recipients: string[] = [];
      const amounts: bigint[] = [];
      let expectedTotal = 0n;

      for (let i = 0; i < count; i++) {
        const wallet = ethers.Wallet.createRandom();
        recipients.push(wallet.address);
        const amount = ethers.parseEther("1.0");
        amounts.push(amount);
        expectedTotal += amount;
      }

      const tx = await token.connect(admin).mintBatch(recipients, amounts);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const gasUsed = receipt?.gasUsed ? Number(receipt.gasUsed) : 0;
      console.log(`  [Gas Metric] Batch 150 recipients: total gas = ${gasUsed.toLocaleString()}`);

      expect(gasUsed).to.be.lessThan(7_500_000);
      expect(await token.totalSupply()).to.equal(expectedTotal);
    });
  });

  describe("2. Unauthorized Privilege Escalation & Access Control Attacks", () => {
    it("should strictly reject unauthorized single mint, batch mint, pause, and unpause", async () => {
      const { token, attacker, victim, MINTER_ROLE, PAUSER_ROLE } =
        await loadFixture(deployAdversarialFixture);

      const amount = ethers.parseEther("1000");

      // Single mint
      await expect(token.connect(attacker).mint(attacker.address, amount))
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(attacker.address, MINTER_ROLE);

      // Batch mint
      await expect(
        token
          .connect(attacker)
          .mintBatch([attacker.address, victim.address], [amount, amount])
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(attacker.address, MINTER_ROLE);

      // Pause
      await expect(token.connect(attacker).pause())
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(attacker.address, PAUSER_ROLE);

      // Unpause
      await expect(token.connect(attacker).unpause())
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(attacker.address, PAUSER_ROLE);
    });

    it("should prevent attacker from granting MINTER_ROLE or DEFAULT_ADMIN_ROLE to themselves", async () => {
      const { token, attacker, DEFAULT_ADMIN_ROLE, MINTER_ROLE } =
        await loadFixture(deployAdversarialFixture);

      await expect(
        token.connect(attacker).grantRole(MINTER_ROLE, attacker.address)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(attacker.address, DEFAULT_ADMIN_ROLE);

      await expect(
        token.connect(attacker).grantRole(DEFAULT_ADMIN_ROLE, attacker.address)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(attacker.address, DEFAULT_ADMIN_ROLE);
    });

    it("should prevent attacker from revoking roles from legitimate admin or minter", async () => {
      const { token, admin, attacker, DEFAULT_ADMIN_ROLE, MINTER_ROLE } =
        await loadFixture(deployAdversarialFixture);

      await expect(
        token.connect(attacker).revokeRole(MINTER_ROLE, admin.address)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(attacker.address, DEFAULT_ADMIN_ROLE);

      await expect(
        token.connect(attacker).revokeRole(DEFAULT_ADMIN_ROLE, admin.address)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(attacker.address, DEFAULT_ADMIN_ROLE);
    });

    it("should immediately revoke minting ability when admin revokes MINTER_ROLE or minter renounces it", async () => {
      const { token, admin, minter, victim, MINTER_ROLE } =
        await loadFixture(deployAdversarialFixture);

      // Admin grants minter role
      await token.connect(admin).grantRole(MINTER_ROLE, minter.address);
      expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.true;

      // Minter can mint
      await token.connect(minter).mint(victim.address, ethers.parseEther("10"));

      // Minter renounces role
      await token.connect(minter).renounceRole(MINTER_ROLE, minter.address);
      expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.false;

      // Minter can no longer mint
      await expect(
        token.connect(minter).mint(victim.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });
  });

  describe("3. Extreme Values, Boundary Conditions & Duplicate Addresses", () => {
    it("should allow minting 0 amount in single mint without balance change", async () => {
      const { token, admin, victim } = await loadFixture(deployAdversarialFixture);

      await expect(token.connect(admin).mint(victim.address, 0n))
        .to.emit(token, "TokensMinted")
        .withArgs(victim.address, 0n, 0n);

      expect(await token.balanceOf(victim.address)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(0n);
    });

    it("should allow batch minting with 0 amounts and correctly emit events", async () => {
      const { token, admin, victim, bystander } = await loadFixture(
        deployAdversarialFixture
      );

      const recipients = [victim.address, bystander.address];
      const amounts = [0n, 0n];

      const tx = await token.connect(admin).mintBatch(recipients, amounts);
      await expect(tx)
        .to.emit(token, "BatchMintExecuted")
        .withArgs(1n, 2n, 0n);

      expect(await token.balanceOf(victim.address)).to.equal(0n);
      expect(await token.balanceOf(bystander.address)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(0n);
    });

    it("should accurately accumulate balances when duplicate recipient addresses appear in the same batch", async () => {
      const { token, admin, victim, bystander } = await loadFixture(
        deployAdversarialFixture
      );

      // Victim appears 4 times in the same batch
      const recipients = [
        victim.address,
        bystander.address,
        victim.address,
        victim.address,
        victim.address,
      ];
      const amounts = [
        ethers.parseEther("10.0"),
        ethers.parseEther("25.0"),
        ethers.parseEther("15.5"),
        ethers.parseEther("4.5"),
        ethers.parseEther("20.0"),
      ];
      // Total victim: 10 + 15.5 + 4.5 + 20 = 50.0
      // Total bystander: 25.0
      const totalExpected = ethers.parseEther("75.0");

      const tx = await token.connect(admin).mintBatch(recipients, amounts);
      await expect(tx)
        .to.emit(token, "BatchMintExecuted")
        .withArgs(1n, 5n, totalExpected);

      expect(await token.balanceOf(victim.address)).to.equal(
        ethers.parseEther("50.0")
      );
      expect(await token.balanceOf(bystander.address)).to.equal(
        ethers.parseEther("25.0")
      );
      expect(await token.totalSupply()).to.equal(totalExpected);
    });

    it("should allow max uint256 minting and enforce arithmetic overflow protection on subsequent mints", async () => {
      const { token, admin, victim } = await loadFixture(deployAdversarialFixture);

      const maxUint256 = ethers.MaxUint256;

      // Mint maximum possible uint256
      await token.connect(admin).mint(victim.address, maxUint256);
      expect(await token.balanceOf(victim.address)).to.equal(maxUint256);
      expect(await token.totalSupply()).to.equal(maxUint256);

      // Attempting to mint even 1 additional token must revert due to Solidity 0.8+ checked arithmetic overflow
      await expect(
        token.connect(admin).mint(victim.address, 1n)
      ).to.be.revertedWithPanic(0x11); // Panic code 0x11: Arithmetic overflow
    });

    it("should revert and rollback atomic state if address(0) is placed at start, middle, or end of batch", async () => {
      const { token, admin, victim, bystander } = await loadFixture(
        deployAdversarialFixture
      );

      // Test zero address at index 0
      await expect(
        token
          .connect(admin)
          .mintBatch(
            [ethers.ZeroAddress, victim.address],
            [ethers.parseEther("10"), ethers.parseEther("20")]
          )
      )
        .to.be.revertedWithCustomError(token, "ZeroAddressRecipient")
        .withArgs(0n);

      // Test zero address in middle (index 1 of 3)
      await expect(
        token.connect(admin).mintBatch(
          [victim.address, ethers.ZeroAddress, bystander.address],
          [
            ethers.parseEther("10"),
            ethers.parseEther("20"),
            ethers.parseEther("30"),
          ]
        )
      )
        .to.be.revertedWithCustomError(token, "ZeroAddressRecipient")
        .withArgs(1n);

      // Test zero address at last index (index 2 of 3)
      await expect(
        token.connect(admin).mintBatch(
          [victim.address, bystander.address, ethers.ZeroAddress],
          [
            ethers.parseEther("10"),
            ethers.parseEther("20"),
            ethers.parseEther("30"),
          ]
        )
      )
        .to.be.revertedWithCustomError(token, "ZeroAddressRecipient")
        .withArgs(2n);

      // Verify strict atomicity: victim balance remains 0, currentBatchId remains 0
      expect(await token.balanceOf(victim.address)).to.equal(0n);
      expect(await token.balanceOf(bystander.address)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(0n);
      expect(await token.currentBatchId()).to.equal(0n);
    });

    it("should revert if array lengths mismatch (recipients > amounts or amounts > recipients)", async () => {
      const { token, admin, victim, bystander } = await loadFixture(
        deployAdversarialFixture
      );

      // 2 recipients, 1 amount
      await expect(
        token
          .connect(admin)
          .mintBatch(
            [victim.address, bystander.address],
            [ethers.parseEther("10")]
          )
      )
        .to.be.revertedWithCustomError(token, "ArrayLengthMismatch")
        .withArgs(2n, 1n);

      // 1 recipient, 2 amounts
      await expect(
        token
          .connect(admin)
          .mintBatch(
            [victim.address],
            [ethers.parseEther("10"), ethers.parseEther("20")]
          )
      )
        .to.be.revertedWithCustomError(token, "ArrayLengthMismatch")
        .withArgs(1n, 2n);
    });
  });

  describe("4. State Machine & Pause / Unpause Invariants", () => {
    it("should revert double pause and double unpause calls", async () => {
      const { token, admin } = await loadFixture(deployAdversarialFixture);

      expect(await token.paused()).to.be.false;

      // Double unpause when already unpaused
      await expect(token.connect(admin).unpause()).to.be.revertedWithCustomError(
        token,
        "ExpectedPause"
      );

      // Pause
      await token.connect(admin).pause();
      expect(await token.paused()).to.be.true;

      // Double pause when already paused
      await expect(token.connect(admin).pause()).to.be.revertedWithCustomError(
        token,
        "EnforcedPause"
      );
    });

    it("should block all state-mutating actions when paused (mint, mintBatch, transfer, transferFrom, burn, burnFrom)", async () => {
      const { token, admin, victim, bystander } = await loadFixture(
        deployAdversarialFixture
      );

      // Setup initial tokens
      await token.connect(admin).mint(victim.address, ethers.parseEther("100"));
      await token
        .connect(victim)
        .approve(bystander.address, ethers.parseEther("50"));

      // Pause
      await token.connect(admin).pause();
      expect(await token.paused()).to.be.true;

      // 1. mint blocked
      await expect(
        token.connect(admin).mint(victim.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      // 2. mintBatch blocked
      await expect(
        token
          .connect(admin)
          .mintBatch([victim.address], [ethers.parseEther("10")])
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      // 3. transfer blocked
      await expect(
        token
          .connect(victim)
          .transfer(bystander.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      // 4. transferFrom blocked
      await expect(
        token
          .connect(bystander)
          .transferFrom(victim.address, bystander.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      // 5. burn blocked
      await expect(
        token.connect(victim).burn(ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      // 6. burnFrom blocked
      await expect(
        token.connect(bystander).burnFrom(victim.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      // Unpause restores everything
      await token.connect(admin).unpause();
      expect(await token.paused()).to.be.false;

      await expect(
        token
          .connect(victim)
          .transfer(bystander.address, ethers.parseEther("10"))
      ).to.emit(token, "Transfer");
    });

    it("should allow role management even when contract is paused", async () => {
      const { token, admin, minter, MINTER_ROLE } = await loadFixture(
        deployAdversarialFixture
      );

      await token.connect(admin).pause();
      expect(await token.paused()).to.be.true;

      // Role granting must still succeed during emergency pause
      await expect(token.connect(admin).grantRole(MINTER_ROLE, minter.address))
        .to.emit(token, "RoleGranted")
        .withArgs(MINTER_ROLE, minter.address, admin.address);

      expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.true;

      // Role revoking must still succeed during emergency pause
      await expect(token.connect(admin).revokeRole(MINTER_ROLE, minter.address))
        .to.emit(token, "RoleRevoked")
        .withArgs(MINTER_ROLE, minter.address, admin.address);

      expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });
  });

  describe("5. Sequential Batch Mint Invariants & Fuzzing", () => {
    it("should preserve total supply invariant across 10 sequential batch operations", async () => {
      const { token, admin } = await loadFixture(deployAdversarialFixture);

      let cumulativeExpected = 0n;

      for (let round = 1; round <= 10; round++) {
        const recipients = [
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
        ];
        const amounts = [
          ethers.parseEther((round * 10).toString()),
          ethers.parseEther((round * 5).toString()),
        ];
        const roundSum = amounts[0] + amounts[1];
        cumulativeExpected += roundSum;

        const tx = await token.connect(admin).mintBatch(recipients, amounts);
        const receipt = await tx.wait();
        expect(receipt?.status).to.equal(1);

        expect(await token.currentBatchId()).to.equal(BigInt(round));
        expect(await token.totalSupply()).to.equal(cumulativeExpected);
      }
    });
  });
});

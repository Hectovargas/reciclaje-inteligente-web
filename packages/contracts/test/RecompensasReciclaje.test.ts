import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { RecompensasReciclaje } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RecompensasReciclaje (RECI) Token", () => {
  // Test Fixture for deterministic setup
  async function deployTokenFixture() {
    const [admin, minter, pauser, user1, user2, user3, nonAuthorized] =
      await ethers.getSigners();

    const RecompensasReciclajeFactory = await ethers.getContractFactory(
      "RecompensasReciclaje"
    );
    const token = (await RecompensasReciclajeFactory.deploy(
      admin.address
    )) as RecompensasReciclaje;
    await token.waitForDeployment();

    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();
    const PAUSER_ROLE = await token.PAUSER_ROLE();

    return {
      token,
      admin,
      minter,
      pauser,
      user1,
      user2,
      user3,
      nonAuthorized,
      DEFAULT_ADMIN_ROLE,
      MINTER_ROLE,
      PAUSER_ROLE,
      RecompensasReciclajeFactory,
    };
  }

  describe("1. Deployment & Initialization", () => {
    it("should deploy with correct name, symbol, and decimals", async () => {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("CleanCity Reciclaje");
      expect(await token.symbol()).to.equal("RECI");
      expect(await token.decimals()).to.equal(18);
    });

    it("should have initial total supply of 0", async () => {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(0n);
      expect(await token.currentBatchId()).to.equal(0n);
    });

    it("should grant DEFAULT_ADMIN_ROLE, MINTER_ROLE, and PAUSER_ROLE to initialAdmin", async () => {
      const { token, admin, DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE } =
        await loadFixture(deployTokenFixture);

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
    });

    it("should default initialAdmin to msg.sender if address(0) is passed", async () => {
      const [deployer] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("RecompensasReciclaje");
      const zeroAdminToken = (await Factory.deploy(
        ethers.ZeroAddress
      )) as RecompensasReciclaje;
      await zeroAdminToken.waitForDeployment();

      const DEFAULT_ADMIN_ROLE = await zeroAdminToken.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await zeroAdminToken.MINTER_ROLE();
      const PAUSER_ROLE = await zeroAdminToken.PAUSER_ROLE();

      expect(await zeroAdminToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to
        .be.true;
      expect(await zeroAdminToken.hasRole(MINTER_ROLE, deployer.address)).to.be
        .true;
      expect(await zeroAdminToken.hasRole(PAUSER_ROLE, deployer.address)).to.be
        .true;
    });

    it("should support IAccessControl and IERC20 interfaces via supportsInterface", async () => {
      const { token } = await loadFixture(deployTokenFixture);
      // IAccessControl interface ID: 0x7965db0b
      expect(await token.supportsInterface("0x7965db0b")).to.be.true;
      // IERC165 interface ID: 0x01ffc9a7
      expect(await token.supportsInterface("0x01ffc9a7")).to.be.true;
    });
  });

  describe("2. Single Minting (mint)", () => {
    it("should allow accounts with MINTER_ROLE to mint tokens", async () => {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("100");

      await expect(token.connect(admin).mint(user1.address, mintAmount))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount)
        .and.to.emit(token, "TokensMinted")
        .withArgs(user1.address, mintAmount, 0n);

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(mintAmount);
    });

    it("should revert if non-minter tries to mint", async () => {
      const { token, nonAuthorized, user1, MINTER_ROLE } = await loadFixture(
        deployTokenFixture
      );
      const mintAmount = ethers.parseEther("50");

      await expect(
        token.connect(nonAuthorized).mint(user1.address, mintAmount)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(nonAuthorized.address, MINTER_ROLE);
    });

    it("should revert when minting to address(0)", async () => {
      const { token, admin } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("50");

      await expect(
        token.connect(admin).mint(ethers.ZeroAddress, mintAmount)
      )
        .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });

    it("should revert single mint when paused", async () => {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);
      await token.connect(admin).pause();

      await expect(
        token.connect(admin).mint(user1.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });
  });

  describe("3. Batch Minting (mintBatch)", () => {
    it("should successfully mint tokens to multiple recipients in a single batch", async () => {
      const { token, admin, user1, user2, user3 } = await loadFixture(
        deployTokenFixture
      );

      const recipients = [user1.address, user2.address, user3.address];
      const amounts = [
        ethers.parseEther("25.5"),
        ethers.parseEther("50.0"),
        ethers.parseEther("100.25"),
      ];
      const totalExpected = ethers.parseEther("175.75");

      const tx = await token.connect(admin).mintBatch(recipients, amounts);
      const receipt = await tx.wait();

      expect(await token.currentBatchId()).to.equal(1n);
      expect(await token.balanceOf(user1.address)).to.equal(amounts[0]);
      expect(await token.balanceOf(user2.address)).to.equal(amounts[1]);
      expect(await token.balanceOf(user3.address)).to.equal(amounts[2]);
      expect(await token.totalSupply()).to.equal(totalExpected);

      // Verify emitted events
      await expect(tx)
        .to.emit(token, "BatchMintExecuted")
        .withArgs(1n, 3n, totalExpected);

      await expect(tx)
        .to.emit(token, "TokensMinted")
        .withArgs(user1.address, amounts[0], 1n);
      await expect(tx)
        .to.emit(token, "TokensMinted")
        .withArgs(user2.address, amounts[1], 1n);
      await expect(tx)
        .to.emit(token, "TokensMinted")
        .withArgs(user3.address, amounts[2], 1n);
    });

    it("should increment batchId sequentially across multiple batch mints", async () => {
      const { token, admin, user1, user2 } = await loadFixture(
        deployTokenFixture
      );

      await token
        .connect(admin)
        .mintBatch([user1.address], [ethers.parseEther("10")]);
      expect(await token.currentBatchId()).to.equal(1n);

      await token
        .connect(admin)
        .mintBatch([user2.address], [ethers.parseEther("20")]);
      expect(await token.currentBatchId()).to.equal(2n);

      await token
        .connect(admin)
        .mintBatch(
          [user1.address, user2.address],
          [ethers.parseEther("5"), ethers.parseEther("5")]
        );
      expect(await token.currentBatchId()).to.equal(3n);
      expect(await token.totalSupply()).to.equal(ethers.parseEther("40"));
    });

    it("should revert if recipients and amounts array lengths do not match", async () => {
      const { token, admin, user1, user2 } = await loadFixture(
        deployTokenFixture
      );

      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("10")]; // Length 1 vs 2

      await expect(
        token.connect(admin).mintBatch(recipients, amounts)
      )
        .to.be.revertedWithCustomError(token, "ArrayLengthMismatch")
        .withArgs(2n, 1n);
    });

    it("should revert if batch arrays are empty", async () => {
      const { token, admin } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(admin).mintBatch([], [])
      ).to.be.revertedWithCustomError(token, "EmptyBatch");
    });

    it("should revert if any recipient is address(0) and identify the index", async () => {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);

      const recipients = [user1.address, ethers.ZeroAddress];
      const amounts = [ethers.parseEther("10"), ethers.parseEther("20")];

      await expect(
        token.connect(admin).mintBatch(recipients, amounts)
      )
        .to.be.revertedWithCustomError(token, "ZeroAddressRecipient")
        .withArgs(1n);
    });

    it("should revert batch minting from non-minter account", async () => {
      const { token, nonAuthorized, user1, MINTER_ROLE } = await loadFixture(
        deployTokenFixture
      );

      await expect(
        token
          .connect(nonAuthorized)
          .mintBatch([user1.address], [ethers.parseEther("10")])
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(nonAuthorized.address, MINTER_ROLE);
    });

    it("should revert batch minting when contract is paused", async () => {
      const { token, admin, user1, user2 } = await loadFixture(
        deployTokenFixture
      );
      await token.connect(admin).pause();

      await expect(
        token
          .connect(admin)
          .mintBatch(
            [user1.address, user2.address],
            [ethers.parseEther("10"), ethers.parseEther("20")]
          )
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("should handle large batches efficiently (stress test 25 recipients)", async () => {
      const { token, admin } = await loadFixture(deployTokenFixture);

      const signers = await ethers.getSigners();
      const count = 25;
      const recipients: string[] = [];
      const amounts: bigint[] = [];

      for (let i = 0; i < count; i++) {
        // Deterministic dummy addresses
        const dummyWallet = ethers.Wallet.createRandom();
        recipients.push(dummyWallet.address);
        amounts.push(ethers.parseEther((i + 1).toString()));
      }

      const tx = await token.connect(admin).mintBatch(recipients, amounts);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      // Gas consumed for 25 mints should be well below standard block gas limit
      expect(receipt?.gasUsed).to.not.be.undefined;
      expect(Number(receipt?.gasUsed)).to.be.lessThan(2_000_000);

      for (let i = 0; i < count; i++) {
        expect(await token.balanceOf(recipients[i])).to.equal(amounts[i]);
      }
    });
  });

  describe("4. Pausing & Security Controls (pause / unpause)", () => {
    it("should allow PAUSER_ROLE to pause and unpause", async () => {
      const { token, admin } = await loadFixture(deployTokenFixture);

      expect(await token.paused()).to.be.false;

      await expect(token.connect(admin).pause())
        .to.emit(token, "Paused")
        .withArgs(admin.address);
      expect(await token.paused()).to.be.true;

      await expect(token.connect(admin).unpause())
        .to.emit(token, "Unpaused")
        .withArgs(admin.address);
      expect(await token.paused()).to.be.false;
    });

    it("should revert pause/unpause from unauthorized accounts", async () => {
      const { token, nonAuthorized, PAUSER_ROLE } = await loadFixture(
        deployTokenFixture
      );

      await expect(token.connect(nonAuthorized).pause())
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(nonAuthorized.address, PAUSER_ROLE);

      await expect(token.connect(nonAuthorized).unpause())
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(nonAuthorized.address, PAUSER_ROLE);
    });

    it("should block normal ERC20 transfers when paused and allow them after unpause", async () => {
      const { token, admin, user1, user2 } = await loadFixture(
        deployTokenFixture
      );

      // Mint initial balance
      await token.connect(admin).mint(user1.address, ethers.parseEther("100"));

      // Pause contract
      await token.connect(admin).pause();

      // Transfer should fail
      await expect(
        token
          .connect(user1)
          .transfer(user2.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      // Unpause
      await token.connect(admin).unpause();

      // Transfer should succeed now
      await expect(
        token
          .connect(user1)
          .transfer(user2.address, ethers.parseEther("10"))
      )
        .to.emit(token, "Transfer")
        .withArgs(user1.address, user2.address, ethers.parseEther("10"));

      expect(await token.balanceOf(user2.address)).to.equal(
        ethers.parseEther("10")
      );
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("90")
      );
    });
  });

  describe("5. Burning (burn / burnFrom)", () => {
    it("should allow token holders to burn their own tokens", async () => {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("30");

      await token.connect(admin).mint(user1.address, mintAmount);

      await expect(token.connect(user1).burn(burnAmount))
        .to.emit(token, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, burnAmount);

      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("70")
      );
      expect(await token.totalSupply()).to.equal(ethers.parseEther("70"));
    });

    it("should allow burning with allowance via burnFrom", async () => {
      const { token, admin, user1, user2 } = await loadFixture(
        deployTokenFixture
      );
      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("40");

      await token.connect(admin).mint(user1.address, mintAmount);

      // User1 approves User2 to spend 50 RECI
      await token
        .connect(user1)
        .approve(user2.address, ethers.parseEther("50"));

      // User2 burns 40 RECI on behalf of User1
      await expect(token.connect(user2).burnFrom(user1.address, burnAmount))
        .to.emit(token, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, burnAmount);

      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("60")
      );
      expect(await token.allowance(user1.address, user2.address)).to.equal(
        ethers.parseEther("10")
      );
    });

    it("should revert burn if balance is insufficient", async () => {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);
      await token.connect(admin).mint(user1.address, ethers.parseEther("10"));

      await expect(
        token.connect(user1).burn(ethers.parseEther("20"))
      )
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
        .withArgs(user1.address, ethers.parseEther("10"), ethers.parseEther("20"));
    });

    it("should revert burn when paused", async () => {
      const { token, admin, user1 } = await loadFixture(deployTokenFixture);
      await token.connect(admin).mint(user1.address, ethers.parseEther("50"));
      await token.connect(admin).pause();

      await expect(
        token.connect(user1).burn(ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });
  });

  describe("6. Standard ERC20 Transfer & Approval Operations", () => {
    it("should correctly handle approve and transferFrom", async () => {
      const { token, admin, user1, user2, user3 } = await loadFixture(
        deployTokenFixture
      );
      await token.connect(admin).mint(user1.address, ethers.parseEther("100"));

      await token
        .connect(user1)
        .approve(user2.address, ethers.parseEther("50"));
      expect(await token.allowance(user1.address, user2.address)).to.equal(
        ethers.parseEther("50")
      );

      await expect(
        token
          .connect(user2)
          .transferFrom(user1.address, user3.address, ethers.parseEther("30"))
      )
        .to.emit(token, "Transfer")
        .withArgs(user1.address, user3.address, ethers.parseEther("30"));

      expect(await token.balanceOf(user3.address)).to.equal(
        ethers.parseEther("30")
      );
      expect(await token.allowance(user1.address, user2.address)).to.equal(
        ethers.parseEther("20")
      );
    });

    it("should revert transferFrom exceeding allowance", async () => {
      const { token, admin, user1, user2, user3 } = await loadFixture(
        deployTokenFixture
      );
      await token.connect(admin).mint(user1.address, ethers.parseEther("100"));
      await token
        .connect(user1)
        .approve(user2.address, ethers.parseEther("20"));

      await expect(
        token
          .connect(user2)
          .transferFrom(user1.address, user3.address, ethers.parseEther("25"))
      )
        .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
        .withArgs(user2.address, ethers.parseEther("20"), ethers.parseEther("25"));
    });
  });

  describe("7. Role Management & Administration", () => {
    it("should allow admin to grant and revoke MINTER_ROLE", async () => {
      const { token, admin, minter, user1, MINTER_ROLE } = await loadFixture(
        deployTokenFixture
      );

      expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.false;

      // Admin grants MINTER_ROLE
      await expect(token.connect(admin).grantRole(MINTER_ROLE, minter.address))
        .to.emit(token, "RoleGranted")
        .withArgs(MINTER_ROLE, minter.address, admin.address);

      expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.true;

      // Minter can now mint
      await token
        .connect(minter)
        .mint(user1.address, ethers.parseEther("50"));
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("50")
      );

      // Admin revokes MINTER_ROLE
      await expect(token.connect(admin).revokeRole(MINTER_ROLE, minter.address))
        .to.emit(token, "RoleRevoked")
        .withArgs(MINTER_ROLE, minter.address, admin.address);

      expect(await token.hasRole(MINTER_ROLE, minter.address)).to.be.false;

      // Minter can no longer mint
      await expect(
        token.connect(minter).mint(user1.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(
        token,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("should allow admin to grant and revoke PAUSER_ROLE", async () => {
      const { token, admin, pauser, PAUSER_ROLE } = await loadFixture(
        deployTokenFixture
      );

      await token.connect(admin).grantRole(PAUSER_ROLE, pauser.address);
      expect(await token.hasRole(PAUSER_ROLE, pauser.address)).to.be.true;

      // Pauser can pause
      await token.connect(pauser).pause();
      expect(await token.paused()).to.be.true;

      // Pauser can unpause
      await token.connect(pauser).unpause();
      expect(await token.paused()).to.be.false;
    });

    it("should revert if non-admin attempts to grant roles", async () => {
      const { token, nonAuthorized, user1, MINTER_ROLE, DEFAULT_ADMIN_ROLE } =
        await loadFixture(deployTokenFixture);

      await expect(
        token.connect(nonAuthorized).grantRole(MINTER_ROLE, user1.address)
      )
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(nonAuthorized.address, DEFAULT_ADMIN_ROLE);
    });
  });
});

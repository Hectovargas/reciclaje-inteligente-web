import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==================================================");
  console.log("   Deploying CleanCity Reciclaje (RECI) Token     ");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Network:          ${network.name} (Chain ID: ${network.config.chainId ?? "unknown"})`);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} ETH`);

  // Target admin can be specified via env or defaults to deployer
  const initialAdmin = process.env.ADMIN_ADDRESS || process.env.OPERATOR_ADDRESS || deployer.address;
  console.log(`Initial Admin:    ${initialAdmin}`);

  // Deploy RecompensasReciclaje
  const RecompensasReciclaje = await ethers.getContractFactory("RecompensasReciclaje");
  const token = await RecompensasReciclaje.deploy(initialAdmin);
  await token.waitForDeployment();

  const contractAddress = await token.getAddress();
  console.log(`\n Contract deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Token Name:       ${await token.name()}`);
  console.log(`Token Symbol:     ${await token.symbol()}`);
  console.log(`Total Supply:     ${await token.totalSupply()}`);

  // Check roles
  const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await token.MINTER_ROLE();
  const PAUSER_ROLE = await token.PAUSER_ROLE();

  console.log(`\nRole Configuration for ${initialAdmin}:`);
  console.log(`- DEFAULT_ADMIN_ROLE: ${await token.hasRole(DEFAULT_ADMIN_ROLE, initialAdmin)}`);
  console.log(`- MINTER_ROLE:        ${await token.hasRole(MINTER_ROLE, initialAdmin)}`);
  console.log(`- PAUSER_ROLE:        ${await token.hasRole(PAUSER_ROLE, initialAdmin)}`);

  // Export deployment details for backend & frontend integration
  const artifactPath = path.join(__dirname, "../artifacts/contracts/RecompensasReciclaje.sol/RecompensasReciclaje.json");
  let contractAbi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    contractAbi = artifact.abi;
  }

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId ?? 31337,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    initialAdmin: initialAdmin,
    name: "CleanCity Reciclaje",
    symbol: "RECI",
    decimals: 18,
    deployedAt: new Date().toISOString(),
    abi: contractAbi,
  };

  const outputDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${network.name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2), "utf8");
  console.log(`\n Deployment metadata saved to: ${outputPath}`);

  console.log("\n==================================================");
  console.log("               Deployment Complete!               ");
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

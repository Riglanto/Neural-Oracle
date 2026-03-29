import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  async function deploy(name: string, args: any[]) {
    console.log(`Deploying ${name}...`);
    const F = await ethers.getContractFactory(name);
    const c = await F.deploy(...args);
    await c.waitForDeployment();
    const addr = await c.getAddress();
    console.log(`  ${name}: ${addr}`);
    await new Promise(r => setTimeout(r, 3000));
    return addr;
  }

  const identity = await deploy("MockIdentityRegistry", []);
  const reputation = await deploy("MockReputationRegistry", []);
  const oracle = await deploy("NeuralOracle", [deployer.address]);

  console.log(`\nDone!\n  IDENTITY=${identity}\n  REPUTATION=${reputation}\n  ORACLE=${oracle}`);
}

main().catch(console.error);

import { ethers } from "hardhat";

async function main() {
  const ETHToken = await ethers.getContractFactory("ETHToken");
  const ethToken = await ETHToken.deploy();

  await ethToken.deployed();

  console.log(`ETHToken deployed to ${ethToken.address}`);

  const PavloDemkovskyi = "0x7A34b2f0DA5ea35b5117CaC735e99Ba0e2aCEECD"
  const ETHBridge = await ethers.getContractFactory("ETHBridge");
  const ethBridge = await ETHBridge.deploy(PavloDemkovskyi, '0xe');

  await ethBridge.deployed();

  console.log(`ETHBridge deployed to ${ethBridge.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

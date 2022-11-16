import { ethers } from "hardhat";

async function main() {
  const PavloDemkovskyi = "0x7A34b2f0DA5ea35b5117CaC735e99Ba0e2aCEECD"

  const BSCToken = await ethers.getContractFactory("BSCToken");
  const bscToken = await BSCToken.deploy();

  await bscToken.deployed();

  const BSCBridge = await ethers.getContractFactory("BSCBridge");
  const bscBridge = await BSCBridge.deploy(PavloDemkovskyi, '0xe');

  await bscBridge.deployed();

  console.log(`BSCToken deployed to ${bscToken.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

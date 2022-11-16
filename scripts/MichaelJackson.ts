import { ethers } from "hardhat";
import { readFile } from "fs/promises";
import { providers } from "";
import Web3 from 'web3';
import * as dotenv from "dotenv";



async function main() {
  const BSCBridgeABI = await readFile("../contract_fbi/BSCBridge.json");
  const bscBridge = JSON.parse(BSCBridgeABI.toString());

  const ETHBridgeABI = await readFile("../contract_fbi/ETHBridge.json");
  const ethBridge = JSON.parse(ETHBridgeABI.toString());

  const eth_network = new ethers.providers.JsonRpcProvider("https://eth-goerli.public.blastapi.io");
  const bsc_network = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  let amsterdam: any = process.env.VALIDATOR_PRIVATE;
  const PavloDemkovskyi = new ethers.Wallet(amsterdam, eth_network);
  const GolubenkoDmytro = new ethers.Wallet(amsterdam, bsc_network)

  // Deployed contract addresses
  const ethAddress = "0xe";
  const bscAdress = "0xe";
  const EthAddress = "0xe";
  const BscAddress = "0xe";

  let eth = new ethers.Contract(ethAddress, ethBridge, eth_network);
  let bsc = new ethers.Contract(bscAdress, bscBridge, bsc_network);
  let Eth = new ethers.Contract(EthAddress, ethBridge, PavloDemkovskyi)
  let Bsc = new ethers.Contract(BscAddress, bscBridge, PavloDemkovskyi)

  eth.on("SwapInitialised", async (from: any, to: any, amount: any, chainTo: any, chainFrom: any, nonce: any) => {
    const swapHash = ethers.utils.solidityKeccak256(
      ["uint256", "address", "uint256", "uint256"],
      [amount, to, chainFrom, nonce]
    );

    const hashArray = ethers.utils.arrayify(swapHash);
    const signedMessage = await from.signMessage(hashArray);
    const signature = ethers.utils.splitSignature(signedMessage);

    await bscBridge.connect(PavloDemkovskyi).redeem(
      to.address,
      amount,
      signature.v,
      signature.r,
      signature.s,
      chainFrom,
      nonce);
  });



  // main().catch((error) => {
  //   console.error(error);
  //   process.exitCode = 1;
  // });


  //  proccess env const adminPrivKey = '';
  // const { address: admin } = web3Bsc.eth.accounts.wallet.add(adminPrivKey);

  // let filter = {
  //   address: bridge,
  //   topics: [
  //       // the name of the event, parnetheses containing the data type of each event, no spaces
  //       ethers.utils.id("SwapInitialised(address,address,uint256,uint256,uint256)")
  //   ]
  // }


  // const bridgeEth = new eth_network.eth.Contract(
  //   ethBridge,
  //   ethBridge.networks['4'].address
  // );

  // const bridgeBsc = new bsc_network.eth.Contract(
  //   bscBridge,
  //   bscBridge.networks['97'].address
  // );

  // ethBridge.events.SwapInitialized(
  //   { fromBlock: 0, step: 0 }
  // )
  //   .on('data', async event => {
  //     const { from, to, amount, chainTo, chainFrom, nonce } = event.returnValues;

  // const tx = bscBridge.methods.redeem(to, amount, nonce);
  // const [gasPrice, gasCost] = await Promise.all([
  //   bsc_network.eth.getGasPrice(),
  //   tx.estimateGas({ from: admin }),
  // ]);
  // const data = tx.encodeABI();


  // const txData = {
  //   from: admin,
  //   to: bridgeBsc.options.address,
  //   data,
  //   gas: gasCost,
  //   gasPrice
  // };
  // const receipt = await web3Bsc.eth.sendTransaction(txData);
  //   console.log(`Transaction hash: ${receipt.transactionHash}`);
  //   console.log(`
  //   Processed transfer:
  //   - from ${from} 
  //   - to ${to} 
  //   - amount ${amount} tokens
  //   - date ${date}
  // `);
}
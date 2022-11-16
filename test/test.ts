import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";


describe("Bridge", function () {
  let ETOKEN: ContractFactory;
  let etoken: Contract;
  let BTOKEN: ContractFactory;
  let btoken: Contract;
  let ETHBridge: ContractFactory;
  let ethBridge: Contract;
  let BSCBridge: ContractFactory;
  let bscBridge: Contract;
  let Subaru: SignerWithAddress;
  let Ram: SignerWithAddress;
  let Rem: SignerWithAddress;

  const hardhatChainId = 31337;
  const bscChainId = 97;

  before(async function () {
    [Subaru, Ram, Rem] = await ethers.getSigners();
  });

  beforeEach(async function () {
    ETOKEN = await ethers.getContractFactory("ETHToken");
    etoken = await ETOKEN.deploy();
    await etoken.deployed();

    ETHBridge = await ethers.getContractFactory("ETHBridge");
    ethBridge = await ETHBridge.deploy(Subaru.address, etoken.address);
    await ethBridge.deployed();

    BTOKEN = await ethers.getContractFactory("BSCToken");
    btoken = await BTOKEN.deploy();
    await btoken.deployed();

    BSCBridge = await ethers.getContractFactory("BSCBridge");
    bscBridge = await BSCBridge.deploy(Subaru.address, btoken.address);
    await bscBridge.deployed();

    await etoken.grantRole(etoken.DEFAULT_ADMIN_ROLE(), ethBridge.address);
    await btoken.grantRole(btoken.DEFAULT_ADMIN_ROLE(), bscBridge.address);
  });

  describe("addChain", function () {
    it("Should add chain correctly", async function () {
      await expect(ethBridge.addChain(bscChainId)).to.emit(ethBridge, "ChainAdded").withArgs(bscChainId, Subaru.address);
    })

    it("Should fail(AccessControl)", async function () {
      expect(ethBridge.connect(Rem).addChain(bscChainId)).to.be.revertedWith('revertMessage');
    })
  })

  describe("removeChain", function () {
    it("Should remove chain correctly", async function () {
      await expect(ethBridge.removeChain(bscChainId)).to.emit(ethBridge, "ChainRemoved").withArgs(bscChainId, Subaru.address);
    })

    it("Should fail(AccessControl)", async function () {
      expect(ethBridge.connect(Ram).removeChain(bscChainId)).to.be.revertedWith("revertMessage");
    })
  })

  describe("swap", function () {
    it("Should swap correctly", async function () {
      const amount = 100;
      const nonce = 1;

      await etoken.mint(Ram.address, amount);
      await ethBridge.addChain(bscChainId);

      await expect(ethBridge.connect(Ram)
        .swap(amount, Ram.address, bscChainId, nonce))
        .to.emit(ethBridge, "SwapInitialized")
        .withArgs(
          Ram.address,
          Ram.address,
          amount,
          bscChainId,
          hardhatChainId,
          nonce
        );
    })

    it("Should fail(Invalid chain)", async function () {
      const amount = 100;
      const nonce = 1;

      await etoken.mint(Ram.address, amount);
      await ethBridge.addChain(bscChainId);

      expect(ethBridge.connect(Ram)
        .swap(amount, Ram.address, 420, nonce))
        .to.be.revertedWith("This chain is not supported!")
    })
  })

  describe("redeem", function () {
    it("Should redeem correctly", async function () {
      const amount = 100;
      const nonce = 1;

      await etoken.mint(Ram.address, amount);
      await ethBridge.addChain(bscChainId);
      await bscBridge.addChain(hardhatChainId);

      await ethBridge.connect(Ram).swap(amount, Ram.address, bscChainId, nonce);

      const swapHash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "uint256"],
        [amount, Ram.address, hardhatChainId, nonce]
      );

      const hashArray = ethers.utils.arrayify(swapHash);
      const signedMessage = await Subaru.signMessage(hashArray);
      const signature = ethers.utils.splitSignature(signedMessage);

      await expect(bscBridge.redeem(
        Ram.address,
        amount,
        signature.v,
        signature.r,
        signature.s,
        hardhatChainId,
        nonce))
        .to.emit(bscBridge, "SwapRedeemed")
        .withArgs(amount, Ram.address, hardhatChainId, swapHash
        );

      expect(await btoken.connect(Ram).balanceOf(Ram.address))
        .to.equal(BigNumber.from(100));
    })

    it("Should fail to redeem", async function () {
      const amount = 100;
      const nonce = 1;

      await etoken.mint(Ram.address, amount);
      await ethBridge.addChain(bscChainId);
      await bscBridge.addChain(hardhatChainId);

      await ethBridge.connect(Ram).swap(amount, Ram.address, bscChainId, nonce);

      const swapHash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "uint256"],
        [amount, Ram.address, hardhatChainId, nonce]
      );

      const hashArray = ethers.utils.arrayify(swapHash);
      const signedMessage = await Subaru.signMessage(hashArray);
      const signature = ethers.utils.splitSignature(signedMessage);

      expect(bscBridge.connect(Ram).redeem(
        Ram.address,
        amount,
        signature.v,
        signature.r,
        signature.s,
        hardhatChainId,
        nonce)).to.be.
        revertedWith("Not a validator!");
    })

    it("Should fail to redeem(This chain is not supported!)", async function () {
      const amount = 100;
      const nonce = 1;

      await etoken.mint(Ram.address, amount);
      await ethBridge.addChain(bscChainId);
      await bscBridge.addChain(hardhatChainId);

      await ethBridge.connect(Ram).swap(amount, Ram.address, bscChainId, nonce);

      const swapHash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "uint256"],
        [amount, Ram.address, hardhatChainId, nonce]
      );

      const hashArray = ethers.utils.arrayify(swapHash);
      const signedMessage = await Subaru.signMessage(hashArray);
      const signature = ethers.utils.splitSignature(signedMessage);

      expect(bscBridge.redeem(
        Ram.address,
        amount,
        signature.v,
        signature.r,
        signature.s,
        32,
        nonce)).to.be.
        revertedWith("This chain is not supported!");
    })

    it("Should fail to redeem(You can only redeem once!)", async function () {
      const amount = 100;
      const nonce = 1;

      await etoken.mint(Ram.address, amount);
      await ethBridge.addChain(bscChainId);
      await bscBridge.addChain(hardhatChainId);

      await ethBridge.connect(Ram).swap(amount, Ram.address, bscChainId, nonce);

      const swapHash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "uint256"],
        [amount, Ram.address, hardhatChainId, nonce]
      );

      const hashArray = ethers.utils.arrayify(swapHash);
      const signedMessage = await Subaru.signMessage(hashArray);
      const signature = ethers.utils.splitSignature(signedMessage);

      await bscBridge.connect(Subaru).redeem(
        Ram.address,
        amount,
        signature.v,
        signature.r,
        signature.s,
        hardhatChainId,
        nonce);

      expect(bscBridge.connect(Subaru).redeem(
        Ram.address,
        amount,
        signature.v,
        signature.r,
        signature.s,
        hardhatChainId,
        nonce)).to.be.revertedWith("You can only redeem once!");

    })

    it("Should fail to redeem(Invalid signature)", async function () {
      const amount = 100;
      const nonce = 1;

      await etoken.mint(Ram.address, amount);
      await ethBridge.addChain(bscChainId);
      await bscBridge.addChain(hardhatChainId);

      await ethBridge.connect(Ram).swap(amount, Ram.address, bscChainId, nonce);

      const swapHash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "uint256"],
        [420, Ram.address, 22, nonce]
      );

      const hashArray = ethers.utils.arrayify(swapHash);
      const wrongMessage = await Subaru.signMessage(hashArray);
      const wrongSignature = ethers.utils.splitSignature(wrongMessage);

      await expect(bscBridge.connect(Subaru).redeem(
        Ram.address,
        amount,
        wrongSignature.v,
        wrongSignature.r,
        wrongSignature.s,
        hardhatChainId,
        nonce
      )).to.be.revertedWith("Invalid signature!");
    })
  })
});

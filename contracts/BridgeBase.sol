// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
import {TokenBase} from "./TokenBase.sol";

contract BridgeBase is AccessControl {
    using ECDSA for bytes32;
    TokenBase token;
    address public validator;

    mapping(uint256 => bool) supportedChains;
    mapping(bytes32 => bool) redeemed;

    event SwapInitialized(
        address from,
        address to,
        uint256 amount,
        uint256 chainTo,
        uint256 chainFrom,
        uint256 nonce
    );

    event SwapRedeemed(
        uint256 amount,
        address to,
        uint256 chainFrom,
        bytes32 swapHash
    );

    event ChainAdded(uint256 id, address from);

    event ChainRemoved(uint256 id, address from);

    function swap(
        uint256 amount,
        address to,
        uint256 chainTo,
        uint256 nonce
    ) public {
        require(supportedChains[chainTo], "This chain is not supported!");

        token.burn(msg.sender, amount);

        emit SwapInitialized(
            msg.sender,
            to,
            amount,
            chainTo,
            block.chainid,
            nonce
        );
    }

    function redeem(
        address to,
        uint amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint chainFrom,
        uint nonce
    ) public {
        require(msg.sender == validator, "Not a validator!");
        require(supportedChains[chainFrom], "This chain is not supported!");

        bytes32 swapHash = keccak256(
            abi.encodePacked(amount, to, chainFrom, nonce)
        );

        require(!redeemed[swapHash], "You can only redeem once!");

        address signer = ECDSA.recover(
            swapHash.toEthSignedMessageHash(),
            v,
            r,
            s
        );

        require(signer == validator, "Invalid signature!");

        redeemed[swapHash] = true;
        token.mint(to, amount);

        emit SwapRedeemed(amount, to, chainFrom, swapHash);
    }

    function addChain(uint256 _id) public onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedChains[_id] = true;

        emit ChainAdded(_id, msg.sender);
    }

    function removeChain(uint256 _id) public onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedChains[_id] = false;

        emit ChainRemoved(_id, msg.sender);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./TokenBase.sol";

contract ETHToken is TokenBase("Oooh", "OOO") {
    constructor() {
        _setupRole(OWNER, msg.sender);
    }
}

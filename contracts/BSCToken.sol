// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./TokenBase.sol";

contract BSCToken is TokenBase("Yeeeah", "YEA") {
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}

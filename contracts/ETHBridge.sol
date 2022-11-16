// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "./BridgeBase.sol";

contract ETHBridge is BridgeBase {
    constructor(address _validator, address _token) {
        validator = _validator;
        token = TokenBase(_token);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
